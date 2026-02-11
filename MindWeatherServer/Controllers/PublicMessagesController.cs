using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
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

        // 1. 공용 위로글 게시 (POST /api/public-messages)
        [HttpPost]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> PostPublicMessage(
            [FromBody] CreatePublicMessageRequest request
        )
        {
            // AI 모더레이션 체크 (Gemini)
            var isContentSafe = await _geminiService.CheckContentSafety(request.Content);
            if (!isContentSafe)
            {
                return BadRequest(new { message = "게시글에 부적절한 내용이 포함되어 있습니다." });
            }

            var message = new PublicComfortMessage
            {
                UserId = request.UserId,
                Content = request.Content,
                CreatedAt = DateTime.UtcNow,
            };

            _context.PublicComfortMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { message = "공개 위로가 등록되었습니다.", id = message.Id });
        }

        // 2. 공용 위로글 목록 조회 (GET /api/public-messages?sort=latest&userId=...)
        [HttpGet]
        public async Task<IActionResult> GetPublicMessages(
            [FromQuery] string sort = "latest",
            [FromQuery] Guid? userId = null)
        {
            IQueryable<PublicComfortMessage> query = _context.PublicComfortMessages;

            if (sort == "top")
            {
                query = query
                    .OrderByDescending(m => m.LikeCount)
                    .ThenByDescending(m => m.CreatedAt);
            }
            else
            {
                query = query.OrderByDescending(m => m.CreatedAt);
            }

            // userId가 주어지면 좋아요 여부도 함께 반환
            var likedIds = new HashSet<int>();
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

            // EF Core에서 HashSet 조회가 안 되므로 메모리에서 처리
            foreach (var msg in messages)
            {
                msg.IsLikedByMe = likedIds.Contains(msg.Id);
            }

            return Ok(messages);
        }

        // 3. 공감(하트) 토글 (POST /api/public-messages/{id}/like)
        [HttpPost("{id}/like")]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> LikeMessage(int id, [FromBody] LikeRequest request)
        {
            var message = await _context.PublicComfortMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            var existingLike = await _context.PublicMessageLikes
                .FirstOrDefaultAsync(l => l.MessageId == id && l.UserId == request.UserId);

            if (existingLike != null)
            {
                // 이미 좋아요 → 취소
                _context.PublicMessageLikes.Remove(existingLike);
                message.LikeCount = Math.Max(0, message.LikeCount - 1);
                await _context.SaveChangesAsync();
                return Ok(new { likeCount = message.LikeCount, liked = false });
            }
            else
            {
                // 새 좋아요
                _context.PublicMessageLikes.Add(new PublicMessageLike
                {
                    MessageId = id,
                    UserId = request.UserId,
                    CreatedAt = DateTime.UtcNow,
                });
                message.LikeCount++;
                await _context.SaveChangesAsync();
                return Ok(new { likeCount = message.LikeCount, liked = true });
            }
        }

        // 4. 게시글 상세 + 답글 조회 (GET /api/public-messages/{id}?userId=...)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMessageDetail(int id, [FromQuery] Guid? userId = null)
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

        // 5. 답글 작성 (POST /api/public-messages/{id}/replies)
        [HttpPost("{id}/replies")]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> PostReply(int id, [FromBody] CreateReplyRequest request)
        {
            var message = await _context.PublicComfortMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            // AI 모더레이션
            var isContentSafe = await _geminiService.CheckContentSafety(request.Content);
            if (!isContentSafe)
            {
                return BadRequest(new { message = "답글에 부적절한 내용이 포함되어 있습니다." });
            }

            var reply = new PublicMessageReply
            {
                MessageId = id,
                UserId = request.UserId,
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
