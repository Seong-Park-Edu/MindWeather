using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MindWeatherServer.DTOs
{
    public class CreatePublicMessageRequest
    {
        [Required]
        [MaxLength(200)]
        public string Content { get; set; } = string.Empty;
    }

    public class CreateReplyRequest
    {
        [Required]
        [MaxLength(200)]
        public string Content { get; set; } = string.Empty;
    }

    public class PublicMessageResponse
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int LikeCount { get; set; }
        public int ReplyCount { get; set; }
        public bool IsLikedByMe { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReplyResponse
    {
        public long Id { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class PublicMessageDetailResponse
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int LikeCount { get; set; }
        public bool IsLikedByMe { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ReplyResponse> Replies { get; set; } = new();
    }
}
