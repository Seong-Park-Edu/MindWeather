using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [Route("api/comfort-messages")]
    [ApiController]
    public class ComfortMessagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComfortMessagesController(AppDbContext context)
        {
            _context = context;
        }

        // 1. 위로 메시지 보내기 (POST /api/comfort-messages)
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            // AI 모더레이션 체크 (Placeholder - 실제 OpenAI API 연동 시 수정)
            var isContentSafe = await CheckContentSafetyAsync(request.Content);

            if (!isContentSafe)
            {
                return BadRequest(new { message = "메시지에 부적절한 내용이 포함되어 있습니다." });
            }

            // 발신자 존재 확인 및 자동 등록
            var sender = await _context.Users.FindAsync(request.SenderId);
            if (sender == null)
            {
                sender = new User
                {
                    UserId = request.SenderId,
                    CreatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow,
                };
                _context.Users.Add(sender);
            }
            else
            {
                sender.LastActiveAt = DateTime.UtcNow;
            }

            // 수신자 존재 확인 및 자동 등록
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

            // 메시지 저장
            var message = new ComfortMessage
            {
                SenderId = request.SenderId,
                ReceiverId = request.ReceiverId,
                TargetLogId = request.TargetLogId,
                Content = request.Content,
                Status = MessageStatus.Sent,
                SentAt = DateTime.UtcNow,
            };

            _context.ComfortMessages.Add(message);
            await _context.SaveChangesAsync();

            // Firebase FCM 푸시 알림 전송 (Expo Push API) - Removed

            return Ok(new { message = "따뜻한 마음이 전달되었습니다.", id = message.Id });
        }

        // 2. 받은 메시지 조회 (GET /api/comfort-messages/received/{userId})
        [HttpGet("received/{userId}")]
        public async Task<IActionResult> GetReceivedMessages(Guid userId)
        {
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

        // 2.5 보낸 메시지 조회 (GET /api/comfort-messages/sent/{userId})
        [HttpGet("sent/{userId}")]
        public async Task<IActionResult> GetSentMessages(Guid userId)
        {
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

        // 3. 감사 표시 (PUT /api/comfort-messages/{id}/thank)
        [HttpPut("{id}/thank")]
        public async Task<IActionResult> ThankMessage(long id, [FromQuery] Guid userId)
        {
            var message = await _context.ComfortMessages.FindAsync(id);

            if (message == null)
            {
                return NotFound(new { message = "메시지를 찾을 수 없습니다." });
            }

            if (message.ReceiverId != userId)
            {
                return Forbid();
            }

            if (message.IsThanked)
            {
                return BadRequest(new { message = "이미 감사를 표시한 메시지입니다." });
            }

            message.IsThanked = true;
            message.ThankedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // 감사 알림 전송 (Push Notification Removed)

            return Ok(new { message = "감사가 전달되었습니다." });
        }

        // 4. 위로 통계 (GET /api/comfort-messages/stats)
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;

            // Count messages sent Today
            var totalComforts = await _context
                .ComfortMessages.Where(m => m.Status == MessageStatus.Sent && m.SentAt >= today)
                .CountAsync();

            // Count thanks received Today
            var totalThanks = await _context
                .ComfortMessages.Where(m =>
                    m.IsThanked && m.ThankedAt != null && m.ThankedAt >= today
                )
                .CountAsync();

            return Ok(new { totalComforts, totalThanks });
        }

        // 5. 알림 카운트 (GET /api/comfort-messages/notifications/{userId}?since=...)
        // since 파라미터 이후의 새로운 메시지 + 새로운 감사 개수 반환
        [HttpGet("notifications/{userId}")]
        public async Task<IActionResult> GetNotificationCount(
            Guid userId,
            [FromQuery] DateTime? since
        )
        {
            var sinceDate = since ?? DateTime.MinValue;

            // 1. 새로 받은 위로 메시지 개수
            var newMessages = await _context
                .ComfortMessages.Where(m =>
                    m.ReceiverId == userId && m.SentAt > sinceDate && m.Status == MessageStatus.Sent
                )
                .CountAsync();

            // 2. 보낸 메시지 중 새로 감사받은 개수
            var newThanks = await _context
                .ComfortMessages.Where(m =>
                    m.SenderId == userId && m.IsThanked && m.ThankedAt > sinceDate
                )
                .CountAsync();

            return Ok(
                new
                {
                    newMessages,
                    newThanks,
                    total = newMessages + newThanks,
                }
            );
        }

        // AI 콘텐츠 안전성 검사 (Placeholder)
        private async Task<bool> CheckContentSafetyAsync(string content)
        {
            // TODO: OpenAI Moderation API 연동
            // POST https://api.openai.com/v1/moderations
            // 현재는 기본적인 금칙어 필터만 적용

            var bannedWords = new[] { "바보", "멍청이", "죽어" }; // 예시

            foreach (var word in bannedWords)
            {
                if (content.Contains(word, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            await Task.CompletedTask; // async 유지
            return true;
        }
    }
}
