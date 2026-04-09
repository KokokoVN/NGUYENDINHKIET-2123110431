using HotelManagement.Api.Data;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize(Roles = "ADMIN")]
[ApiController]
[Route("api/[controller]")]
public class RolesController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        var query = dbContext.AppRoles.AsQueryable();
        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        var list = await query.OrderBy(r => r.RoleCode).ToListAsync();
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AppRole request)
    {
        var roleCode = request.RoleCode.Trim().ToUpperInvariant();
        var roleName = request.RoleName.Trim();

        if (string.IsNullOrWhiteSpace(roleCode) || string.IsNullOrWhiteSpace(roleName))
            return BadRequest(new { message = "roleCode và roleName là bắt buộc." });

        var duplicate = await dbContext.AppRoles.AnyAsync(r => r.RoleCode == roleCode);
        if (duplicate)
            return BadRequest(new { message = "RoleCode đã tồn tại." });

        var role = new AppRole
        {
            RoleCode = roleCode,
            RoleName = roleName,
            IsActive = request.IsActive
        };

        dbContext.AppRoles.Add(role);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "ROLE_CREATE",
            "AppRole",
            role.RoleId.ToString(),
            after: role);

        return Ok(role);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AppRole request)
    {
        var role = await dbContext.AppRoles.FirstOrDefaultAsync(r => r.RoleId == id);
        if (role is null)
            return NotFound(new { message = "Không tìm thấy vai trò." });

        var roleCode = request.RoleCode.Trim().ToUpperInvariant();
        var roleName = request.RoleName.Trim();
        if (string.IsNullOrWhiteSpace(roleCode) || string.IsNullOrWhiteSpace(roleName))
            return BadRequest(new { message = "roleCode và roleName là bắt buộc." });

        var duplicate = await dbContext.AppRoles.AnyAsync(r => r.RoleId != id && r.RoleCode == roleCode);
        if (duplicate)
            return BadRequest(new { message = "RoleCode đã tồn tại." });

        var before = new { role.RoleCode, role.RoleName, role.IsActive };
        role.RoleCode = roleCode;
        role.RoleName = roleName;
        role.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "ROLE_UPDATE",
            "AppRole",
            role.RoleId.ToString(),
            before: before,
            after: new { role.RoleCode, role.RoleName, role.IsActive });

        return Ok(role);
    }
}
