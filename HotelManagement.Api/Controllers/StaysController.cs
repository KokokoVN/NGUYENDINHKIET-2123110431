using HotelManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StaysController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? reservationId,
        [FromQuery] int? roomId,
        [FromQuery] int? hotelId,
        [FromQuery] string? statusCode)
    {
        var query = dbContext.Stays
            .Include(s => s.Booking)
            .Include(s => s.ServiceOrders)
            .AsQueryable();

        if (reservationId.HasValue)
            query = query.Where(s => s.ReservationId == reservationId.Value);
        if (roomId.HasValue)
            query = query.Where(s => s.RoomId == roomId.Value);
        if (hotelId.HasValue)
            query = query.Where(s => s.HotelId == hotelId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var st = statusCode.Trim().ToUpperInvariant();
            query = query.Where(s => s.StatusCode == st);
        }

        var list = await query.OrderByDescending(s => s.StayId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var stay = await dbContext.Stays
            .Include(s => s.Booking)
            .Include(s => s.ServiceOrders)
            .FirstOrDefaultAsync(s => s.StayId == id);
        if (stay is null)
            return NotFound(new { message = "Không tìm thấy lưu trú (stay)." });

        return Ok(stay);
    }
}
