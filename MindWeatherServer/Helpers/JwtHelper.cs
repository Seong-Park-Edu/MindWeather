using System.Security.Claims;

namespace MindWeatherServer.Helpers
{
    public static class JwtHelper
    {
        public static Guid? GetUserIdFromClaimsPrincipal(ClaimsPrincipal user)
        {
            var subjectClaim = user.FindFirst("sub")?.Value
                ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("nameidentifier")?.Value;

            return Guid.TryParse(subjectClaim, out var userId) ? userId : null;
        }
    }
}
