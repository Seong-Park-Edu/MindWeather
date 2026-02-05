using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MindWeatherServer.Models
{
    public class ComfortMessage
    {
        [Key]
        public long Id { get; set; }

        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }

        public long? TargetLogId { get; set; }

        [MaxLength(500)]
        public string Content { get; set; }

        public MessageStatus Status { get; set; }

        public bool IsThanked { get; set; } = false;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public DateTime? ThankedAt { get; set; }
    }

    public enum MessageStatus
    {
        Pending,
        Sent,
        Blocked
    }
}