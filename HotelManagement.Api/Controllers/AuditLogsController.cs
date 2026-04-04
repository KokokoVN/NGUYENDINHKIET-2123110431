using HotelManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize(Roles = "ADMIN,MANAGER")]
[ApiController]
[Route("api/[controller]")]
public class AuditLogsController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? action,
        [FromQuery] string? entityName,
        [FromQuery] int take = 100)
    {
        take = Math.Clamp(take, 1, 500);
        var query = dbContext.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(action))
        {
            var a = action.Trim();
            query = query.Where(x => x.Action.Contains(a));
        }

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            var e = entityName.Trim();
            query = query.Where(x => x.EntityName.Contains(e));
        }

        var list = await query
            .OrderByDescending(x => x.AuditId)
            .Take(take)
            .ToListAsync();

        return Ok(list);
    }
}
