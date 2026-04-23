using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

/// <summary>Danh mục dịch vụ theo khách sạn (giá gợi ý — map với ServiceOrder.ServiceCode).</summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HotelServicesController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? hotelId,
        [FromQuery] string? search,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.HotelServices.AsQueryable();
        if (hotelId.HasValue)
            query = query.Where(x => x.HotelId == hotelId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(x => x.ServiceCode.Contains(s) || x.ServiceName.Contains(s));
        }
        if (!includeInactive)
            query = query.Where(x => x.IsActive);

        query = query.OrderBy(x => x.HotelId).ThenBy(x => x.ServiceCode);

        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var list = await query.ToListAsync();
            return Ok(list);
        }

        var currentPage = Math.Max(1, page ?? 1);
        var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 200);
        var totalItems = await query.CountAsync();
        var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling(totalItems / (double)currentPageSize);
        if (currentPage > totalPages) currentPage = totalPages;

        var items = await query
            .Skip((currentPage - 1) * currentPageSize)
            .Take(currentPageSize)
            .ToListAsync();

        return Ok(new { items, page = currentPage, pageSize = currentPageSize, totalItems, totalPages });
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

        return Ok(entity);
    }
}
