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
public class InvoicesController(
    HotelDbContext dbContext,
    ILoyaltyService loyalty) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.Invoices
            .Include(i => i.Booking)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(i =>
                i.PaymentMethod.Contains(s) ||
                (i.Note != null && i.Note.Contains(s)) ||
                i.BookingId.ToString().Contains(s));
        }

        query = query.OrderByDescending(i => i.Id);

        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var invoices = await query.ToListAsync();
            return Ok(invoices);
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
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await dbContext.Invoices
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        var serviceItems = await (
            from s in dbContext.Stays
            where s.ReservationId == invoice.BookingId
            join o in dbContext.ServiceOrders on s.StayId equals o.StayId
            where o.StatusCode == "ACTIVE"
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join hs in dbContext.HotelServices
                on new { HotelId = s.HotelId, o.ServiceCode } equals new { hs.HotelId, hs.ServiceCode } into serviceJoin
            from hs in serviceJoin.DefaultIfEmpty()
            select new
            {
                o.ServiceOrderId,
                o.StayId,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                o.ServiceCode,
                ServiceName = hs != null ? hs.ServiceName : null,
                o.Description,
                o.Quantity,
                o.UnitPrice,
                lineTotal = o.Quantity * o.UnitPrice
            }).ToListAsync();

        var nightsStayed = invoice.Booking is null
            ? 0
            : Math.Max(0, invoice.Booking.CheckOutDate.DayNumber - invoice.Booking.CheckInDate.DayNumber);

        return Ok(new
        {
            invoice.Id,
            invoice.BookingId,
            invoice.RoomAmount,
            invoice.ServiceAmount,
            invoice.TotalAmount,
            invoice.PaidAt,
            invoice.PaymentMethod,
            invoice.Note,
            booking = invoice.Booking,
            nightsStayed,
            ratePerNight = invoice.Booking?.RatePerNight,
            serviceItems
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,ACCOUNTANT")]
    public async Task<IActionResult> Create(CreateInvoiceRequest request)
    {
        var booking = await dbContext.Bookings
            .FirstOrDefaultAsync(b => b.ReservationId == request.BookingId);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        if (await dbContext.Invoices.AnyAsync(i => i.BookingId == booking.ReservationId))
            return BadRequest(new { message = "Đặt phòng này đã có hóa đơn." });

        if (booking.StatusCode != "CHECKED_OUT")
        {
            return BadRequest(new { message = "Chi duoc xuat hoa don sau khi tra phong." });
        }

        var stayIds = await dbContext.Stays
            .Where(s => s.ReservationId == booking.ReservationId)
            .Select(s => s.StayId)
            .ToListAsync();
        var serviceAmount = await dbContext.ServiceOrders
            .Where(o => stayIds.Contains(o.StayId) && o.StatusCode == "ACTIVE")
            .SumAsync(o => (decimal?)(o.Quantity * o.UnitPrice)) ?? 0m;
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

        var earned = 0;
        Customer? loyaltyCustomer = null;
        if (booking.CustomerId.HasValue)
        {
            loyaltyCustomer = await dbContext.Customers.FirstOrDefaultAsync(c =>
                c.CustomerId == booking.CustomerId.Value && c.DeletedAt == null);
            if (loyaltyCustomer != null)
            {
                earned = loyalty.PointsEarnedFromInvoiceTotal(invoice.TotalAmount);
                if (earned != 0)
                    loyalty.ApplyPointsAndTier(loyaltyCustomer, earned);
            }
        }

        await dbContext.SaveChangesAsync();

        if (earned != 0 && loyaltyCustomer != null)
        {
        }

        return Ok(new
        {
            message = "Xuat hoa don thanh cong.",
            data = invoice,
            loyalty = loyaltyCustomer is null
                ? null
                : new
                {
                    customerId = loyaltyCustomer.CustomerId,
                    pointsEarned = earned,
                    loyaltyCustomer.LoyaltyPoints,
                    loyaltyCustomer.LoyaltyTier
                }
        });
    }
}
