using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Hubs;
using MindWeatherServer.Middleware;
using MindWeatherServer.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. DB 연결 설정
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

// 2. CORS 설정 (React 프론트엔드용 + SignalR)
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://172.30.1.56:5173",
                    "capacitor://localhost",
                    "http://localhost",
                    "https://mind-weather-theta.vercel.app" // Vercel Cloud
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // SignalR 필수 설정
        }
    );
});

// 3. 컨트롤러 등록
builder.Services.AddControllers();
builder.Services.AddSignalR(); // SignalR 등록

// 4. Push Notification 서비스 등록
builder.Services.AddHttpClient<PushNotificationService>();

// 4.5 Gemini AI 서비스 등록
builder.Services.AddHttpClient<GeminiService>();

// 4.6 Daily Letter Scheduler 등록 (백그라운드 서비스)
builder.Services.AddHostedService<DailyLetterScheduler>();

// 5. Swagger 설정
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 6. Rate Limiting 설정
builder.Services.AddRateLimiter(options =>
{
    // 전역 기본: IP당 분당 100회
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    // 쓰기 작업용: IP당 분당 15회 (감정 기록, 위로 메시지, 게시글 등)
    options.AddFixedWindowLimiter("write", limiterOptions =>
    {
        limiterOptions.PermitLimit = 15;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });

    options.RejectionStatusCode = 429;
});

var app = builder.Build();

// 개발 환경에서만 상세 에러 페이지 노출
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Swagger는 항상 활성화 (API 문서용)
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

// 차단된 사용자 요청 거부
app.UseMiddleware<BannedUserMiddleware>();

app.UseRateLimiter();

app.UseAuthorization();

// 5. 컨트롤러/Hub 경로 매핑
app.MapControllers();
app.MapHub<EmotionHub>("/emotionHub"); // SignalR Hub 엔드포인트

// [추가] 앱 시작 시 자동으로 DB 마이그레이션 및 긴급 복구 실행
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // 자동 마이그레이션 실행
        Console.WriteLine("⏳ Attempting Database Migration...");
        context.Database.Migrate();
        Console.WriteLine("✅ Database migration completed successfully.");

        // 2. [긴급] IsAdmin 컬럼 강제 확인 및 추가 (마이그레이션 실패 대비)
        // Npgsql은 PostgreSQL용이므로 SQL 문법이 다름
        var checkColumnSql =
            @"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'IsAdmin') THEN
                    ALTER TABLE ""Users"" ADD COLUMN ""IsAdmin"" boolean NOT NULL DEFAULT FALSE;
                END IF;
            END $$;";

        context.Database.ExecuteSqlRaw(checkColumnSql);
        Console.WriteLine("✅ Schema verification (IsAdmin) completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database Setup Failed: {ex.Message}");
    }
}

app.Run();
