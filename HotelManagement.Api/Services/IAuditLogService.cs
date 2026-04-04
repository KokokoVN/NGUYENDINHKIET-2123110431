namespace HotelManagement.Api.Services;

public interface IAuditLogService
{
    Task WriteAsync(
        string action,
        string entityName,
        string entityId,
        string? reason = null,
        object? before = null,
        object? after = null,
        int? actorUserId = null);
}
