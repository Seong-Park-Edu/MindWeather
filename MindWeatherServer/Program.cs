using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Hubs;

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
                    "http://localhost:3000", // 명시적 Origin 필요 (와일드카드 불가)
                    "http://172.30.1.56:5173", // Local Network
                    "capacitor://localhost", // iOS
                    "http://localhost" // Android
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

// 3. Swagger 설정
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. 개발 환경일 때 Swagger 화면 켜기
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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
