using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Helpers;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        private static readonly Guid SystemAdminId = Guid.Parse("00000000-0000-0000-0000-999999999999");

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("broadcast")]
        public async Task<IActionResult> BroadcastComfort([FromBody] BroadcastRequest request)
        {
            try
            {
                var currentUserId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
                if (currentUserId == null)
                    return Unauthorized("Authentication required.");

                var currentUser = await _db.Users.FindAsync(currentUserId.Value);
                if (currentUser == null || !currentUser.IsAdmin)
                    return StatusCode(403, "Admin privileges required.");

                var cutoffTime = DateTime.UtcNow.AddHours(-24);

                var targetUserIds = await _db.EmotionLogs
                    .Where(e => e.Emotion == request.TargetEmotion && e.CreatedAt >= cutoffTime)
                    .Join(_db.Users, l => l.UserId, u => u.UserId, (l, u) => u.UserId)
                    .Distinct()
                    .ToListAsync();

                if (targetUserIds.Count == 0)
                    return Ok(new { message = "No target users found.", count = 0 });

                int successCount = 0;

                foreach (var receiverId in targetUserIds)
                {
                    try
                    {
                        var latestLogId = await _db.EmotionLogs
                            .Where(e => e.UserId == receiverId && e.CreatedAt >= cutoffTime)
                            .OrderByDescending(e => e.CreatedAt)
                            .Select(e => (long?)e.Id)
                            .FirstOrDefaultAsync();

                        var msg = new ComfortMessage
                        {
                            SenderId = SystemAdminId,
                            ReceiverId = receiverId,
                            TargetLogId = latestLogId,
                            Content = request.Content,
                            Status = MessageStatus.Sent,
                            SentAt = DateTime.UtcNow,
                            IsThanked = false
                        };

                        _db.ComfortMessages.Add(msg);
                        await _db.SaveChangesAsync();
                        successCount++;
                    }
                    catch (Exception innerEx)
                    {
                        Console.WriteLine($"[Broadcast failed] User: {receiverId}, Error: {innerEx.Message}");
                    }
                }

                return Ok(new
                {
                    message = $"Sent to {successCount} users (failed {targetUserIds.Count - successCount}).",
                    count = successCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminController] Critical Error: {ex.Message}");
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetEmotionStats()
        {
            try
            {
                var currentUserId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
                if (currentUserId == null)
                    return Unauthorized("Authentication required.");

                var currentUser = await _db.Users.FindAsync(currentUserId.Value);
                if (currentUser == null || !currentUser.IsAdmin)
                    return StatusCode(403, "Admin privileges required.");

                var cutoffTime = DateTime.UtcNow.AddHours(-24);

                var stats = await _db.EmotionLogs
                    .Where(e => e.CreatedAt >= cutoffTime)
                    .GroupBy(e => e.Emotion)
                    .Select(g => new EmotionStat
                    {
                        Emotion = g.Key,
                        Count = g.Select(x => x.UserId).Distinct().Count(),
                        TotalLogs = g.Count()
                    })
                    .ToListAsync();

                var allStats = Enum.GetValues<EmotionType>()
                    .Select(emotion => stats.FirstOrDefault(s => s.Emotion == emotion)
                        ?? new EmotionStat { Emotion = emotion, Count = 0, TotalLogs = 0 })
                    .OrderBy(s => s.Emotion)
                    .ToList();

                return Ok(allStats);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminController] Error in GetEmotionStats: {ex}");
                return StatusCode(500, new { message = "Internal Server Error", error = ex.Message });
            }
        }
    }

    public class BroadcastRequest
    {
        public EmotionType TargetEmotion { get; set; }
        public string Content { get; set; } = string.Empty;
    }

    public class EmotionStat
    {
        public EmotionType Emotion { get; set; }
        public int Count { get; set; }
        public int TotalLogs { get; set; }
    }
}
