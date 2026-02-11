using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;

namespace MindWeatherServer.Helpers
{
    public static class JwtHelper
    {
        /// <summary>
        /// Authorization 헤더에서 Supabase JWT의 sub (userId)를 추출합니다.
        /// </summary>
        public static Guid? GetUserIdFromHeader(string? authorization)
        {
            if (string.IsNullOrEmpty(authorization) || !authorization.StartsWith("Bearer "))
                return null;

            try
            {
                var token = authorization.Substring("Bearer ".Length).Trim();
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var sub = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

                if (sub != null && Guid.TryParse(sub, out var userId))
                    return userId;
            }
            catch
            {
                // 잘못된 토큰 형식
            }

            return null;
        }

        /// <summary>
        /// Authorization 헤더의 userId와 요청된 userId가 일치하는지 검증합니다.
        /// 일치하지 않으면 Unauthorized 또는 Forbid 결과를 반환합니다.
        /// </summary>
        public static IActionResult? ValidateUserId(string? authorization, Guid requestedUserId)
        {
            var tokenUserId = GetUserIdFromHeader(authorization);

            if (tokenUserId == null)
                return new UnauthorizedObjectResult(new { message = "인증이 필요합니다." });

            if (tokenUserId.Value != requestedUserId)
                return new ObjectResult(new { message = "권한이 없습니다." }) { StatusCode = 403 };

            return null; // 검증 통과
        }
    }
}
