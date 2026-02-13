using System.ComponentModel.DataAnnotations;
using MindWeatherServer.Models;

namespace MindWeatherServer.DTOs
{
    public class CreateEmotionRequest
    {
        [Required]
        public EmotionType Emotion { get; set; }

        [Range(1, 10)]
        public int Intensity { get; set; }

        public string Region { get; set; } = string.Empty;
        public string Tags { get; set; } = string.Empty;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class EmotionResponse
    {
        public Guid UserId { get; set; }
        public EmotionType Emotion { get; set; }
        public int Intensity { get; set; }
        public string Region { get; set; } = string.Empty;
        public string Tags { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
