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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 인덱스 설정 (속도 최적화)
            modelBuilder.Entity<EmotionLog>().HasIndex(e => e.CreatedAt);
            modelBuilder.Entity<EmotionLog>().HasIndex(e => new { e.Region, e.CreatedAt });
        }
    }
}
