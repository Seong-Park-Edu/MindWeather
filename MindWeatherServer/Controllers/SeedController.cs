using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Models;

namespace MindWeatherServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private static readonly Random _random = new();

        // System Bot UUID (고정된 시스템 봇 ID)
        private static readonly Guid SystemBotId = new("00000000-0000-0000-0000-000000000001");

        // 한국 주요 도시
        private static readonly string[] KoreanRegions = {
            "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
            "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
        };

        // 시스템 봇 위로 메시지
        private static readonly string[] ComfortMessages = {
            "당신은 혼자가 아닙니다. 💙",
            "오늘 하루도 고생 많으셨어요. 🌟",
            "힘들 때는 잠시 쉬어가도 괜찮아요. 🍀",
            "당신의 감정은 소중합니다. ✨",
            "언제나 응원하고 있어요! 💪",
            "내일은 더 좋은 날이 될 거예요. 🌈"
        };

        public SeedController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// 50개의 랜덤 감정 로그를 생성합니다 (Cold Start 문제 해결용)
        /// 개발 환경에서만 사용 가능합니다.
        /// </summary>
        [HttpPost("fake-emotions")]
        public async Task<IActionResult> GenerateFakeEmotions()
        {
            if (!_env.IsDevelopment())
                return NotFound();

            var createdUsers = 0;
            var createdLogs = 0;

            for (int i = 0; i < 50; i++)
            {
                var userId = Guid.NewGuid();

                // 유저가 없으면 먼저 생성 (FK 제약 조건 방지)
                var existingUser = await _context.Users.FindAsync(userId);
                if (existingUser == null)
                {
                    var newUser = new User
                    {
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow,
                        LastActiveAt = DateTime.UtcNow,
                        IsBanned = false
                    };
                    _context.Users.Add(newUser);
                    createdUsers++;
                }

                // 랜덤 감정 로그 생성
                var emotionLog = new EmotionLog
                {
                    UserId = userId,
                    Emotion = (EmotionType)_random.Next(0, 10), // 0-9: All 10 emotions
                    Intensity = _random.Next(1, 11), // 1-10
                    Region = KoreanRegions[_random.Next(KoreanRegions.Length)],
                    Tags = GenerateRandomTags(),
                    CreatedAt = DateTime.UtcNow.AddHours(-_random.Next(0, 24)).AddMinutes(-_random.Next(0, 60)) // 최근 24시간 내
                };

                _context.EmotionLogs.Add(emotionLog);
                createdLogs++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "시뮬레이션 데이터가 생성되었습니다.",
                createdUsers,
                createdLogs
            });
        }

        /// <summary>
        /// 외로운 감정 로그들에게 시스템 봇이 위로 메시지를 보냅니다
        /// 개발 환경에서만 사용 가능합니다.
        /// </summary>
        [HttpPost("system-comfort")]
        public async Task<IActionResult> SendSystemComfort()
        {
            if (!_env.IsDevelopment())
                return NotFound();

            // 시스템 봇 유저가 없으면 생성
            var systemBot = await _context.Users.FindAsync(SystemBotId);
            if (systemBot == null)
            {
                systemBot = new User
                {
                    UserId = SystemBotId,
                    CreatedAt = DateTime.UtcNow,
                    LastActiveAt = DateTime.UtcNow,
                    IsBanned = false
                };
                _context.Users.Add(systemBot);
            }

            var yesterday = DateTime.UtcNow.AddHours(-24);

            // 최근 24시간 내 위로 메시지를 받지 못한 감정 로그 찾기
            var lonelyLogs = await _context.EmotionLogs
                .Where(e => e.CreatedAt > yesterday)
                .Where(e => !_context.ComfortMessages.Any(c => c.TargetLogId == e.Id))
                .ToListAsync();

            var sentCount = 0;
            foreach (var log in lonelyLogs)
            {
                var comfortMessage = new ComfortMessage
                {
                    SenderId = SystemBotId,
                    ReceiverId = log.UserId,
                    TargetLogId = log.Id,
                    Content = ComfortMessages[_random.Next(ComfortMessages.Length)],
                    Status = MessageStatus.Sent,
                    SentAt = DateTime.UtcNow
                };

                _context.ComfortMessages.Add(comfortMessage);
                sentCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "시스템 봇이 외로운 마음들에게 위로를 보냈습니다.",
                lonelyLogsFound = lonelyLogs.Count,
                comfortMessagesSent = sentCount
            });
        }

        private static string GenerateRandomTags()
        {
            var tags = new[] { "#출근", "#퇴근", "#학교", "#운동", "#연애", "#가족", "#친구", "#날씨", "#월요일", "#주말" };
            var count = _random.Next(1, 4); // 1-3개 태그
            var selectedTags = tags.OrderBy(_ => _random.Next()).Take(count);
            return string.Join(" ", selectedTags);
        }
    }
}
