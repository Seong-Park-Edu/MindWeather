using System.Threading.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MindWeatherServer.Data;
using MindWeatherServer.Hubs;
using MindWeatherServer.Middleware;
using MindWeatherServer.Services;

var builder = WebApplication.CreateBuilder(args);

static string NormalizeConfigValue(string? value) =>
    string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().Trim('"', '\'');

static string NormalizeSupabaseProjectUrl(string? value)
{
    var normalized = NormalizeConfigValue(value).TrimEnd('/');
    const string authPath = "/auth/v1";
    return normalized.EndsWith(authPath, StringComparison.OrdinalIgnoreCase)
        ? normalized[..^authPath.Length]
        : normalized;
}

var supabaseUrl = NormalizeSupabaseProjectUrl(
    Environment.GetEnvironmentVariable("SUPABASE_URL")
    ?? builder.Configuration["Supabase:Url"]
);
var supabaseIssuer = !string.IsNullOrWhiteSpace(supabaseUrl)
    ? $"{supabaseUrl.TrimEnd('/')}/auth/v1"
    : null;
var supabaseAudience = NormalizeConfigValue(
    Environment.GetEnvironmentVariable("SUPABASE_AUDIENCE")
    ?? builder.Configuration["Supabase:Audience"]
    ?? "authenticated"
);
var supabaseJwksUrl = !string.IsNullOrWhiteSpace(supabaseIssuer)
    ? $"{supabaseIssuer.TrimEnd('/')}/.well-known/jwks.json"
    : null;
var supabaseJwksResolver = !string.IsNullOrWhiteSpace(supabaseJwksUrl)
    ? new SupabaseJwksResolver(supabaseJwksUrl)
    : null;

Console.WriteLine(
    $"[AuthConfig] Supabase issuer: {supabaseIssuer ?? "(null)"}, audience: {supabaseAudience}"
);
if (supabaseJwksResolver is not null)
{
    var startupKeyCount = supabaseJwksResolver.RefreshSigningKeys(force: true, reason: "startup");
    Console.WriteLine($"[AuthConfig] Supabase JWKS keys loaded at startup: {startupKeyCount}");
}

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
    static string NormalizeOrigin(string origin) =>
        origin.Trim().Trim('"', '\'').TrimEnd('/');

    var developmentOrigins = new[]
    {
        "http://localhost:5173",
        "http://localhost:3000",
        "http://172.30.1.56:5173",
        "capacitor://localhost",
        "http://localhost",
    };
    var configuredOrigins =
        builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? Array.Empty<string>();
    var envOriginsRaw = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
    var envOrigins = string.IsNullOrWhiteSpace(envOriginsRaw)
        ? Array.Empty<string>()
        : envOriginsRaw
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

    var origins = builder.Environment.IsDevelopment()
        ? developmentOrigins
            .Select(NormalizeOrigin)
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray()
        : configuredOrigins
            .Concat(envOrigins)
            .Select(NormalizeOrigin)
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

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
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;

        if (!string.IsNullOrWhiteSpace(supabaseIssuer))
        {
            options.Authority = supabaseIssuer;
            options.MetadataAddress = $"{supabaseIssuer.TrimEnd('/')}/.well-known/openid-configuration";
        }

        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.RefreshOnIssuerKeyNotFound = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(supabaseIssuer),
            ValidIssuers = string.IsNullOrWhiteSpace(supabaseIssuer)
                ? null
                : new[] { supabaseIssuer, $"{supabaseIssuer}/" },
            ValidateAudience = true,
            ValidAudiences = new[] { supabaseAudience, "authenticated", "anon", "service_role" },
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
                supabaseJwksResolver?.ResolveSigningKeys(kid) ?? Array.Empty<SecurityKey>(),
            ValidateLifetime = true,
            NameClaimType = "sub",
            RoleClaimType = "role",
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtAuth");
                var authorization = context.Request.Headers.Authorization.ToString();
                var token = authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    ? authorization["Bearer ".Length..].Trim()
                    : string.Empty;
                var tokenIssuer = "(unknown)";
                var tokenKid = "(unknown)";

                if (!string.IsNullOrWhiteSpace(token))
                {
                    try
                    {
                        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
                        tokenIssuer = string.IsNullOrWhiteSpace(jwt.Issuer) ? "(empty)" : jwt.Issuer;
                        tokenKid = string.IsNullOrWhiteSpace(jwt.Header.Kid)
                            ? "(empty)"
                            : jwt.Header.Kid;
                    }
                    catch (Exception parseEx)
                    {
                        logger.LogWarning(
                            parseEx,
                            "Failed to parse JWT token for auth diagnostics. Path: {Path}",
                            context.HttpContext.Request.Path
                        );
                    }
                }

                logger.LogWarning(
                    context.Exception,
                    "JWT auth failed. Path: {Path}, TokenIssuer: {TokenIssuer}, TokenKid: {TokenKid}",
                    context.HttpContext.Request.Path,
                    tokenIssuer,
                    tokenKid
                );
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("JwtAuth");
                logger.LogWarning(
                    "JWT challenge issued. Path: {Path}, Error: {Error}, Description: {Description}",
                    context.HttpContext.Request.Path,
                    context.Error ?? "(none)",
                    context.ErrorDescription ?? "(none)"
                );
                return Task.CompletedTask;
            }
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

