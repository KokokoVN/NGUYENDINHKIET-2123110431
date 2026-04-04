using HotelManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RolesController(HotelDbContext dbContext) : ControllerBase
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
}
