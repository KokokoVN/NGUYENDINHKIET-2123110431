using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BookingsController(IBookingService bookingService, HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var bookings = await dbContext.Bookings
            .Include(b => b.Room)
            .Include(b => b.Customer)
            .OrderByDescending(b => b.ReservationId)
            .ToListAsync();

        return Ok(bookings);
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
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        booking.StatusCode = "CHECKED_IN";
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Nhan phong thanh cong.", data = booking });
    }

    [HttpPut("{id:long}/check-out")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> CheckOut(long id)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        booking.StatusCode = "CHECKED_OUT";
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Tra phong thanh cong.", data = booking });
    }

    [HttpPut("{id:long}/cancel")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Cancel(long id)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == id);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        booking.StatusCode = "CANCELLED";
        await dbContext.SaveChangesAsync();
        return Ok(new { message = "Huy don dat phong thanh cong.", data = booking });
    }
}
