using System;
using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.Models
{
    public class PublicMessageLike
    {
        public long Id { get; set; }

        [Required]
        public int MessageId { get; set; } // 게시글 FK

        [Required]
        public Guid UserId { get; set; } // 좋아요 누른 사용자

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual PublicComfortMessage Message { get; set; }
    }
}
