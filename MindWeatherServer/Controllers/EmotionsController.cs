using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
using MindWeatherServer.Helpers;
using MindWeatherServer.Hubs;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmotionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<EmotionHub> _hub;

        public EmotionsController(AppDbContext context, IHubContext<EmotionHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        [HttpPost]
        [Authorize]
        [EnableRateLimiting("write")]
        public async Task<IActionResult> PostEmotion([FromBody] CreateEmotionRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
                if (userId == null)
                {
                    return Unauthorized(new { message = "Authentication required." });
                }

                var user = await _context.Users.FindAsync(userId.Value);

                if (user == null)
                {
                    user = new User
                    {
                        UserId = userId.Value,
                        CreatedAt = DateTime.UtcNow,
                        LastActiveAt = DateTime.UtcNow,
                        IsBanned = false,
                        IsAdmin = false,
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    user.LastActiveAt = DateTime.UtcNow;
                }

                var safeTags = request.Tags ?? "";
                if (safeTags.Length > 200)
                    safeTags = safeTags.Substring(0, 200);

                var safeRegion = request.Region ?? "Unknown";
                if (safeRegion.Length > 50)
                    safeRegion = safeRegion.Substring(0, 50);

                var emotionLog = new EmotionLog
                {
                    UserId = userId.Value,
                    Emotion = request.Emotion,
                    Intensity = request.Intensity,
                    Region = safeRegion,
                    Tags = safeTags,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    CreatedAt = DateTime.UtcNow,
                };

                _context.EmotionLogs.Add(emotionLog);
                _context.SaveChanges();

                var emotionDto = new EmotionResponse
                {
                    UserId = emotionLog.UserId,
                    Emotion = emotionLog.Emotion,
                    Intensity = emotionLog.Intensity,
                    Region = emotionLog.Region,
                    Latitude = emotionLog.Latitude,
                    Longitude = emotionLog.Longitude,
                    CreatedAt = emotionLog.CreatedAt,
                    Tags = emotionLog.Tags,
                };

                await _hub.Clients.All.SendAsync("ReceiveEmotion", emotionDto);

                return Ok(new { message = "Emotion recorded." });
            }
            catch (DbUpdateException dbEx)
            {
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                Console.WriteLine($"[DB Error] PostEmotion: {innerMessage}");
                return StatusCode(500, new { message = "Database error occurred." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error] PostEmotion: {ex.Message}");
                return StatusCode(500, new { message = "Server error occurred." });
            }
        }

        [HttpGet("map")]
        public async Task<IActionResult> GetEmotionsForMap()
        {
            var yesterday = DateTime.UtcNow.AddHours(-24);

            var emotions = await _context
                .EmotionLogs.Where(e => e.CreatedAt > yesterday)
                .Select(e => new EmotionResponse
                {
                    UserId = e.UserId,
                    Emotion = e.Emotion,
                    Intensity = e.Intensity,
                    Region = e.Region,
                    CreatedAt = e.CreatedAt,
                    Latitude = e.Latitude,
                    Longitude = e.Longitude,
                })
                .ToListAsync();

            return Ok(emotions);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date;
            var count = await _context.EmotionLogs.Where(e => e.CreatedAt >= today).CountAsync();
            return Ok(new { todayCount = count });
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyEmotions([FromQuery] int year, [FromQuery] int month)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(User);
            if (userId == null)
            {
                return Unauthorized(new { message = "Authentication required." });
            }

            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            var logs = await _context
                .EmotionLogs.Where(e =>
                    e.UserId == userId.Value && e.CreatedAt >= startDate && e.CreatedAt < endDate
                )
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new EmotionResponse
                {
                    UserId = e.UserId,
                    Emotion = e.Emotion,
                    Intensity = e.Intensity,
                    Region = e.Region,
                    CreatedAt = e.CreatedAt,
                    Latitude = e.Latitude,
                    Longitude = e.Longitude,
                    Tags = e.Tags,
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
