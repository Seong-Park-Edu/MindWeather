using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Models;

namespace MindWeatherServer.Services
{
    public class DailyLetterScheduler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyLetterScheduler> _logger;

        public DailyLetterScheduler(IServiceProvider serviceProvider, ILogger<DailyLetterScheduler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        // 한국 표준시 (KST = UTC+9)
        private static readonly TimeZoneInfo KstTimeZone =
            TimeZoneInfo.FindSystemTimeZoneById("Korea Standard Time");

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyLetterScheduler started");

            while (!stoppingToken.IsCancellationRequested)
            {
                var nowKst = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, KstTimeZone);
                var scheduledTime = new DateTime(nowKst.Year, nowKst.Month, nowKst.Day, 19, 0, 0); // KST 오후 7시

                // 이미 오후 7시가 지났으면 내일 7시로 설정
                if (nowKst > scheduledTime)
                {
                    scheduledTime = scheduledTime.AddDays(1);
                }

                // KST 스케줄을 UTC 기준 delay로 변환
                var scheduledUtc = TimeZoneInfo.ConvertTimeToUtc(scheduledTime, KstTimeZone);

                var delay = scheduledUtc - DateTime.UtcNow;
                _logger.LogInformation($"Next letter generation scheduled at: {scheduledTime:yyyy-MM-dd HH:mm:ss} (in {delay.TotalHours:F1} hours)");

                await Task.Delay(delay, stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await GenerateAndSendDailyLetters();
                }
            }
        }

        private async Task GenerateAndSendDailyLetters()
        {
            try
            {
                _logger.LogInformation("Starting daily letter generation...");

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var geminiService = scope.ServiceProvider.GetRequiredService<GeminiService>();
                var pushService = scope.ServiceProvider.GetRequiredService<PushNotificationService>();

                // 모든 활성 사용자 가져오기 (최근 7일 이내 활동한 사용자)
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var activeUsers = await context.Users
                    .Where(u => !u.IsBanned && u.LastActiveAt >= sevenDaysAgo)
                    .ToListAsync();

                _logger.LogInformation($"Found {activeUsers.Count} active users");

                foreach (var user in activeUsers)
                {
                    try
                    {
                        await GenerateLetterForUser(context, geminiService, pushService, user);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error generating letter for user {user.UserId}: {ex.Message}");
                    }
                }

                _logger.LogInformation("Daily letter generation completed");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GenerateAndSendDailyLetters: {ex.Message}");
            }
        }

        private async Task GenerateLetterForUser(
            AppDbContext context,
            GeminiService geminiService,
            PushNotificationService pushService,
            User user)
        {
            // 최근 7일간의 감정 데이터 분석
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var emotionLogs = await context.EmotionLogs
                .Where(e => e.UserId == user.UserId && e.CreatedAt >= sevenDaysAgo)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            // 감정 데이터가 없으면 편지 생성 안 함
            if (emotionLogs.Count == 0)
            {
                _logger.LogInformation($"No emotion data for user {user.UserId}, skipping letter generation");
                return;
            }

            // 감정 요약 생성
            var emotionSummary = GenerateEmotionSummary(emotionLogs);

            // 이전 편지 조회 (중복 방지)
            var previousLetter = await context.DailyLetters
                .Where(l => l.UserId == user.UserId)
                .OrderByDescending(l => l.GeneratedAt)
                .Select(l => l.Content)
                .FirstOrDefaultAsync();

            // AI 편지 생성
            var letterContent = await geminiService.GenerateDailyLetter(emotionSummary, previousLetter);

            // DB에 편지 저장
            var letter = new DailyLetter
            {
                UserId = user.UserId,
                Content = letterContent,
                GeneratedAt = DateTime.UtcNow,
                AnalyzedFrom = sevenDaysAgo,
                AnalyzedTo = DateTime.UtcNow,
                IsRead = false
            };

            context.DailyLetters.Add(letter);
            await context.SaveChangesAsync();

            // 푸시 알림 전송
            if (!string.IsNullOrEmpty(user.PushToken))
            {
                await pushService.SendPushNotification(
                    user.PushToken,
                    "🌱 오늘의 편지가 도착했어요",
                    "당신의 마음을 돌보는 식물이 편지를 보냈습니다.",
                    new { type = "daily_letter", letterId = letter.Id }
                );
            }

            _logger.LogInformation($"Letter generated and sent for user {user.UserId}");
        }

        private string GenerateEmotionSummary(List<EmotionLog> logs)
        {
            var totalLogs = logs.Count;

            // 가장 많이 느낀 감정
            var emotionCounts = logs.GroupBy(e => e.Emotion)
                .OrderByDescending(g => g.Count())
                .Select(g => new { Emotion = GetEmotionName(g.Key), Count = g.Count() })
                .ToList();

            var avgIntensity = logs.Average(e => e.Intensity);

            // 날짜별 감정 흐름 (최근 순)
            var dailyFlow = logs
                .GroupBy(e => TimeZoneInfo.ConvertTimeFromUtc(e.CreatedAt, KstTimeZone).Date)
                .OrderBy(g => g.Key)
                .Select(g =>
                {
                    var dayName = GetDayOfWeekName(g.Key.DayOfWeek);
                    var emotions = string.Join(", ", g.Select(e => $"{GetEmotionName(e.Emotion)}({e.Intensity})"));
                    return $"{g.Key:M월 d일}({dayName}): {emotions}";
                })
                .ToList();

            // 감정 추세 (전반부 vs 후반부)
            var midPoint = logs.Count / 2;
            var recentHalf = logs.Take(midPoint).ToList();
            var olderHalf = logs.Skip(midPoint).ToList();
            var trendDescription = "";
            if (recentHalf.Count > 0 && olderHalf.Count > 0)
            {
                var recentAvg = recentHalf.Average(e => e.Intensity);
                var olderAvg = olderHalf.Average(e => e.Intensity);
                var recentPositive = recentHalf.Count(e =>
                    e.Emotion == EmotionType.Joy || e.Emotion == EmotionType.Calm || e.Emotion == EmotionType.Excitement);
                var olderPositive = olderHalf.Count(e =>
                    e.Emotion == EmotionType.Joy || e.Emotion == EmotionType.Calm || e.Emotion == EmotionType.Excitement);

                if (recentPositive > olderPositive)
                    trendDescription = "최근 며칠은 이전보다 긍정적인 감정이 늘었음";
                else if (recentPositive < olderPositive)
                    trendDescription = "최근 며칠은 이전보다 힘든 감정이 늘었음";
                else
                    trendDescription = "감정 흐름이 비슷하게 유지되고 있음";
            }

            // 태그 분석
            var recentTags = logs
                .Where(e => !string.IsNullOrEmpty(e.Tags))
                .SelectMany(e => e.Tags!.Split(','))
                .Select(t => t.Trim())
                .Where(t => t.Length > 0)
                .GroupBy(t => t)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => g.Key)
                .ToList();

            // 강도가 높았던 순간
            var intenseLog = logs.OrderByDescending(e => e.Intensity).First();
            var intenseDay = TimeZoneInfo.ConvertTimeFromUtc(intenseLog.CreatedAt, KstTimeZone);

            var summary = $@"[날짜별 감정 흐름]
{string.Join("\n", dailyFlow)}

