using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var invoices = await dbContext.Invoices
            .Include(i => i.Booking)
            .OrderByDescending(i => i.Id)
            .ToListAsync();

        return Ok(invoices);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateInvoiceRequest request)
    {
        var booking = await dbContext.Bookings
            .Include(b => b.ServiceUsages)
            .FirstOrDefaultAsync(b => b.ReservationId == request.BookingId);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        if (booking.StatusCode != "CHECKED_OUT")
        {
            return BadRequest(new { message = "Chi duoc xuat hoa don sau khi tra phong." });
        }

        var serviceAmount = booking.ServiceUsages.Sum(s => s.LineTotal);
        var totalNights = booking.CheckOutDate.DayNumber - booking.CheckInDate.DayNumber;
        var roomAmount = totalNights * booking.RatePerNight;
        var invoice = new Invoice
        {
            BookingId = booking.ReservationId,
            RoomAmount = roomAmount,
            ServiceAmount = serviceAmount,
            TotalAmount = roomAmount + serviceAmount,
            PaymentMethod = request.PaymentMethod.Trim(),
            Note = request.Note?.Trim(),
            PaidAt = DateTime.UtcNow
        };

        dbContext.Invoices.Add(invoice);
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Xuat hoa don thanh cong.", data = invoice });
    }
}
