using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMe(
            [FromHeader(Name = "Authorization")] string? authorization
        )
        {
            if (string.IsNullOrEmpty(authorization) || !authorization.StartsWith("Bearer "))
            {
                return Unauthorized();
            }

            var userIdString = GetUserIdFromToken(authorization);
            if (userIdString == null || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found in database.");
            }

            return Ok(
                new
                {
                    user.UserId,
                    user.IsAdmin,
                    user.IsBanned,
                    user.LastActiveAt,
                }
            );
        }

        [HttpGet("{userId}/insights/weekly")]
        public async Task<IActionResult> GetWeeklyInsights(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Get emotions from the last 7 days
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

            // Calculate emotion breakdown
            var emotionBreakdown = emotionLogs
                .GroupBy(e => e.Emotion)
                .ToDictionary(g => (int)g.Key, g => g.Count());

            // Find dominant emotion
            var dominantEmotion = emotionBreakdown.OrderByDescending(kvp => kvp.Value).First().Key;

            // Calculate average intensity
            var averageIntensity = emotionLogs.Average(e => e.Intensity);

            // Day of week pattern
            var dayOfWeekPattern = emotionLogs
                .GroupBy(e => e.CreatedAt.DayOfWeek.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            // Most productive day (day with most logs)
            var mostProductiveDay = dayOfWeekPattern.OrderByDescending(kvp => kvp.Value).First().Key;

            // Positive vs negative emotions (simplified: Joy, Calm, Excitement are positive)
            var positiveEmotions = new[] { 0, 5, 6 }; // Joy, Calm, Excitement
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
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Get all emotion logs for this user, ordered by date descending
            var emotionLogs = await _context.EmotionLogs
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => e.CreatedAt.Date)
                .Distinct()
                .ToListAsync();

            if (emotionLogs.Count == 0)
            {
                return Ok(new
                {
                    currentStreak = 0,
                    longestStreak = 0,
                    totalDays = 0
                });
            }

            // Calculate current streak
            int currentStreak = 0;
            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            // Check if there's an entry today or yesterday (to maintain streak)
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

            // Calculate longest streak
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

            return Ok(new
            {
                currentStreak,
                longestStreak,
                totalDays = emotionLogs.Count
            });
        }

        private string? GetUserIdFromToken(string authorization)
        {
            try
            {
                var token = authorization.Substring("Bearer ".Length).Trim();
                var handler = new JwtSecurityTokenHandler();
                var tokenS = handler.ReadJwtToken(token) as JwtSecurityToken;
                return tokenS.Claims.First(claim => claim.Type == "sub").Value;
            }
            catch
            {
                return null;
            }
        }
    }
}
