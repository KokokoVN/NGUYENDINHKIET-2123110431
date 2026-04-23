using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    HotelDbContext dbContext,
    IPasswordService passwordService,
    ITokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var username = request.Username.Trim();
        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.Username == username && x.IsActive);
        if (user is null || !passwordService.Verify(request.Password, user.Password))
        {
            return Unauthorized(new { message = "Ten dang nhap hoac mat khau khong dung." });
        }

        var roleCode = await (from ur in dbContext.AppUserRoles
                              join r in dbContext.AppRoles on ur.RoleId equals r.RoleId
                              where ur.UserId == user.UserId && r.IsActive
                              select r.RoleCode).FirstOrDefaultAsync() ?? "RECEPTION";

        var token = tokenService.GenerateToken(user, roleCode);
        return Ok(new LoginResponse
        {
            AccessToken = token.AccessToken,
            ExpiresAtUtc = token.ExpiresAtUtc,
            Username = user.Username,
            FullName = user.FullName ?? string.Empty,
            Role = roleCode
        });
    }

    /// <summary>Thông tin user hiện tại từ JWT (không trả mật khẩu).</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(sub, out var userId))
            return Unauthorized(new { message = "Token không hợp lệ." });

        var user = await dbContext.AppUsers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.IsActive);
        if (user is null)
            return Unauthorized(new { message = "Tài khoản không tồn tại hoặc đã khóa." });

        var roleCode = await (from ur in dbContext.AppUserRoles
                join r in dbContext.AppRoles on ur.RoleId equals r.RoleId
                where ur.UserId == user.UserId && r.IsActive
                select r.RoleCode).FirstOrDefaultAsync()
            ?? "RECEPTION";

        return Ok(new UserMeResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Role = roleCode
        });
    }

    /// <summary>Đăng xuất phía client (JWT stateless — xóa token ở app).</summary>
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Đăng xuất thành công. Hãy xóa accessToken ở phía client." });
    }
}
