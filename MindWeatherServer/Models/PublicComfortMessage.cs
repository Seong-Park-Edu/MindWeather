using System;
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

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
