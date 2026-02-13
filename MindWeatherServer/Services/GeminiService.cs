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
        /// 사용자의 감정 데이터를 분석하여 따뜻한 어머니 톤의 위로 편지 생성
        /// </summary>
        public async Task<string> GenerateDailyLetter(
            string emotionSummary,
            string? previousLetter = null,
            string userName = "당신")
        {
            try
            {
                var apiKey = _configuration["Gemini:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("Gemini API key not found in configuration");
                    return GetFallbackLetter();
                }

                // 오늘 날짜/요일/계절 정보
                var kstNow = TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("Korea Standard Time"));
                var dayOfWeek = kstNow.DayOfWeek switch
                {
                    DayOfWeek.Monday => "월요일",
                    DayOfWeek.Tuesday => "화요일",
                    DayOfWeek.Wednesday => "수요일",
                    DayOfWeek.Thursday => "목요일",
                    DayOfWeek.Friday => "금요일",
                    DayOfWeek.Saturday => "토요일",
                    DayOfWeek.Sunday => "일요일",
                    _ => ""
                };
                var season = kstNow.Month switch
                {
                    3 or 4 or 5 => "봄",
                    6 or 7 or 8 => "여름",
                    9 or 10 or 11 => "가을",
                    _ => "겨울"
                };

                var previousLetterSection = "";
                if (!string.IsNullOrEmpty(previousLetter))
                {
                    previousLetterSection = $@"

**어제 보낸 편지 (절대 비슷하게 쓰지 마세요):**
""{previousLetter}""
→ 위 편지와 완전히 다른 표현, 다른 첫 문장, 다른 관점, 다른 구조로 써주세요.
→ 같은 단어나 비유를 반복하지 마세요.";
                }

                // 매일 다른 편지를 위한 랜덤 창작 방향
                var creativeAngles = new[]
                {
                    "오늘은 계절의 풍경을 빗대어 마음을 표현해주세요.",
                    "오늘은 어릴 적 추억을 떠올리며 써주세요.",
                    "오늘은 함께 밥을 먹는 상상을 하며 써주세요.",
                    "오늘은 날씨 이야기로 자연스럽게 시작해주세요.",
                    "오늘은 아이가 잠들기 전 이불을 덮어주는 마음으로 써주세요.",
                    "오늘은 멀리서 아이의 뒷모습을 바라보는 심정으로 써주세요.",
                    "오늘은 오래된 편지지에 펜으로 천천히 적는 느낌으로 써주세요.",
                    "오늘은 작은 선물을 건네는 마음으로 시작해주세요.",
                    "오늘은 산책하다 아이 생각이 난 듯 써주세요.",
                    "오늘은 아이가 좋아하는 음식을 만들어주고 싶은 마음으로 써주세요.",
                    "오늘은 창밖을 보다가 문득 아이가 떠올라서 쓰는 편지입니다.",
                    "오늘은 아이의 어린 시절 한 장면을 떠올리며 시작해주세요.",
                    "오늘은 새벽에 잠이 안 와서 쓰는 편지처럼 써주세요.",
                    "오늘은 아이와 나란히 걷는 상상을 하며 써주세요.",
                };
                var random = new Random();
                var todayAngle = creativeAngles[random.Next(creativeAngles.Length)];

                var prompt = $@"당신은 세상에서 가장 다정한 어머니입니다.
자녀가 세상을 살아가면서 겪는 감정의 파도를 멀리서 조용히 지켜보고 있었습니다.
오늘은 {kstNow:yyyy년 M월 d일} {dayOfWeek}, {season}입니다. 그 아이에게 손편지를 씁니다.

**오늘의 창작 방향:** {todayAngle}

**이 아이의 최근 마음 상태:**
{emotionSummary}
{previousLetterSection}

**편지를 쓸 때 지켜야 할 것:**
1. 250-350자 길이로 작성
2. 절대 AI가 쓴 것처럼 보여서는 안 됩니다. 실제 어머니가 펜을 들고 쓴 것처럼 자연스럽게.
3. ""힘내"", ""괜찮아"", ""잘 될 거야"" 같은 뻔한 위로는 쓰지 마세요.
4. 감정 데이터에서 읽히는 구체적인 상황에 공감하세요. 예를 들어 '직장' 태그가 있으면 일이 힘들었구나 하고, '피로'가 잦으면 쉬지 못하고 있구나 하고.
5. 어머니는 조언하지 않습니다. 그저 ""네가 어떤 하루를 보냈는지 알고 있어"" 하는 마음을 전합니다.
6. 때로는 걱정을, 때로는 대견함을, 때로는 안쓰러움을 표현하세요.
7. ""밥은 먹었니"", ""따뜻하게 입고 다녀"" 같은 일상적이고 소박한 표현이 좋습니다.
8. 문장은 짧고 담백하게. 긴 수식어나 화려한 비유보다 진심이 느껴지는 짧은 문장.
9. 편지 시작은 자연스럽게 시작하세요 (""안녕"" 같은 인사 불필요).
10. 편지 끝에는 따뜻한 서명을 남기세요 (예: ""- 늘 네 편인 사람이"", ""- 항상 여기 있는 엄마가"").
11. 오늘의 날씨, 계절, 요일 분위기를 자연스럽게 녹여주세요.

**절대 하지 말 것:**
- ""~하세요"" 같은 존댓말 명령형
- ""당신의 감정은 소중합니다"" 같은 교과서적 위로
- ""오늘도 수고했어요"" 같은 천편일률적 표현
- 나열식 조언 (1, 2, 3 같은 리스트)
- 마크다운 서식 (**, ## 등)
- 이전 편지와 비슷한 문장 구조나 표현

이제 진심을 담아 편지를 써주세요:";

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

                var request = new HttpRequestMessage(HttpMethod.Post,
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
                request.Headers.Add("x-goog-api-key", apiKey);
                request.Content = content;

                var response = await _httpClient.SendAsync(request);

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
        /// 사용자 작성 콘텐츠의 안전성을 검사합니다.
        /// true = 안전, false = 부적절
        /// API 실패 시 안전한 것으로 간주 (서비스 중단 방지)
        /// </summary>
        public async Task<bool> CheckContentSafety(string content)
        {
            try
            {
                var apiKey = _configuration["Gemini:ApiKey"];
                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogWarning("Gemini API key not found, skipping moderation");
                    return true;
                }

                var prompt = $@"당신은 콘텐츠 모더레이터입니다.
아래 텍스트가 감정 공유/위로 서비스에 적합한지 판단해주세요.

**차단 기준 (하나라도 해당하면 UNSAFE):**
- 욕설, 비속어, 혐오 표현 (초성 욕설, 변형 포함)
- 성적 표현 또는 음란한 내용
- 폭력, 협박, 자해/자살 조장
- 개인정보 노출 (전화번호, 주소 등)
- 광고, 스팸성 내용
- 타인을 비하하거나 모욕하는 표현

**허용 기준:**
- 슬픔, 분노 등 부정적 감정 표현은 허용
- 위로, 공감, 격려의 메시지는 허용
- 일상적 대화는 허용

**검사할 텍스트:**
""{content}""

반드시 SAFE 또는 UNSAFE 중 하나만 답하세요.";

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
                        temperature = 0.1,
                        maxOutputTokens = 10,
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var modRequest = new HttpRequestMessage(HttpMethod.Post,
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
                modRequest.Headers.Add("x-goog-api-key", apiKey);
                modRequest.Content = httpContent;

                var response = await _httpClient.SendAsync(modRequest);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Gemini moderation API failed, allowing content");
                    return true;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<GeminiResponse>(responseContent);
                var answer = result?.candidates?[0]?.content?.parts?[0]?.text?.Trim().ToUpper() ?? "";

                var isSafe = !answer.Contains("UNSAFE");
                if (!isSafe)
                {
                    _logger.LogInformation($"[Moderation] Content blocked: \"{content.Substring(0, Math.Min(50, content.Length))}...\"");
                }

                return isSafe;
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Moderation check failed, allowing content: {ex.Message}");
                return true;
            }
        }

        /// <summary>
        /// API 실패 시 기본 편지 반환
        /// </summary>
        private string GetFallbackLetter()
        {
            return @"오늘 하루도 무사히 보냈구나.

바쁘게 지내느라 밥은 제대로 챙겨 먹었는지 모르겠다.
네가 요즘 어떤 하루를 보내고 있는지, 멀리서 가만히 생각해봤어.

잘하고 있어. 네가 느끼는 대로 느끼면 되는 거야.
기쁜 날은 기뻐하고, 힘든 날은 힘들다고 말해도 돼.

오늘 자기 전에 따뜻한 거 한 잔 마시고,
좀 일찍 자렴.

- 늘 네 편인 사람이";
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
