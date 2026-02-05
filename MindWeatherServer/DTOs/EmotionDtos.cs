using System.ComponentModel.DataAnnotations;
using MindWeatherServer.Models;

namespace MindWeatherServer.DTOs
{
    // 1. 감정을 기록할 때 받는 데이터 (Input)
    public class CreateEmotionRequest
    {
        [Required]
        public Guid UserId { get; set; } // 누가

        [Required]
        public EmotionType Emotion { get; set; } // 어떤 감정을 (0:Joy, 1:Sadness ...)

        [Range(1, 10)]
        public int Intensity { get; set; } // 얼마나 강하게 (1~10)

        public string Region { get; set; } // 어디서 (예: Seoul)
        public string Tags { get; set; } // 태그 (예: #출근 #월요일)

        // GPS 좌표 (선택적)
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    // 2. 지도에 뿌려줄 데이터 (Output)
    public class EmotionResponse
    {
        public Guid UserId { get; set; } // 위로 메시지 전송용 (실제 유저 ID)
        public EmotionType Emotion { get; set; }
        public int Intensity { get; set; }
        public string Region { get; set; }
        public string Tags { get; set; } // 태그 정보 추가
        public DateTime CreatedAt { get; set; }

        // GPS 좌표
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
