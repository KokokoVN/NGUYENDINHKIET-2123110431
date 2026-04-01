using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingServicesController(HotelDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddService(AddServiceUsageRequest request)
    {
        var booking = await dbContext.Bookings.FirstOrDefaultAsync(b => b.ReservationId == request.BookingId);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        var service = await dbContext.HotelServices
            .FirstOrDefaultAsync(s => s.Id == request.HotelServiceId && s.IsActive);
        if (service is null)
        {
            return NotFound(new { message = "Khong tim thay dich vu." });
        }

        var usage = new BookingServiceUsage
        {
            BookingId = request.BookingId,
            HotelServiceId = request.HotelServiceId,
            Quantity = request.Quantity,
            UnitPrice = service.UnitPrice,
            LineTotal = request.Quantity * service.UnitPrice
        };

        dbContext.BookingServiceUsages.Add(usage);
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Them dich vu thanh cong.", data = usage });
    }
}
