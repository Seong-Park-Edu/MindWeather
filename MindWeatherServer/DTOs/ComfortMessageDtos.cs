using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.DTOs
{
    public class SendMessageRequest
    {
        [Required]
        public Guid ReceiverId { get; set; }

        public long? TargetLogId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Content { get; set; } = string.Empty;
    }

    public class MessageResponse
    {
        public long Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public long? TargetLogId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsThanked { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ThankedAt { get; set; }
    }
}
