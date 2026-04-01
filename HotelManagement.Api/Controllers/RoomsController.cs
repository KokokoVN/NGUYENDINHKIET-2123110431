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
        [FromQuery] int? roomTypeId)
    {
        var query = dbContext.Rooms.AsQueryable().Where(r => r.IsActive);

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

        var rooms = await query.OrderBy(r => r.RoomNumber).ToListAsync();

        return Ok(rooms);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == id && r.IsActive);
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

        var duplicate = await dbContext.Rooms.AnyAsync(r =>
            r.RoomId != id &&
            r.HotelId == room.HotelId &&
            r.RoomNumber == request.RoomNumber &&
            r.IsActive);
        if (duplicate)
        {
            return BadRequest(new { message = "Số phòng đã tồn tại, vui lòng chọn số khác." });
        }

        room.RoomTypeId = request.RoomTypeId;
        room.RoomNumber = request.RoomNumber.Trim();
        room.Floor = request.Floor?.Trim();
        room.StatusCode = request.StatusCode.Trim().ToUpperInvariant();

        var roomTypeExists = await dbContext.RoomTypes.AnyAsync(rt =>
            rt.RoomTypeId == request.RoomTypeId &&
            rt.HotelId == room.HotelId &&
            rt.IsActive);
        if (!roomTypeExists)
        {
            return BadRequest(new { message = "Loại phòng không hợp lệ cho khách sạn này." });
        }

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

        room.IsActive = false;
        room.StatusCode = "OUT_OF_SERVICE";
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Ngưng hoạt động phòng thành công." });
    }
}
