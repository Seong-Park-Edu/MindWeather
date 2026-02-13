using Microsoft.EntityFrameworkCore;
using MindWeatherServer.Data;
using MindWeatherServer.Helpers;

namespace MindWeatherServer.Middleware
{
    /// <summary>
    /// 차단된 사용자의 요청을 거부하는 미들웨어.
    /// Authorization 헤더가 있는 요청에서 userId를 추출하고,
    /// 해당 유저가 IsBanned인 경우 403을 반환합니다.
    /// </summary>
    public class BannedUserMiddleware
    {
        private readonly RequestDelegate _next;

        public BannedUserMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var userId = JwtHelper.GetUserIdFromClaimsPrincipal(context.User);

            if (userId != null)
            {
                var dbContext = context.RequestServices.GetRequiredService<AppDbContext>();
                var isBanned = await dbContext.Users
                    .Where(u => u.UserId == userId.Value)
                    .Select(u => u.IsBanned)
                    .FirstOrDefaultAsync();

                if (isBanned)
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"message\":\"계정이 정지되었습니다. 관리자에게 문의하세요.\"}");
                    return;
                }
            }

            await _next(context);
        }
    }
}
