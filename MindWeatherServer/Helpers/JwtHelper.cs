using System.Security.Claims;

namespace MindWeatherServer.Helpers
{
    public static class JwtHelper
    {
        public static Guid? GetUserIdFromClaimsPrincipal(ClaimsPrincipal user)
        {
            var sub = user.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var userId) ? userId : null;
        }
    }
}
