using HotelManagement.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize(Roles = "ADMIN,RECEPTION,MANAGER,ACCOUNTANT")]
[ApiController]
[Route("api/[controller]")]
public class ReportsController(HotelDbContext dbContext) : ControllerBase
{
    /// <summary>Báo cáo nhanh: phòng, đặt phòng, doanh thu hóa đơn, top mã dịch vụ.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(
        [FromQuery] int? hotelId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc)
    {
        var from = fromUtc ?? DateTime.UtcNow.AddDays(-30);
        var to = toUtc ?? DateTime.UtcNow;

        var roomsQuery = dbContext.Rooms.AsQueryable().Where(r => r.IsActive);
        if (hotelId.HasValue)
            roomsQuery = roomsQuery.Where(r => r.HotelId == hotelId.Value);

        var roomsByStatus = await roomsQuery
            .GroupBy(r => r.StatusCode)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var totalRooms = await roomsQuery.CountAsync();
        var vacant = await roomsQuery.CountAsync(r => r.StatusCode == "VACANT");
        var occupied = await roomsQuery.CountAsync(r => r.StatusCode == "OCCUPIED");

        var bookingsQuery = dbContext.Bookings.AsQueryable();
        if (hotelId.HasValue)
            bookingsQuery = bookingsQuery.Where(b => b.HotelId == hotelId.Value);

        var bookingsByStatus = await bookingsQuery
            .GroupBy(b => b.StatusCode)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var invoiceQuery = dbContext.Invoices.AsQueryable().Where(i => i.PaidAt >= from && i.PaidAt <= to);
        if (hotelId.HasValue)
        {
            invoiceQuery = invoiceQuery.Where(i =>
                dbContext.Bookings.Any(b => b.ReservationId == i.BookingId && b.HotelId == hotelId.Value));
        }

        var revenueTotal = await invoiceQuery.SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;
        var invoiceCount = await invoiceQuery.CountAsync();

        var serviceTop = await dbContext.ServiceOrders
            .Where(o => o.StatusCode == "ACTIVE" && o.CreatedAt >= from && o.CreatedAt <= to)
            .GroupBy(o => o.ServiceCode)
            .Select(g => new
            {
                serviceCode = g.Key,
                lines = g.Count(),
                amount = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.amount)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            period = new { fromUtc = from, toUtc = to },
            rooms = new
            {
                totalActive = totalRooms,
                vacant,
                occupied,
                byStatus = roomsByStatus
            },
            bookings = new { byStatus = bookingsByStatus },
            invoices = new { count = invoiceCount, revenueTotal },
            topServices = serviceTop
        });
    }
}
