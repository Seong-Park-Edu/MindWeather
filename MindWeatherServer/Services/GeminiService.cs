using System.Text;
using System.Text.Json;

namespace MindWeatherServer.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// 사용자의 감정 데이터를 분석하여 30년차 상담사 톤의 위로 편지 생성
        /// </summary>
        public async Task<string> GenerateDailyLetter(string emotionSummary, string userName = "당신")
        {
            try
            {
                var apiKey = _configuration["Gemini:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("Gemini API key not found in configuration");
                    return GetFallbackLetter();
                }

                var prompt = $@"당신은 30년 경력의 따뜻하고 공감능력이 뛰어난 심리 상담사입니다.
한 사람의 최근 감정 기록을 분석하여 진심 어린 위로의 편지를 작성해주세요.

**감정 분석 데이터:**
{emotionSummary}

**편지 작성 가이드라인:**
1. 200-300자 길이로 작성
2. AI가 쓴 것 같은 느낌이 들지 않도록 자연스럽고 인간적으로 작성
3. 직접적인 조언보다는 공감과 위로에 집중
4. ""힘내세요"", ""괜찮아요"" 같은 진부한 표현 지양
5. 구체적인 감정을 언급하며 공감 표현
6. 마치 오래된 친구가 조용히 옆에 앉아 이야기하는 듯한 톤
7. 편지 시작은 자연스럽게 (""안녕하세요"" 같은 인사 불필요)
8. 편지 끝은 따뜻한 마무리로 (""마음의 정원을 가꾸는 식물이"" 같은 서명 추가)

이제 진심 어린 위로의 편지를 작성해주세요:";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.9,
                        topK = 40,
                        topP = 0.95,
                        maxOutputTokens = 512,
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(
                    $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}",
                    content
                );

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Gemini API request failed: {errorContent}");
                    return GetFallbackLetter();
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GeminiResponse>(responseContent);

                var generatedText = result?.candidates?[0]?.content?.parts?[0]?.text;

                if (string.IsNullOrEmpty(generatedText))
                {
                    _logger.LogWarning("Gemini API returned empty response");
                    return GetFallbackLetter();
                }

                return generatedText.Trim();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating letter with Gemini: {ex.Message}");
                return GetFallbackLetter();
            }
        }

        /// <summary>
        /// API 실패 시 기본 편지 반환
        /// </summary>
        private string GetFallbackLetter()
        {
            return @"오늘도 하루를 보내셨네요.

당신의 마음이 어떤 색깔이었는지, 어떤 무게를 지녔는지 조금은 알 것 같아요.
살아가다 보면 모든 날이 맑을 수는 없죠. 때론 흐린 날도, 비 오는 날도 있게 마련이니까요.

그래도 이렇게 당신의 마음을 기록하고 돌아보는 시간을 가지는 것만으로도
당신은 이미 자신을 충분히 돌보고 있는 거예요.

내일은 또 어떤 하루가 될지 모르지만,
지금 이 순간 당신이 느끼는 모든 감정이 소중하다는 걸 기억해주세요.

- 마음의 정원을 가꾸는 식물이";
        }

        // Gemini API 응답 모델
        private class GeminiResponse
        {
            public Candidate[]? candidates { get; set; }
        }

        private class Candidate
        {
            public Content? content { get; set; }
        }

        private class Content
        {
            public Part[]? parts { get; set; }
        }

        private class Part
        {
            public string? text { get; set; }
        }
    }
}
