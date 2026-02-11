using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Models;

namespace MindWeatherServer.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // 테이블 등록
        public DbSet<User> Users { get; set; }
        public DbSet<EmotionLog> EmotionLogs { get; set; }
        public DbSet<ComfortMessage> ComfortMessages { get; set; }
        public DbSet<PublicComfortMessage> PublicComfortMessages { get; set; }
        public DbSet<PublicMessageReply> PublicMessageReplies { get; set; }
        public DbSet<PublicMessageLike> PublicMessageLikes { get; set; }
        public DbSet<DailyLetter> DailyLetters { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 인덱스 설정 (속도 최적화)
            modelBuilder.Entity<EmotionLog>().HasIndex(e => e.CreatedAt);
            modelBuilder.Entity<EmotionLog>().HasIndex(e => new { e.Region, e.CreatedAt });
            modelBuilder.Entity<EmotionLog>().HasIndex(e => e.UserId);

            modelBuilder.Entity<ComfortMessage>().HasIndex(e => e.SenderId);
            modelBuilder.Entity<ComfortMessage>().HasIndex(e => e.ReceiverId);
            modelBuilder.Entity<ComfortMessage>().HasIndex(e => e.SentAt);

            modelBuilder.Entity<DailyLetter>().HasIndex(e => e.UserId);
            modelBuilder.Entity<DailyLetter>().HasIndex(e => new { e.UserId, e.IsRead });

            // Public message indexes
            modelBuilder.Entity<PublicMessageReply>().HasIndex(e => e.MessageId);
            modelBuilder.Entity<PublicMessageLike>()
                .HasIndex(e => new { e.MessageId, e.UserId })
                .IsUnique(); // 한 유저가 같은 글에 중복 좋아요 방지
        }
    }
}
