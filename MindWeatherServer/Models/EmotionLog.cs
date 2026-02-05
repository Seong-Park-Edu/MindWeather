using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindWeatherServer.Models
{
    public class EmotionLog
    {
        [Key]
        public long Id { get; set; }

        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public EmotionType Emotion { get; set; }
        public int Intensity { get; set; }

        [MaxLength(50)]
        public string Region { get; set; }

        [MaxLength(200)]
        public string Tags { get; set; }

        // GPS 좌표 (선택적 - null 허용)
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum EmotionType
    {
        Joy,
        Sadness,
        Anger,
        Anxiety,
        Fatigue,
        Calm,
        Excitement,
        Boredom,
        Loneliness,
        Depression,
    }
}