[전체 요약]
- 7일간 총 {totalLogs}번 감정 기록
- 가장 자주 느낀 감정: {string.Join(", ", emotionCounts.Take(3).Select(e => $"{e.Emotion}({e.Count}회)"))}
- 감정 강도 평균: {avgIntensity:F1}/10
- 가장 감정이 강했던 날: {intenseDay:M월 d일} {GetEmotionName(intenseLog.Emotion)} (강도 {intenseLog.Intensity}/10)
- 추세: {trendDescription}";

            if (recentTags.Any())
            {
                summary += $"\n- 이 아이의 일상 키워드: {string.Join(", ", recentTags)}";
            }

            return summary;
        }

        private string GetDayOfWeekName(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Monday => "월",
                DayOfWeek.Tuesday => "화",
                DayOfWeek.Wednesday => "수",
                DayOfWeek.Thursday => "목",
                DayOfWeek.Friday => "금",
                DayOfWeek.Saturday => "토",
                DayOfWeek.Sunday => "일",
                _ => ""
            };
        }

        private string GetEmotionName(EmotionType emotion)
        {
            return emotion switch
            {
                EmotionType.Joy => "기쁨",
                EmotionType.Sadness => "슬픔",
                EmotionType.Anger => "분노",
                EmotionType.Anxiety => "불안",
                EmotionType.Fatigue => "피로",
                EmotionType.Calm => "평온",
                EmotionType.Excitement => "설렘",
                EmotionType.Loneliness => "외로움",
                EmotionType.Boredom => "무료함",
                EmotionType.Depression => "우울",
                _ => "알 수 없음"
            };
        }
    }
}
