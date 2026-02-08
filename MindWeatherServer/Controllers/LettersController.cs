using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;

namespace MindWeatherServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LettersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LettersController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 사용자의 편지 목록 조회 (최신순)
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetLetters(Guid userId, [FromQuery] int? limit = 30)
        {
            var letters = await _context.DailyLetters
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.GeneratedAt)
                .Take(limit ?? 30)
                .Select(l => new
                {
                    l.Id,
                    l.Content,
                    l.GeneratedAt,
                    l.IsRead,
                    l.ReadAt,
                    l.AnalyzedFrom,
                    l.AnalyzedTo
                })
                .ToListAsync();

            return Ok(letters);
        }

        /// <summary>
        /// 특정 편지 조회
        /// </summary>
        [HttpGet("detail/{letterId}")]
        public async Task<IActionResult> GetLetter(long letterId)
        {
            var letter = await _context.DailyLetters.FindAsync(letterId);

            if (letter == null)
            {
                return NotFound(new { message = "편지를 찾을 수 없습니다." });
            }

            return Ok(new
            {
                letter.Id,
                letter.UserId,
                letter.Content,
                letter.GeneratedAt,
                letter.IsRead,
                letter.ReadAt,
                letter.AnalyzedFrom,
                letter.AnalyzedTo
            });
        }

        /// <summary>
        /// 편지 읽음 처리
        /// </summary>
        [HttpPut("{letterId}/read")]
        public async Task<IActionResult> MarkAsRead(long letterId, [FromQuery] Guid userId)
        {
            var letter = await _context.DailyLetters.FindAsync(letterId);

            if (letter == null)
            {
                return NotFound(new { message = "편지를 찾을 수 없습니다." });
            }

            if (letter.UserId != userId)
            {
                return Forbid();
            }

            if (!letter.IsRead)
            {
                letter.IsRead = true;
                letter.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "편지를 읽었습니다." });
        }

        /// <summary>
        /// 읽지 않은 편지 개수
        /// </summary>
        [HttpGet("{userId}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(Guid userId)
        {
            var count = await _context.DailyLetters
                .Where(l => l.UserId == userId && !l.IsRead)
                .CountAsync();

            return Ok(new { unreadCount = count });
        }
    }
}
