using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelServicesController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await dbContext.HotelServices
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync();
        return Ok(services);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateServiceRequest request)
    {
        var service = new HotelService
        {
            Name = request.Name.Trim(),
            UnitPrice = request.UnitPrice,
            IsActive = true
        };

        dbContext.HotelServices.Add(service);
        await dbContext.SaveChangesAsync();
        return Ok(service);
    }
}
