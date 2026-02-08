using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindWeatherServer.Models
{
    public class DailyLetter
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;

        public DateTime? ReadAt { get; set; }

        // 편지 생성 시 참고한 감정 데이터 기간
        public DateTime AnalyzedFrom { get; set; }
        public DateTime AnalyzedTo { get; set; }

        // 관계 설정
        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
