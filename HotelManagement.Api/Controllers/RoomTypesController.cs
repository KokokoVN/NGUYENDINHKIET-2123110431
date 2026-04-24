using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoomTypesController(HotelDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lọc theo hotelId, tên (search), capacity tối thiểu, baseRate tối đa, includeInactive.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? hotelId,
        [FromQuery] string? search,
        [FromQuery] int? minCapacity,
        [FromQuery] decimal? maxBaseRate,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.RoomTypes.AsQueryable();

        if (!includeInactive)
            query = query.Where(rt => rt.IsActive);

        if (hotelId.HasValue)
            query = query.Where(rt => rt.HotelId == hotelId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(rt => rt.RoomTypeName.Contains(s));
        }

        if (minCapacity.HasValue)
            query = query.Where(rt => rt.Capacity >= minCapacity.Value);

        if (maxBaseRate.HasValue)
            query = query.Where(rt => rt.BaseRate <= maxBaseRate.Value);

        query = query.OrderBy(rt => rt.HotelId).ThenBy(rt => rt.RoomTypeName);

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
    public async Task<IActionResult> GetById(int id, [FromQuery] bool includeInactive = false)
    {
        var query = dbContext.RoomTypes.AsQueryable().Where(rt => rt.RoomTypeId == id);
        if (!includeInactive)
            query = query.Where(rt => rt.IsActive);

        var roomType = await query.FirstOrDefaultAsync();
        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng." });

        return Ok(roomType);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create(CreateRoomTypeRequest request)
    {
        var hotelOk = await dbContext.Hotels.AnyAsync(h => h.HotelId == request.HotelId && h.IsActive);
        if (!hotelOk)
            return BadRequest(new { message = "Khách sạn không tồn tại hoặc đã ngưng hoạt động." });

        var name = request.RoomTypeName.Trim();
        var dup = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.HotelId == request.HotelId &&
            rt.RoomTypeName == name &&
            rt.IsActive);
        if (dup)
            return BadRequest(new { message = "Tên loại phòng đã tồn tại trong khách sạn này." });

        var roomType = new RoomType
        {
            HotelId = request.HotelId,
            RoomTypeName = name,
            Capacity = request.Capacity,
            BaseRate = request.BaseRate,
            Description = request.Description?.Trim(),
            IsActive = request.IsActive
        };

        dbContext.RoomTypes.Add(roomType);
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Thêm loại phòng thành công.", data = roomType });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Update(int id, UpdateRoomTypeRequest request)
    {
        var roomType = await dbContext.RoomTypes.FirstOrDefaultAsync(rt => rt.RoomTypeId == id && rt.IsActive);
        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng để cập nhật." });

        var name = request.RoomTypeName.Trim();
        var dup = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId != id &&
            rt.HotelId == roomType.HotelId &&
            rt.RoomTypeName == name &&
            rt.IsActive);
        if (dup)
            return BadRequest(new { message = "Tên loại phòng đã tồn tại trong khách sạn này." });

        var before = new
        {
            roomType.RoomTypeId,
            roomType.HotelId,
            roomType.RoomTypeName,
            roomType.Capacity,
            roomType.BaseRate,
            roomType.Description,
            roomType.IsActive
        };

        roomType.RoomTypeName = name;
        roomType.Capacity = request.Capacity;
        roomType.BaseRate = request.BaseRate;
        roomType.Description = request.Description?.Trim();
        roomType.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Cập nhật loại phòng thành công.", data = roomType });
    }

    /// <summary>Xóa mềm: IsActive = false.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(int id, [FromQuery] bool cascadeChildren = false)
    {
        var roomType = await dbContext.RoomTypes.FirstOrDefaultAsync(rt => rt.RoomTypeId == id && rt.IsActive);
        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng để ngưng hoạt động." });

        var activeRooms = await dbContext.Rooms
            .Where(r => r.RoomTypeId == id && r.IsActive)
            .ToListAsync();
        if (activeRooms.Count > 0 && !cascadeChildren)
        {
            return Conflict(new
            {
                message = "Loại phòng còn phòng đang hoạt động. Xác nhận để ngưng toàn bộ phòng thuộc loại này.",
                requiresConfirmation = true,
                activeChildren = new { rooms = activeRooms.Count }
            });
        }

        var before = new
        {
            roomType.RoomTypeId,
            roomType.HotelId,
            roomType.RoomTypeName,
            roomType.Capacity,
            roomType.BaseRate,
            roomType.Description,
            roomType.IsActive
        };

        if (cascadeChildren)
        {
            foreach (var room in activeRooms)
            {
                room.IsActive = false;
                room.StatusCode = "OUT_OF_SERVICE";
            }
        }

        roomType.IsActive = false;
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            message = cascadeChildren
                ? "Ngưng hoạt động loại phòng và toàn bộ phòng con thành công."
                : "Ngưng hoạt động loại phòng thành công."
        });
    }

    [HttpPut("{id:int}/restore")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Restore(int id)
    {
        var roomType = await dbContext.RoomTypes.FirstOrDefaultAsync(rt => rt.RoomTypeId == id && !rt.IsActive);
        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng đã ngưng hoạt động." });

        var hotelOk = await dbContext.Hotels.AnyAsync(h => h.HotelId == roomType.HotelId && h.IsActive);
        if (!hotelOk)
            return BadRequest(new { message = "Khách sạn của loại phòng này đang ngưng hoạt động." });

        var dup = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId != id &&
            rt.HotelId == roomType.HotelId &&
            rt.RoomTypeName == roomType.RoomTypeName &&
            rt.IsActive);
        if (dup)
            return BadRequest(new { message = "Đã có loại phòng đang hoạt động cùng tên trong khách sạn này." });

        roomType.IsActive = true;
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Đã kích hoạt lại loại phòng." });
    }
}
