using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoomTypesController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
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
        [FromQuery] bool includeInactive = false)
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

        var list = await query.OrderBy(rt => rt.HotelId).ThenBy(rt => rt.RoomTypeName).ToListAsync();
        return Ok(list);
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

        await auditLog.WriteAsync(
            "ROOM_TYPE_CREATE",
            "RoomType",
            roomType.RoomTypeId.ToString(),
            after: new
            {
                roomType.RoomTypeId,
                roomType.HotelId,
                roomType.RoomTypeName,
                roomType.Capacity,
                roomType.BaseRate,
                roomType.Description,
                roomType.IsActive
            });

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

        await auditLog.WriteAsync(
            "ROOM_TYPE_UPDATE",
            "RoomType",
            roomType.RoomTypeId.ToString(),
            before: before,
            after: new
            {
                roomType.RoomTypeId,
                roomType.HotelId,
                roomType.RoomTypeName,
                roomType.Capacity,
                roomType.BaseRate,
                roomType.Description,
                roomType.IsActive
            });

        return Ok(new { message = "Cập nhật loại phòng thành công.", data = roomType });
    }

    /// <summary>Xóa mềm: IsActive = false.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(int id)
    {
        var roomType = await dbContext.RoomTypes.FirstOrDefaultAsync(rt => rt.RoomTypeId == id && rt.IsActive);
        if (roomType is null)
            return NotFound(new { message = "Không tìm thấy loại phòng để ngưng hoạt động." });

        var hasActiveRooms = await dbContext.Rooms.AnyAsync(r => r.RoomTypeId == id && r.IsActive);
        if (hasActiveRooms)
            return BadRequest(new { message = "Không thể ngưng hoạt động loại phòng khi vẫn còn phòng đang gán loại này." });

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

        roomType.IsActive = false;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "ROOM_TYPE_SOFT_DELETE",
            "RoomType",
            roomType.RoomTypeId.ToString(),
            reason: "Ngưng hoạt động loại phòng (xóa mềm)",
            before: before,
            after: new
            {
                roomType.RoomTypeId,
                roomType.HotelId,
                roomType.RoomTypeName,
                roomType.Capacity,
                roomType.BaseRate,
                roomType.Description,
                roomType.IsActive
            });

        return Ok(new { message = "Ngưng hoạt động loại phòng thành công." });
    }
}
