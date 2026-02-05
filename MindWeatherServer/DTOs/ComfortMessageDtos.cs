using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.DTOs
{
    // 위로 메시지 전송 요청
    public class SendMessageRequest
    {
        [Required]
        public Guid SenderId { get; set; }

        [Required]
        public Guid ReceiverId { get; set; }

        public long? TargetLogId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Content { get; set; }
    }

    // 위로 메시지 응답
    public class MessageResponse
    {
        public long Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public long? TargetLogId { get; set; }
        public string Content { get; set; }
        public string Status { get; set; }
        public bool IsThanked { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ThankedAt { get; set; }
    }
}
