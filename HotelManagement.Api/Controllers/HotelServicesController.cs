using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

/// <summary>Danh mục dịch vụ theo khách sạn (giá gợi ý — map với ServiceOrder.ServiceCode).</summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HotelServicesController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? hotelId, [FromQuery] bool includeInactive = false)
    {
        var query = dbContext.HotelServices.AsQueryable();
        if (hotelId.HasValue)
            query = query.Where(x => x.HotelId == hotelId.Value);
        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        var list = await query.OrderBy(x => x.HotelId).ThenBy(x => x.ServiceCode).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await dbContext.HotelServices.FirstOrDefaultAsync(x => x.HotelServiceId == id);
        if (item is null)
            return NotFound(new { message = "Không tìm thấy dịch vụ trong danh mục." });
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public async Task<IActionResult> Create([FromBody] CreateHotelServiceRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var hotelOk = await dbContext.Hotels.AnyAsync(h => h.HotelId == request.HotelId && h.IsActive);
        if (!hotelOk)
            return BadRequest(new { message = "Khách sạn không tồn tại hoặc đã ngưng hoạt động." });

        var code = request.ServiceCode.Trim().Replace(' ', '_').ToUpperInvariant();
        if (await dbContext.HotelServices.AnyAsync(x =>
                x.HotelId == request.HotelId && x.ServiceCode == code))
            return BadRequest(new { message = "ServiceCode đã tồn tại trong khách sạn này." });

        var now = DateTime.UtcNow;
        var entity = new HotelServiceItem
        {
            HotelId = request.HotelId,
            ServiceCode = code,
            ServiceName = request.ServiceName.Trim(),
            DefaultUnitPrice = request.DefaultUnitPrice,
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.HotelServices.Add(entity);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "HOTEL_SERVICE_CREATE",
            "HotelService",
            entity.HotelServiceId.ToString(),
            after: entity);

        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateHotelServiceRequest request)
    {
        var entity = await dbContext.HotelServices.FirstOrDefaultAsync(x => x.HotelServiceId == id);
        if (entity is null)
            return NotFound(new { message = "Không tìm thấy dịch vụ trong danh mục." });

        var before = new { entity.ServiceName, entity.DefaultUnitPrice, entity.IsActive };
        entity.ServiceName = request.ServiceName.Trim();
        entity.DefaultUnitPrice = request.DefaultUnitPrice;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "HOTEL_SERVICE_UPDATE",
            "HotelService",
            entity.HotelServiceId.ToString(),
            before: before,
            after: entity);

        return Ok(entity);
    }
}
