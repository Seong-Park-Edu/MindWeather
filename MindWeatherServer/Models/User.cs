using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindWeatherServer.Models
{
    public class User
    {
        [Key]
        public Guid UserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActiveAt { get; set; }
        public bool IsBanned { get; set; } = false;

        public bool IsAdmin { get; set; } = false;

        // Push Notification
        public string? PushToken { get; set; }
        public DateTime? PushTokenUpdatedAt { get; set; }

        // 관계 설정
        public virtual ICollection<EmotionLog> EmotionLogs { get; set; }

        // 역방향 관계는 복잡도를 줄이기 위해 일단 주석 처리하거나, 필요시 추가
        // public virtual ICollection<ComfortMessage> SentMessages { get; set; }
        // public virtual ICollection<ComfortMessage> ReceivedMessages { get; set; }
    }
}
