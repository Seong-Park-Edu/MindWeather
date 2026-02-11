using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.Models
{
    public class PublicComfortMessage
    {
        public int Id { get; set; }

        [Required]
        public Guid UserId { get; set; } // 작성자 (익명이지만 ID 유지)

        [Required]
        [MaxLength(200)]
        public string Content { get; set; } // 위로의 내용

        public int LikeCount { get; set; } = 0; // 공감(하트) 수

        public int ReplyCount { get; set; } = 0; // 답글 수

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public virtual ICollection<PublicMessageReply> Replies { get; set; } = new List<PublicMessageReply>();
        public virtual ICollection<PublicMessageLike> Likes { get; set; } = new List<PublicMessageLike>();
    }
}
