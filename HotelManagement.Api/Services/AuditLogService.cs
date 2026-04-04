using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using HotelManagement.Api.Data;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Http;

namespace HotelManagement.Api.Services;

public class AuditLogService(HotelDbContext dbContext, IHttpContextAccessor httpContextAccessor) : IAuditLogService
{
    public async Task WriteAsync(
        string action,
        string entityName,
        string entityId,
        string? reason = null,
        object? before = null,
        object? after = null,
        int? actorUserId = null)
    {
        var httpContext = httpContextAccessor.HttpContext;
        int? actorId = actorUserId;

        if (actorId is null)
        {
            var actorStr =
                httpContext?.User?.Claims?.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value
                ?? httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContext?.User?.FindFirst("sub")?.Value;

            if (int.TryParse(actorStr, out var parsed))
                actorId = parsed;
        }

        var beforeJson = before is null ? null : JsonSerializer.Serialize(before);
        var afterJson = after is null ? null : JsonSerializer.Serialize(after);

        var log = new AuditLog
        {
            ActorUserId = actorId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Reason = reason?.Trim(),
            BeforeJson = beforeJson,
            AfterJson = afterJson,
            CreatedAt = DateTime.UtcNow.AddHours(7)
        };

        dbContext.AuditLogs.Add(log);
        await dbContext.SaveChangesAsync();
    }
}
