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

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyLetterScheduler started");

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;
                var scheduledTime = new DateTime(now.Year, now.Month, now.Day, 19, 0, 0); // 오후 7시

                // 이미 오후 7시가 지났으면 내일 7시로 설정
                if (now > scheduledTime)
                {
                    scheduledTime = scheduledTime.AddDays(1);
                }

                var delay = scheduledTime - now;
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

            // AI 편지 생성
            var letterContent = await geminiService.GenerateDailyLetter(emotionSummary);

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
            var emotionCounts = logs.GroupBy(e => e.Emotion)
                .ToDictionary(g => g.Key, g => g.Count());

            var avgIntensity = logs.Average(e => e.Intensity);

            // 가장 많이 느낀 감정 3개
            var topEmotions = emotionCounts
                .OrderByDescending(kvp => kvp.Value)
                .Take(3)
                .Select(kvp => GetEmotionName(kvp.Key))
                .ToList();

            // 최근 태그 분석
            var recentTags = logs
                .Where(e => !string.IsNullOrEmpty(e.Tags))
                .SelectMany(e => e.Tags!.Split(','))
                .GroupBy(t => t.Trim())
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToList();

            var summary = $@"최근 7일간 {totalLogs}번의 감정 기록
주요 감정: {string.Join(", ", topEmotions)}
평균 감정 강도: {avgIntensity:F1}/10";

            if (recentTags.Any())
            {
                summary += $"\n자주 언급된 주제: {string.Join(", ", recentTags)}";
            }

            return summary;
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
