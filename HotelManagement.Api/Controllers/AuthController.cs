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
        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
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
}
