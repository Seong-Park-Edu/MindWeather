using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MindWeatherServer.Data;
using MindWeatherServer.Hubs;
using MindWeatherServer.Middleware;
using MindWeatherServer.Services;

var builder = WebApplication.CreateBuilder(args);

var supabaseUrl =
    builder.Configuration["Supabase:Url"] ?? Environment.GetEnvironmentVariable("SUPABASE_URL");
var supabaseIssuer = !string.IsNullOrWhiteSpace(supabaseUrl)
    ? $"{supabaseUrl.TrimEnd('/')}/auth/v1"
    : null;

var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (
    !builder.Environment.IsDevelopment()
    && (
        string.IsNullOrWhiteSpace(connectionString)
        || connectionString.Contains("YOUR_CONNECTION_STRING_HERE", StringComparison.OrdinalIgnoreCase)
    )
)
{
    throw new InvalidOperationException("Production requires DATABASE_URL or ConnectionStrings:DefaultConnection.");
}

if (
    !builder.Environment.IsDevelopment()
    && (
        string.IsNullOrWhiteSpace(supabaseUrl)
        || supabaseUrl.Contains("YOUR_SUPABASE_URL_HERE", StringComparison.OrdinalIgnoreCase)
    )
)
{
    throw new InvalidOperationException("Production requires Supabase:Url or SUPABASE_URL.");
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    var developmentOrigins = new[]
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://172.30.1.56:5173",
        "capacitor://localhost",
        "http://localhost",
    };
    var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    var envOriginsRaw = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
    var envOrigins = string.IsNullOrWhiteSpace(envOriginsRaw)
        ? Array.Empty<string>()
        : envOriginsRaw
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
    var origins = builder.Environment.IsDevelopment()
        ? developmentOrigins
        : (envOrigins.Length > 0 ? envOrigins : (configuredOrigins ?? Array.Empty<string>()));

    if (!builder.Environment.IsDevelopment() && origins.Length == 0)
    {
        throw new InvalidOperationException("Production requires at least one Cors:AllowedOrigins entry.");
    }

    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        if (!string.IsNullOrWhiteSpace(supabaseIssuer))
        {
            options.Authority = supabaseIssuer;
        }

        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(supabaseIssuer),
            ValidIssuer = supabaseIssuer,
            ValidateAudience = true,
            ValidAudience =
                builder.Configuration["Supabase:Audience"]
                ?? Environment.GetEnvironmentVariable("SUPABASE_AUDIENCE")
                ?? "authenticated",
            ValidateLifetime = true,
            NameClaimType = "sub",
            RoleClaimType = "role",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "admin"));
});

builder.Services.AddHttpClient<PushNotificationService>();
builder.Services.AddHttpClient<GeminiService>();
builder.Services.AddHostedService<DailyLetterScheduler>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.AddFixedWindowLimiter("write", limiterOptions =>
    {
        limiterOptions.PermitLimit = 15;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });

    options.RejectionStatusCode = 429;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseMiddleware<BannedUserMiddleware>();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();
app.MapHub<EmotionHub>("/emotionHub");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        Console.WriteLine("Attempting Database Migration...");
        try
        {
            context.Database.Migrate();
            Console.WriteLine("Database migration completed successfully.");
        }
        catch (Exception migrateEx)
        {
            Console.WriteLine($"EF Migration failed ({migrateEx.Message}), falling back to raw SQL...");
        }

        var ensureSchemaSql = @"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'IsAdmin') THEN
                    ALTER TABLE ""Users"" ADD COLUMN ""IsAdmin"" boolean NOT NULL DEFAULT FALSE;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PublicComfortMessages' AND column_name = 'ReplyCount') THEN
                    ALTER TABLE ""PublicComfortMessages"" ADD COLUMN ""ReplyCount"" integer NOT NULL DEFAULT 0;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PublicMessageLikes') THEN
                    CREATE TABLE ""PublicMessageLikes"" (
                        ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        ""MessageId"" integer NOT NULL REFERENCES ""PublicComfortMessages""(""Id"") ON DELETE CASCADE,
                        ""UserId"" uuid NOT NULL,
                        ""CreatedAt"" timestamp with time zone NOT NULL
                    );
                    CREATE UNIQUE INDEX ""IX_PublicMessageLikes_MessageId_UserId"" ON ""PublicMessageLikes"" (""MessageId"", ""UserId"");
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PublicMessageReplies') THEN
                    CREATE TABLE ""PublicMessageReplies"" (
                        ""Id"" bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                        ""MessageId"" integer NOT NULL REFERENCES ""PublicComfortMessages""(""Id"") ON DELETE CASCADE,
                        ""UserId"" uuid NOT NULL,
                        ""Content"" character varying(200) NOT NULL,
                        ""CreatedAt"" timestamp with time zone NOT NULL
                    );
                    CREATE INDEX ""IX_PublicMessageReplies_MessageId"" ON ""PublicMessageReplies"" (""MessageId"");
                END IF;
            END $$;";

        context.Database.ExecuteSqlRaw(ensureSchemaSql);
        Console.WriteLine("Schema verification completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database Setup Failed: {ex.Message}");
    }
}

app.Run();
