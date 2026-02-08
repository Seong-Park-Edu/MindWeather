using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Hubs;
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

var app = builder.Build();

// 4. 디버깅을 위해 항상 개발자 페이지/Swagger 켜기 (배포 후 에러 확인용)
// if (app.Environment.IsDevelopment())
// {
app.UseDeveloperExceptionPage();
app.UseSwagger();
app.UseSwaggerUI();

// }

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

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

        // 1. 일반 마이그레이션 시도 (삭제: 불안정한 환경에서 크래시 유발)
        // Console.WriteLine("⏳ Attempting Database Migration...");
        // context.Database.Migrate();
        // Console.WriteLine("✅ Database migration completed successfully.");

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
