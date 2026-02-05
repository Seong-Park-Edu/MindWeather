using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        
        // Fixed System Admin ID for broadcast messages
        private static readonly Guid SystemAdminId = Guid.Parse("00000000-0000-0000-0000-999999999999");

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Broadcast a comfort message to all users feeling a specific emotion
        /// Created within the last 24 hours
        /// </summary>
        [HttpPost("broadcast")]
        public async Task<IActionResult> BroadcastComfort([FromBody] BroadcastRequest request, [FromHeader(Name = "Authorization")] string? authorization)
        {
            try
            {
                // 1. 관리자 인증
                if (string.IsNullOrEmpty(authorization) || !authorization.StartsWith("Bearer "))
                    return Unauthorized("토큰 없음");

                var userIdString = GetUserIdFromToken(authorization);
                if (userIdString == null || !Guid.TryParse(userIdString, out var currentUserId))
                    return Unauthorized("토큰 오류");

                var currentUser = await _db.Users.FindAsync(currentUserId);
                if (currentUser == null || !currentUser.IsAdmin)
                    return StatusCode(403, "관리자 권한이 없습니다.");

                // 2. 타겟 유저 찾기 (Users 테이블 조인)
                var cutoffTime = DateTime.UtcNow.AddHours(-24);
                
                var targetUserIds = await _db.EmotionLogs
                    .Where(e => e.Emotion == request.TargetEmotion && e.CreatedAt >= cutoffTime)
                    .Join(_db.Users, l => l.UserId, u => u.UserId, (l, u) => u.UserId)
                    .Distinct()
                    .ToListAsync();

                if (targetUserIds.Count == 0)
                    return Ok(new { message = "대상 유저가 없습니다.", count = 0 });

                Console.WriteLine($"[Admin] 전송 대상: {targetUserIds.Count}명 - 개별 전송 시작");

                // 3. ★ 핵심 변경: 한 명씩 따로따로 저장 (네트워크 끊김 방지) ★
                int successCount = 0;

                foreach (var receiverId in targetUserIds)
                {
                    try 
                    {
                        // 해당 유저의 최신 로그 찾기
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
                        await _db.SaveChangesAsync(); // ★ 여기서 매번 저장!
                        successCount++;
                    }
                    catch (Exception innerEx)
                    {
                        // 한 명이 실패해도 나머지는 계속 보냄
                        Console.WriteLine($"[전송 실패] User: {receiverId}, Error: {innerEx.Message}");
                    }
                }

                return Ok(new
                {
                    message = $"{successCount}명에게 전송 완료 (실패 {targetUserIds.Count - successCount}건)",
                    count = successCount
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CRITICAL ERROR] {ex.Message}");
                return StatusCode(500, new { message = "서버 에러", error = ex.Message });
            }
        }

        /// <summary>
        /// Get emotion statistics for admin dashboard
        /// Shows count of users per emotion type in last 24 hours
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetEmotionStats([FromHeader(Name = "Authorization")] string? authorization)
        {
            try 
            {
                 // 1. Authenticate Admin
                if (string.IsNullOrEmpty(authorization) || !authorization.StartsWith("Bearer "))
                {
                    return Unauthorized("Missing or invalid Authorization header");
                }

                var userIdString = GetUserIdFromToken(authorization);
                if (userIdString == null || !Guid.TryParse(userIdString, out var currentUserId))
                {
                    return Unauthorized("Invalid token");
                }

                var currentUser = await _db.Users.FindAsync(currentUserId);
                if (currentUser == null)
                {
                    return StatusCode(403, "User not found in the database. Please re-login.");
                }

                if (!currentUser.IsAdmin)
                {
                    return StatusCode(403, "Forbidden: You are not an admin.");
                }

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

                // Ensure all emotion types are represented
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

        // Helper to extract JWT payload without signature verification (since we trust Supabase)
        private string? GetUserIdFromToken(string authorization)
        {
            try
            {
                var token = authorization.Substring("Bearer ".Length).Trim();
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                // Supabase 'sub' claim is the UUID
                return jwtToken.Subject; 
            }
            catch
            {
                return null;
            }
        }
    }

    // DTOs
    public class BroadcastRequest
    {
        public EmotionType TargetEmotion { get; set; }
        public string Content { get; set; }
    }

    public class EmotionStat
    {
        public EmotionType Emotion { get; set; }
        public int Count { get; set; }  // Unique users
        public int TotalLogs { get; set; }  // Total logs
    }
}
