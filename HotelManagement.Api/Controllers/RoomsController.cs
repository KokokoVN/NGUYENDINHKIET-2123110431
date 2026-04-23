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
public class RoomsController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? roomNumber,
        [FromQuery] string? statusCode,
        [FromQuery] int? roomTypeId,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.Rooms.AsQueryable();
        if (!includeInactive)
            query = query.Where(r => r.IsActive);

        if (!string.IsNullOrWhiteSpace(roomNumber))
        {
            var keyword = roomNumber.Trim();
            query = query.Where(r => r.RoomNumber.Contains(keyword));
        }

        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var status = statusCode.Trim().ToUpperInvariant();
            query = query.Where(r => r.StatusCode == status);
        }

        if (roomTypeId.HasValue)
        {
            query = query.Where(r => r.RoomTypeId == roomTypeId.Value);
        }

        query = query.OrderBy(r => r.RoomNumber);

        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var rooms = await query.ToListAsync();
            return Ok(rooms);
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
        var query = dbContext.Rooms.AsQueryable().Where(r => r.RoomId == id);
        if (!includeInactive)
            query = query.Where(r => r.IsActive);
        var room = await query.FirstOrDefaultAsync();
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng." });
        }

        return Ok(room);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create(CreateRoomRequest request)
    {
        var hotelExists = await dbContext.Hotels.AnyAsync(h => h.HotelId == request.HotelId && h.IsActive);
        if (!hotelExists)
        {
            return BadRequest(new { message = "Khách sạn không tồn tại hoặc đã ngưng hoạt động." });
        }

        var roomTypeExists = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId == request.RoomTypeId &&
            rt.HotelId == request.HotelId &&
            rt.IsActive);
        if (!roomTypeExists)
        {
            return BadRequest(new { message = "Loại phòng không tồn tại trong khách sạn này." });
        }

        var exists = await dbContext.Rooms.AnyAsync(r =>
            r.HotelId == request.HotelId &&
            r.RoomNumber == request.RoomNumber &&
            r.IsActive);
        if (exists)
        {
            return BadRequest(new { message = "Số phòng đã tồn tại trong khách sạn." });
        }

        var room = new Room
        {
            HotelId = request.HotelId,
            RoomTypeId = request.RoomTypeId,
            RoomNumber = request.RoomNumber.Trim(),
            Floor = request.Floor?.Trim(),
            StatusCode = request.StatusCode.Trim().ToUpperInvariant(),
            IsActive = true
        };

        dbContext.Rooms.Add(room);
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Thêm phòng thành công.", data = room });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Update(int id, UpdateRoomRequest request)
    {
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == id && r.IsActive);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng để cập nhật." });
        }

        var before = new
        {
            room.RoomId,
            room.HotelId,
            room.RoomTypeId,
            room.RoomNumber,
            room.Floor,
            room.StatusCode,
            room.IsActive
        };

        var roomNumber = request.RoomNumber.Trim();
        var duplicate = await dbContext.Rooms.AnyAsync(r =>
            r.RoomId != id &&
            r.HotelId == room.HotelId &&
            r.RoomNumber == roomNumber &&
            r.IsActive);
        if (duplicate)
        {
            return BadRequest(new { message = "Số phòng đã tồn tại, vui lòng chọn số khác." });
        }

        var roomTypeExists = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId == request.RoomTypeId &&
            rt.HotelId == room.HotelId &&
            rt.IsActive);
        if (!roomTypeExists)
        {
            return BadRequest(new { message = "Loại phòng không hợp lệ cho khách sạn này." });
        }

        room.RoomTypeId = request.RoomTypeId;
        room.RoomNumber = roomNumber;
        room.Floor = request.Floor?.Trim();
        room.StatusCode = request.StatusCode.Trim().ToUpperInvariant();

        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Cập nhật phòng thành công.", data = room });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(int id)
    {
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == id && r.IsActive);
        if (room is null)
        {
            return NotFound(new { message = "Không tìm thấy phòng để ngưng hoạt động." });
        }

        var before = new
        {
            room.RoomId,
            room.HotelId,
            room.RoomTypeId,
            room.RoomNumber,
            room.Floor,
            room.StatusCode,
            room.IsActive
        };

        room.IsActive = false;
        room.StatusCode = "OUT_OF_SERVICE";
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Ngưng hoạt động phòng thành công." });
    }

    [HttpPut("{id:int}/restore")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Restore(int id)
    {
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == id && !r.IsActive);
        if (room is null)
            return NotFound(new { message = "Không tìm thấy phòng đã ngưng hoạt động." });

        var hotelOk = await dbContext.Hotels.AnyAsync(h => h.HotelId == room.HotelId && h.IsActive);
        if (!hotelOk)
            return BadRequest(new { message = "Khách sạn của phòng này đang ngưng hoạt động." });

        var roomTypeOk = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId == room.RoomTypeId && rt.HotelId == room.HotelId && rt.IsActive);
        if (!roomTypeOk)
            return BadRequest(new { message = "Loại phòng của phòng này đang ngưng hoạt động." });

        var duplicate = await dbContext.Rooms.AnyAsync(r =>
            r.RoomId != id &&
            r.HotelId == room.HotelId &&
            r.RoomNumber == room.RoomNumber &&
            r.IsActive);
        if (duplicate)
            return BadRequest(new { message = "Đã có phòng đang hoạt động trùng số phòng." });

        room.IsActive = true;
        if (room.StatusCode == "OUT_OF_SERVICE")
            room.StatusCode = "VACANT";
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Đã kích hoạt lại phòng." });
    }
}
