using System.Text.Json;

namespace MindWeatherServer.Services
{
    public class PushNotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PushNotificationService> _logger;

        public PushNotificationService(HttpClient httpClient, ILogger<PushNotificationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<bool> SendPushNotification(
            string pushToken,
            string title,
            string body,
            object? data = null)
        {
            try
            {
                var message = new
                {
                    to = pushToken,
                    sound = "default",
                    title = title,
                    body = body,
                    data = data ?? new { }
                };

                var response = await _httpClient.PostAsJsonAsync(
                    "https://exp.host/--/api/v2/push/send",
                    message
                );

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Push notification failed: {errorContent}");
                    return false;
                }

                var result = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Push notification sent successfully: {result}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending push notification: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendPushNotifications(
            List<string> pushTokens,
            string title,
            string body,
            object? data = null)
        {
            try
            {
                var messages = pushTokens.Select(token => new
                {
                    to = token,
                    sound = "default",
                    title = title,
                    body = body,
                    data = data ?? new { }
                }).ToList();

                var response = await _httpClient.PostAsJsonAsync(
                    "https://exp.host/--/api/v2/push/send",
                    messages
                );

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Bulk push notifications failed: {errorContent}");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending bulk push notifications: {ex.Message}");
                return false;
            }
        }
    }
}