app.UseForwardedHeaders();
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
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

sealed class SupabaseJwksResolver
{
    private static readonly HttpClient HttpClient = new() { Timeout = TimeSpan.FromSeconds(10) };
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromMinutes(30);

    private readonly string _jwksUrl;
    private readonly SemaphoreSlim _refreshGate = new(1, 1);
    private IReadOnlyList<SecurityKey> _allKeys = Array.Empty<SecurityKey>();
    private IReadOnlyDictionary<string, SecurityKey> _keysByKid =
        new Dictionary<string, SecurityKey>(StringComparer.Ordinal);
    private DateTimeOffset _lastRefreshUtc = DateTimeOffset.MinValue;

    public SupabaseJwksResolver(string jwksUrl)
    {
        _jwksUrl = jwksUrl;
    }

    public int RefreshSigningKeys(bool force, string reason)
    {
        var now = DateTimeOffset.UtcNow;
        if (!force && _allKeys.Count > 0 && now - _lastRefreshUtc < RefreshInterval)
        {
            return _allKeys.Count;
        }

        _refreshGate.Wait();
        try
        {
            now = DateTimeOffset.UtcNow;
            if (!force && _allKeys.Count > 0 && now - _lastRefreshUtc < RefreshInterval)
            {
                return _allKeys.Count;
            }

            var jwksJson = HttpClient.GetStringAsync(_jwksUrl).GetAwaiter().GetResult();
            var jwks = new JsonWebKeySet(jwksJson);
            var signingKeys = jwks.GetSigningKeys().ToList();

            if (signingKeys.Count == 0)
            {
                Console.WriteLine(
                    $"[JwtKeys] Refresh returned zero signing keys. Reason: {reason}, Url: {_jwksUrl}"
                );
                return _allKeys.Count;
            }

            _allKeys = signingKeys;
            _keysByKid = signingKeys
                .Where(k => !string.IsNullOrWhiteSpace(k.KeyId))
                .ToDictionary(k => k.KeyId!, k => k, StringComparer.Ordinal);
            _lastRefreshUtc = now;

            Console.WriteLine($"[JwtKeys] Refreshed signing keys: {signingKeys.Count}. Reason: {reason}");
            return signingKeys.Count;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"[JwtKeys] Failed to refresh signing keys. Reason: {reason}. {ex.GetType().Name}: {ex.Message}"
            );
            return _allKeys.Count;
        }
        finally
        {
            _refreshGate.Release();
        }
    }

    public IEnumerable<SecurityKey> ResolveSigningKeys(string? kid)
    {
        if (!string.IsNullOrWhiteSpace(kid) && _keysByKid.TryGetValue(kid, out var key))
        {
            return new[] { key };
        }

        RefreshSigningKeys(force: false, reason: "periodic");
        if (!string.IsNullOrWhiteSpace(kid) && _keysByKid.TryGetValue(kid, out key))
        {
            return new[] { key };
        }

        if (!string.IsNullOrWhiteSpace(kid))
        {
            RefreshSigningKeys(force: true, reason: $"kid-miss:{kid}");
            if (_keysByKid.TryGetValue(kid, out key))
            {
                return new[] { key };
            }
        }

        return _allKeys;
    }
}
