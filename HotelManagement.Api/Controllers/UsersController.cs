using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize(Roles = "ADMIN")]
[ApiController]
[Route("api/[controller]")]
public class UsersController(
    HotelDbContext dbContext,
    IPasswordService passwordService,
    IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await (from u in dbContext.AppUsers
                           join ur in dbContext.AppUserRoles on u.UserId equals ur.UserId into urGroup
                           from ur in urGroup.DefaultIfEmpty()
                           join r in dbContext.AppRoles on ur.RoleId equals r.RoleId into roleGroup
                           from role in roleGroup.DefaultIfEmpty()
                           orderby u.Username
                           select new
                           {
                               u.UserId,
                               u.Username,
                               u.FullName,
                               u.Email,
                               u.Phone,
                               u.IsActive,
                               RoleCode = role != null ? role.RoleCode : null,
                               RoleName = role != null ? role.RoleName : null
                           })
            .AsNoTracking()
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var username = request.Username.Trim();
        var roleCode = request.RoleCode.Trim().ToUpperInvariant();

        var duplicate = await dbContext.AppUsers
            .AnyAsync(x => x.Username == username);
        if (duplicate)
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại." });

        var role = await dbContext.AppRoles
            .FirstOrDefaultAsync(r => r.RoleCode == roleCode && r.IsActive);
        if (role is null)
            return BadRequest(new { message = "Vai trò không tồn tại hoặc đã ngưng hoạt động." });

        var user = new AppUser
        {
            Username = username,
            PasswordHash = passwordService.Hash(request.Password),
            FullName = Normalize(request.FullName),
            Email = Normalize(request.Email),
            Phone = Normalize(request.Phone),
            IsActive = request.IsActive
        };

        dbContext.AppUsers.Add(user);
        await dbContext.SaveChangesAsync();

        dbContext.AppUserRoles.Add(new AppUserRole
        {
            UserId = user.UserId,
            RoleId = role.RoleId
        });
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "USER_CREATE",
            "AppUser",
            user.UserId.ToString(),
            after: new
            {
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Phone,
                user.IsActive,
                role.RoleCode
            });

        return Ok(new
        {
            message = "Tạo tài khoản thành công.",
            data = new
            {
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Phone,
                user.IsActive,
                role.RoleCode,
                role.RoleName
            }
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        var before = new
        {
            user.FullName,
            user.Email,
            user.Phone
        };

        user.FullName = Normalize(request.FullName);
        user.Email = Normalize(request.Email);
        user.Phone = Normalize(request.Phone);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "USER_UPDATE",
            "AppUser",
            user.UserId.ToString(),
            before: before,
            after: new { user.FullName, user.Email, user.Phone });

        return Ok(new
        {
            message = "Cập nhật thông tin tài khoản thành công.",
            data = new
            {
                user.UserId,
                user.Username,
                user.FullName,
                user.Email,
                user.Phone,
                user.IsActive
            }
        });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        var before = user.IsActive;
        user.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "USER_STATUS_UPDATE",
            "AppUser",
            user.UserId.ToString(),
            before: new { IsActive = before },
            after: new { user.IsActive });

        return Ok(new { message = "Cập nhật trạng thái tài khoản thành công." });
    }

    [HttpPut("{id:int}/roles")]
    public async Task<IActionResult> SetRoles(int id, [FromBody] SetUserRolesRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        var roleCodes = request.RoleCodes
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToUpperInvariant())
            .Distinct()
            .ToList();

        if (roleCodes.Count == 0)
            return BadRequest(new { message = "Cần ít nhất 1 vai trò hợp lệ." });

        var roles = await dbContext.AppRoles
            .Where(r => r.IsActive && roleCodes.Contains(r.RoleCode))
            .ToListAsync();
        if (roles.Count != roleCodes.Count)
            return BadRequest(new { message = "Có vai trò không tồn tại hoặc đã ngưng hoạt động." });

        var beforeRoleCodes = await (from ur in dbContext.AppUserRoles
                                     join r in dbContext.AppRoles on ur.RoleId equals r.RoleId
                                     where ur.UserId == user.UserId
                                     select r.RoleCode).ToListAsync();

        var existingRoles = dbContext.AppUserRoles.Where(x => x.UserId == user.UserId);
        dbContext.AppUserRoles.RemoveRange(existingRoles);
        dbContext.AppUserRoles.AddRange(roles.Select(r => new AppUserRole
        {
            UserId = user.UserId,
            RoleId = r.RoleId
        }));
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "USER_ROLE_SET",
            "AppUser",
            user.UserId.ToString(),
            before: new { roleCodes = beforeRoleCodes },
            after: new { roleCodes });

        return Ok(new
        {
            message = "Cập nhật vai trò thành công.",
            data = new
            {
                user.UserId,
                user.Username,
                roleCodes
            }
        });
    }

    private static string? Normalize(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
