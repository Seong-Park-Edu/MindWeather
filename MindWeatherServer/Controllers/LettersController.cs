using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Helpers;

namespace MindWeatherServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LettersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LettersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetLetters(Guid userId, [FromQuery] int? limit = 30)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

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

        [HttpGet("detail/{letterId}")]
        public async Task<IActionResult> GetLetter(long letterId)
        {
            var letter = await _context.DailyLetters.FindAsync(letterId);
            if (letter == null)
            {
                return NotFound(new { message = "Letter not found." });
            }

            if (!ValidatePathUser(letter.UserId))
            {
                return Forbid();
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

        [HttpPut("{letterId}/read")]
        public async Task<IActionResult> MarkAsRead(long letterId, [FromQuery] Guid userId)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

            var letter = await _context.DailyLetters.FindAsync(letterId);
            if (letter == null)
            {
                return NotFound(new { message = "Letter not found." });
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

            return Ok(new { message = "Letter marked as read." });
        }

        [HttpGet("{userId}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(Guid userId)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

            var count = await _context.DailyLetters
                .Where(l => l.UserId == userId && !l.IsRead)
                .CountAsync();

            return Ok(new { unreadCount = count });
        }

        private bool ValidatePathUser(Guid userId)
        {
            var tokenUserId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            return tokenUserId.HasValue && tokenUserId.Value == userId;
        }
    }
}
