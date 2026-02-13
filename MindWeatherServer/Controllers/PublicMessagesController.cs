using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
    [Route("api/public-messages")]
    [ApiController]
    public class PublicMessagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GeminiService _geminiService;

        public PublicMessagesController(AppDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        [HttpPost]
        [Authorize]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> PostPublicMessage([FromBody] CreatePublicMessageRequest request)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var isContentSafe = await _geminiService.CheckContentSafety(request.Content);
            if (!isContentSafe)
            {
                return BadRequest(new { message = "Content is not allowed." });
            }

            var message = new PublicComfortMessage
            {
                UserId = userId.Value,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
            };

            _context.PublicComfortMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Public message posted.", id = message.Id });
        }

        [HttpGet]
        public async Task<IActionResult> GetPublicMessages([FromQuery] string sort = "latest")
        {
            IQueryable<PublicComfortMessage> query = _context.PublicComfortMessages;

            query = sort == "top"
                ? query.OrderByDescending(m => m.LikeCount).ThenByDescending(m => m.CreatedAt)
                : query.OrderByDescending(m => m.CreatedAt);

            var likedIds = new HashSet<int>();
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId.HasValue)
            {
                likedIds = (await _context.PublicMessageLikes
                    .Where(l => l.UserId == userId.Value)
                    .Select(l => l.MessageId)
                    .ToListAsync())
                    .ToHashSet();
            }

            var messages = await query
                .Take(50)
                .Select(m => new PublicMessageResponse
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    Content = m.Content,
                    LikeCount = m.LikeCount,
                    ReplyCount = m.ReplyCount,
                    CreatedAt = m.CreatedAt,
                })
                .ToListAsync();

            foreach (var msg in messages)
            {
                msg.IsLikedByMe = likedIds.Contains(msg.Id);
            }

            return Ok(messages);
        }

        [HttpPost("{id}/like")]
        [Authorize]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> LikeMessage(int id)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var message = await _context.PublicComfortMessages.FindAsync(id);
                if (message == null)
                    return NotFound();

                var existingLike = await _context.PublicMessageLikes
                    .FirstOrDefaultAsync(l => l.MessageId == id && l.UserId == userId.Value);

                bool liked;
                if (existingLike != null)
                {
                    _context.PublicMessageLikes.Remove(existingLike);
                    liked = false;
                }
                else
                {
                    _context.PublicMessageLikes.Add(new PublicMessageLike
                    {
                        MessageId = id,
                        UserId = userId.Value,
                        CreatedAt = DateTime.UtcNow,
                    });
                    liked = true;
                }

                await _context.SaveChangesAsync();

                message.LikeCount = await _context.PublicMessageLikes.CountAsync(l => l.MessageId == id);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { likeCount = message.LikeCount, liked });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMessageDetail(int id)
        {
            var message = await _context.PublicComfortMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            var replies = await _context.PublicMessageReplies
                .Where(r => r.MessageId == id)
                .OrderBy(r => r.CreatedAt)
                .Select(r => new ReplyResponse
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Content = r.Content,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync();

            var isLiked = false;
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId.HasValue)
            {
                isLiked = await _context.PublicMessageLikes
                    .AnyAsync(l => l.MessageId == id && l.UserId == userId.Value);
            }

            return Ok(new PublicMessageDetailResponse
            {
                Id = message.Id,
                UserId = message.UserId,
                Content = message.Content,
                LikeCount = message.LikeCount,
                IsLikedByMe = isLiked,
                CreatedAt = message.CreatedAt,
                Replies = replies,
            });
        }

        [HttpPost("{id}/replies")]
        [Authorize]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> PostReply(int id, [FromBody] CreateReplyRequest request)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var message = await _context.PublicComfortMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            var isContentSafe = await _geminiService.CheckContentSafety(request.Content);
            if (!isContentSafe)
            {
                return BadRequest(new { message = "Reply content is not allowed." });
            }

            var reply = new PublicMessageReply
            {
                MessageId = id,
                UserId = userId.Value,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
            };

            _context.PublicMessageReplies.Add(reply);
            message.ReplyCount++;
            await _context.SaveChangesAsync();

            return Ok(new ReplyResponse
            {
                Id = reply.Id,
                UserId = reply.UserId,
                Content = reply.Content,
                CreatedAt = reply.CreatedAt,
            });
        }
    }
}
