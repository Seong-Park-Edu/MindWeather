using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
using MindWeatherServer.Helpers;
using MindWeatherServer.Models;
using MindWeatherServer.Services;

namespace MindWeatherServer.Controllers
{
    [Route("api/comfort-messages")]
    [ApiController]
    [Authorize]
    public class ComfortMessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PushNotificationService _pushService;
        private readonly GeminiService _geminiService;

        public ComfortMessagesController(
            AppDbContext context,
            PushNotificationService pushService,
            GeminiService geminiService)
        {
            _context = context;
            _pushService = pushService;
            _geminiService = geminiService;
        }

        [HttpPost]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            var senderId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (senderId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var isContentSafe = await _geminiService.CheckContentSafety(request.Content);
            if (!isContentSafe)
            {
                return BadRequest(new { message = "Message content is not allowed." });
            }

            var sender = await _context.Users.FindAsync(senderId.Value);
            if (sender == null)
            {
                sender = new User
                {
                    UserId = senderId.Value,
                    CreatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow,
                };
                _context.Users.Add(sender);
            }
            else
            {
                sender.LastActiveAt = DateTime.UtcNow;
            }

            var receiver = await _context.Users.FindAsync(request.ReceiverId);
            if (receiver == null)
            {
                receiver = new User
                {
                    UserId = request.ReceiverId,
                    CreatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow,
                };
                _context.Users.Add(receiver);
            }

            var message = new ComfortMessage
            {
                SenderId = senderId.Value,
                ReceiverId = request.ReceiverId,
                TargetLogId = request.TargetLogId,
                Content = request.Content,
                Status = MessageStatus.Sent,
                SentAt = DateTime.UtcNow,
            };

            _context.ComfortMessages.Add(message);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(receiver.PushToken))
            {
                await _pushService.SendPushNotification(
                    receiver.PushToken,
                    "New comfort message",
                    "Someone sent you a warm message.",
                    new { type = "comfort_message", messageId = message.Id }
                );
            }

            return Ok(new { message = "Comfort message sent.", id = message.Id });
        }

        [HttpGet("received/{userId}")]
        public async Task<IActionResult> GetReceivedMessages(Guid userId)
        {
            if (!ValidatePathUser(userId, out _))
            {
                return Forbid();
            }

            var messages = await _context
                .ComfortMessages.Where(m =>
                    m.ReceiverId == userId && m.Status == MessageStatus.Sent
                )
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageResponse
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    ReceiverId = m.ReceiverId,
                    TargetLogId = m.TargetLogId,
                    Content = m.Content,
                    Status = m.Status.ToString(),
                    IsThanked = m.IsThanked,
                    SentAt = m.SentAt,
                    ThankedAt = m.ThankedAt,
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpGet("sent/{userId}")]
        public async Task<IActionResult> GetSentMessages(Guid userId)
        {
            if (!ValidatePathUser(userId, out _))
            {
                return Forbid();
            }

            var messages = await _context
                .ComfortMessages.Where(m => m.SenderId == userId)
                .OrderByDescending(m => m.SentAt)
                .Select(m => new MessageResponse
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    ReceiverId = m.ReceiverId,
                    TargetLogId = m.TargetLogId,
                    Content = m.Content,
                    Status = m.Status.ToString(),
                    IsThanked = m.IsThanked,
                    SentAt = m.SentAt,
                    ThankedAt = m.ThankedAt,
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPut("{id}/thank")]
        public async Task<IActionResult> ThankMessage(long id)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var message = await _context.ComfortMessages.FindAsync(id);
            if (message == null)
            {
                return NotFound(new { message = "Message not found." });
            }

            if (message.ReceiverId != userId.Value)
            {
                return Forbid();
            }

            if (message.IsThanked)
            {
                return BadRequest(new { message = "Message already thanked." });
            }

            message.IsThanked = true;
            message.ThankedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var sender = await _context.Users.FindAsync(message.SenderId);
            if (sender != null && !string.IsNullOrEmpty(sender.PushToken))
            {
                await _pushService.SendPushNotification(
                    sender.PushToken,
                    "Thank you received",
                    "Your comfort message was appreciated.",
                    new { type = "thank_message", messageId = message.Id }
                );
            }

            return Ok(new { message = "Thank you sent." });
        }

        [HttpGet("stats")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;

            var totalComforts = await _context
                .ComfortMessages.Where(m => m.Status == MessageStatus.Sent && m.SentAt >= today)
                .CountAsync();

            var totalThanks = await _context
                .ComfortMessages.Where(m => m.IsThanked && m.ThankedAt != null && m.ThankedAt >= today)
                .CountAsync();

            return Ok(new { totalComforts, totalThanks });
        }

        [HttpGet("notifications/{userId}")]
        public async Task<IActionResult> GetNotificationCount(Guid userId, [FromQuery] DateTime? since)
        {
            if (!ValidatePathUser(userId, out _))
            {
                return Forbid();
            }

            var sinceDate = since ?? DateTime.MinValue;

            var newMessages = await _context
                .ComfortMessages.Where(m =>
                    m.ReceiverId == userId && m.SentAt > sinceDate && m.Status == MessageStatus.Sent
                )
                .CountAsync();

            var newThanks = await _context
                .ComfortMessages.Where(m =>
                    m.SenderId == userId && m.IsThanked && m.ThankedAt > sinceDate
                )
                .CountAsync();

            return Ok(new { newMessages, newThanks, total = newMessages + newThanks });
        }

        private bool ValidatePathUser(Guid pathUserId, out Guid tokenUserId)
        {
            tokenUserId = JwtHelper.GetUserIdFromClaimsPrincipal(User) ?? Guid.Empty;
            return tokenUserId != Guid.Empty && tokenUserId == pathUserId;
        }
    }
}
