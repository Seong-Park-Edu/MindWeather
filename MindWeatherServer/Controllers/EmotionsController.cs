using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.DTOs;
using MindWeatherServer.Hubs;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [Route("api/[controller]")] // 주소: /api/emotions
    [ApiController]
    public class EmotionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<EmotionHub> _hub; // SignalR Hub Inject

        public EmotionsController(AppDbContext context, IHubContext<EmotionHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        // 1. 감정 기록하기 (POST /api/emotions)
        // POST: api/Emotions
        [HttpPost]
        public async Task<IActionResult> PostEmotion([FromBody] CreateEmotionRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // [추가된 로직] 1. 유저가 이미 존재하는지 확인
                var user = await _context.Users.FindAsync(request.UserId);

                if (user == null)
                {
                    // 2. 없으면 "자동 회원가입" 처리 (DB에 유저부터 생성)
                    user = new User
                    {
                        UserId = request.UserId,
                        CreatedAt = DateTime.UtcNow,
                        LastActiveAt = DateTime.UtcNow,
                        IsBanned = false,
                        IsAdmin = false, // Explicitly set defaults
                    };
                    _context.Users.Add(user);
                }
                else
                {
                    // 3. 있으면 "마지막 활동 시간" 갱신
                    user.LastActiveAt = DateTime.UtcNow;
                }

                // 4. 그 다음 감정 기록 저장
                // Defensive Coding: 길이를 모델 제한(200자/50자)에 맞게 자름
                var safeTags = request.Tags ?? "";
                if (safeTags.Length > 200)
                    safeTags = safeTags.Substring(0, 200);

                var safeRegion = request.Region ?? "Unknown";
                if (safeRegion.Length > 50)
                    safeRegion = safeRegion.Substring(0, 50);

                var emotionLog = new EmotionLog
                {
                    UserId = request.UserId,
                    Emotion = request.Emotion,
                    Intensity = request.Intensity,
                    Region = safeRegion,
                    Tags = safeTags,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    CreatedAt = DateTime.UtcNow,
                };

                _context.EmotionLogs.Add(emotionLog);

                // 5. 유저 생성과 감정 기록을 한 번에 저장 (Transaction)
                // [Sync Workaround] Npgsql Async 버그 회피를 위해 동기식 저장 사용
                _context.SaveChanges();

                // [SignalR] 실시간 브로드캐스팅
                // 저장된 Entity를 DTO로 변환하여 전송
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

                // 모든 클라이언트에게 "ReceiveEmotion" 이벤트 발송 (Fire-and-forget이 아니라 await 권장)
                await _hub.Clients.All.SendAsync("ReceiveEmotion", emotionDto);

                return Ok(new { message = "마음이 안전하게 기록되었습니다." });
            }
            catch (DbUpdateException dbEx)
            {
                // DB 관련 구체적인 에러 로깅
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                Console.WriteLine($"[DB Error] PostEmotion: {innerMessage}");
                return StatusCode(
                    500,
                    new
                    {
                        message = "데이터베이스 저장 중 오류가 발생했습니다.",
                        error = innerMessage,
                    }
                );
            }
            catch (Exception ex)
            {
                // 일반 에러
                Console.WriteLine($"[Error] PostEmotion: {ex.Message}");
                return StatusCode(
                    500,
                    new { message = "서버 내부 오류가 발생했습니다.", error = ex.Message }
                );
            }
        }

        // 2. 지도용 데이터 가져오기 (GET /api/emotions/map)
        // 핵심: 24시간 이내 데이터만 가져온다!
        [HttpGet("map")]
        public async Task<IActionResult> GetEmotionsForMap()
        {
            var yesterday = DateTime.UtcNow.AddHours(-24);

            var emotions = await _context
                .EmotionLogs.Where(e => e.CreatedAt > yesterday) // 24시간 필터링
                .Select(e => new EmotionResponse // 필요한 정보만 쏙쏙
                {
                    UserId = e.UserId, // 위로 메시지 전송용
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

        // 3. 전광판용 통계 (GET /api/emotions/stats)
        // "오늘 총 1,234명이 마음을 공유했어요"
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.UtcNow.Date; // 오늘 0시 0분

            var count = await _context.EmotionLogs.Where(e => e.CreatedAt >= today).CountAsync();

            return Ok(new { todayCount = count });
        }

        // 4. 내 감정 기록 가져오기 (GET /api/emotions/my?userId=...&year=2024&month=5)
        [HttpGet("my")]
        public async Task<IActionResult> GetMyEmotions(
            [FromQuery] Guid userId,
            [FromQuery] int year,
            [FromQuery] int month
        )
        {
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            var logs = await _context
                .EmotionLogs.Where(e =>
                    e.UserId == userId && e.CreatedAt >= startDate && e.CreatedAt < endDate
                )
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new EmotionResponse
                {
                    UserId = e.UserId,
                    Emotion = e.Emotion,
                    Intensity = e.Intensity,
                    Region = e.Region,
                    CreatedAt = e.CreatedAt, // Frontend needs this for calendar mapping
                    Latitude = e.Latitude,
                    Longitude = e.Longitude,
                    Tags = e.Tags,
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
