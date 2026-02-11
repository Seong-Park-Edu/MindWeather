using System;
using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.Models
{
    public class PublicMessageReply
    {
        public long Id { get; set; }

        [Required]
        public int MessageId { get; set; } // 원본 게시글 FK

        [Required]
        public Guid UserId { get; set; } // 작성자

        [Required]
        [MaxLength(200)]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual PublicComfortMessage Message { get; set; }
    }
}
