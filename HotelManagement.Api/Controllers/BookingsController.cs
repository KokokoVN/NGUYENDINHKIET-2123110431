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
public class BookingsController(
    IBookingService bookingService,
    HotelDbContext dbContext,
    IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? hotelId,
        [FromQuery] int? roomId,
        [FromQuery] long? customerId,
        [FromQuery] string? statusCode,
        [FromQuery] DateOnly? checkInFrom,
        [FromQuery] DateOnly? checkInTo,
        [FromQuery] DateOnly? checkOutFrom,
        [FromQuery] DateOnly? checkOutTo)
    {
        var query = dbContext.Bookings
            .Include(b => b.Room)
            .Include(b => b.Customer)
            .AsQueryable();

        if (hotelId.HasValue)
            query = query.Where(b => b.HotelId == hotelId.Value);
        if (roomId.HasValue)
            query = query.Where(b => b.RoomId == roomId.Value);
        if (customerId.HasValue)
            query = query.Where(b => b.CustomerId == customerId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var s = statusCode.Trim().ToUpperInvariant();
            query = query.Where(b => b.StatusCode == s);
        }

        if (checkInFrom.HasValue)
            query = query.Where(b => b.CheckInDate >= checkInFrom.Value);
        if (checkInTo.HasValue)
            query = query.Where(b => b.CheckInDate <= checkInTo.Value);
        if (checkOutFrom.HasValue)
            query = query.Where(b => b.CheckOutDate >= checkOutFrom.Value);
        if (checkOutTo.HasValue)
            query = query.Where(b => b.CheckOutDate <= checkOutTo.Value);

        var bookings = await query.OrderByDescending(b => b.ReservationId).ToListAsync();
        return Ok(bookings);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var booking = await dbContext.Bookings
            .Include(b => b.Room)
            .Include(b => b.Customer)
            .FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
            return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });

        return Ok(booking);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create(CreateBookingRequest request)
    {
        var result = await bookingService.CreateBookingAsync(request);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message, data = result.Booking });
    }

    [HttpPut("{id:long}/check-in")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> CheckIn(long id)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
            return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });

        if (booking.StatusCode != "CONFIRMED")
            return BadRequest(new { message = "Chỉ nhận phòng khi đơn đang ở trạng thái CONFIRMED." });

        if (await dbContext.Stays.AnyAsync(s => s.ReservationId == id && s.StatusCode == "IN_HOUSE"))
        {
            return BadRequest(new { message = "Đơn đã được check-in (đã có lưu trú đang ở)." });
        }

        var now = DateTime.UtcNow;
        var stay = new Stay
        {
            HotelId = booking.HotelId,
            RoomId = booking.RoomId,
            ReservationId = booking.ReservationId,
            StatusCode = "IN_HOUSE",
            CheckInAt = now,
            DepositAmount = 0,
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.Stays.Add(stay);

        booking.StatusCode = "CHECKED_IN";
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == booking.RoomId && r.IsActive);
        if (room != null)
            room.StatusCode = "OCCUPIED";

        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "STAY_CHECK_IN",
            "Stay",
            stay.StayId.ToString(),
            after: new
            {
                stay.ReservationId,
                stay.RoomId,
                stay.HotelId,
                stay.CheckInAt
            });

        return Ok(new { message = "Nhận phòng thành công.", data = booking, stayId = stay.StayId });
    }

    [HttpPut("{id:long}/check-out")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> CheckOut(long id)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
            return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });

        if (booking.StatusCode != "CHECKED_IN")
            return BadRequest(new { message = "Chỉ trả phòng khi đơn đang ở trạng thái CHECKED_IN." });

        var stay = await dbContext.Stays.FirstOrDefaultAsync(s =>
            s.ReservationId == id && s.StatusCode == "IN_HOUSE");
        if (stay is null)
        {
            return BadRequest(new
            {
                message = "Không tìm thấy lưu trú đang ở (stay IN_HOUSE). Không thể trả phòng theo quy trình."
            });
        }

        var now = DateTime.UtcNow;
        var beforeStay = new { stay.StatusCode, stay.CheckOutAt };
        stay.StatusCode = "CHECKED_OUT";
        stay.CheckOutAt = now;
        stay.UpdatedAt = now;

        booking.StatusCode = "CHECKED_OUT";
        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.RoomId == booking.RoomId && r.IsActive);
        if (room != null)
            room.StatusCode = "DIRTY";

        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "STAY_CHECK_OUT",
            "Stay",
            stay.StayId.ToString(),
            before: beforeStay,
            after: new { StatusCode = stay.StatusCode, stay.CheckOutAt });

        return Ok(new { message = "Trả phòng thành công.", data = booking, stayId = stay.StayId });
    }

    [HttpPut("{id:long}/cancel")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Cancel(long id)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
            return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });

        if (booking.StatusCode != "CONFIRMED")
            return BadRequest(new { message = "Chỉ hủy đơn đang ở trạng thái CONFIRMED." });

        booking.StatusCode = "CANCELLED";
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Hủy đặt phòng thành công.", data = booking });
    }
}
