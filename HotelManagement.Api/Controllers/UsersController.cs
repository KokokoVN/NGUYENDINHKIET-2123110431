using HotelManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize(Roles = "ADMIN")]
[ApiController]
[Route("api/[controller]")]
public class UsersController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await dbContext.AppUsers
            .AsNoTracking()
            .OrderBy(u => u.Username)
            .Select(u => new
            {
                u.UserId,
                u.Username,
                u.FullName,
                u.Email,
                u.Phone,
                u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }
}
