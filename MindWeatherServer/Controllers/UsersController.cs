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
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound("User not found in database.");
            }

            return Ok(new
            {
                user.UserId,
                user.IsAdmin,
                user.IsBanned,
                user.LastActiveAt,
            });
        }

        [HttpGet("{userId}/insights/weekly")]
        public async Task<IActionResult> GetWeeklyInsights(Guid userId)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var emotionLogs = await _context.EmotionLogs
                .Where(e => e.UserId == userId && e.CreatedAt >= sevenDaysAgo)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            if (emotionLogs.Count == 0)
            {
                return Ok(new
                {
                    hasData = false,
                    totalEmotions = 0,
                    dominantEmotion = (int?)null,
                    averageIntensity = 0.0,
                    emotionBreakdown = new Dictionary<int, int>(),
                    dayOfWeekPattern = new Dictionary<string, int>(),
                    positivePercentage = 0.0,
                    mostProductiveDay = (string?)null
                });
            }

            var emotionBreakdown = emotionLogs
                .GroupBy(e => e.Emotion)
                .ToDictionary(g => (int)g.Key, g => g.Count());

            var dominantEmotion = emotionBreakdown.OrderByDescending(kvp => kvp.Value).First().Key;
            var averageIntensity = emotionLogs.Average(e => e.Intensity);

            var dayOfWeekPattern = emotionLogs
                .GroupBy(e => e.CreatedAt.DayOfWeek.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            var mostProductiveDay = dayOfWeekPattern.OrderByDescending(kvp => kvp.Value).First().Key;

            var positiveEmotions = new[] { 0, 5, 6 };
            var positiveCount = emotionLogs.Count(e => positiveEmotions.Contains((int)e.Emotion));
            var positivePercentage = (double)positiveCount / emotionLogs.Count * 100;

            return Ok(new
            {
                hasData = true,
                totalEmotions = emotionLogs.Count,
                dominantEmotion,
                averageIntensity = Math.Round(averageIntensity, 1),
                emotionBreakdown,
                dayOfWeekPattern,
                positivePercentage = Math.Round(positivePercentage, 1),
                mostProductiveDay
            });
        }

        [HttpGet("{userId}/streak")]
        public async Task<IActionResult> GetUserStreak(Guid userId)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var kstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Korea Standard Time");
            var rawTimestamps = await _context.EmotionLogs
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => e.CreatedAt)
                .ToListAsync();

            var emotionLogs = rawTimestamps
                .Select(t => TimeZoneInfo.ConvertTimeFromUtc(t, kstTimeZone).Date)
                .Distinct()
                .ToList();

            if (emotionLogs.Count == 0)
            {
                return Ok(new { currentStreak = 0, longestStreak = 0, totalDays = 0 });
            }

            int currentStreak = 0;
            var nowKst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, kstTimeZone);
            var today = nowKst.Date;
            var yesterday = today.AddDays(-1);

            if (emotionLogs[0] == today || emotionLogs[0] == yesterday)
            {
                currentStreak = 1;
                var expectedDate = emotionLogs[0].AddDays(-1);

                for (int i = 1; i < emotionLogs.Count; i++)
                {
                    if (emotionLogs[i] == expectedDate)
                    {
                        currentStreak++;
                        expectedDate = expectedDate.AddDays(-1);
                    }
                    else
                    {
                        break;
                    }
                }
            }

            int longestStreak = 1;
            int tempStreak = 1;

            for (int i = 0; i < emotionLogs.Count - 1; i++)
            {
                var diff = (emotionLogs[i] - emotionLogs[i + 1]).Days;
                if (diff == 1)
                {
                    tempStreak++;
                    longestStreak = Math.Max(longestStreak, tempStreak);
                }
                else
                {
                    tempStreak = 1;
                }
            }

            return Ok(new { currentStreak, longestStreak, totalDays = emotionLogs.Count });
        }

        [HttpPost("{userId}/push-token")]
        public async Task<IActionResult> UpdatePushToken(Guid userId, [FromBody] PushTokenRequest request)
        {
            if (!ValidatePathUser(userId))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            user.PushToken = request.Token;
            user.PushTokenUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Push token updated successfully" });
        }

        public class PushTokenRequest
        {
            public string Token { get; set; } = string.Empty;
        }

        private bool ValidatePathUser(Guid userId)
        {
            var tokenUserId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            return tokenUserId.HasValue && tokenUserId.Value == userId;
        }
    }
}
