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
    IAuditLogService auditLog,
    ILoyaltyService loyalty) : ControllerBase
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

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await dbContext.Invoices
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        return Ok(invoice);
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

        await auditLog.WriteAsync(
            "INVOICE_CREATE",
            "Invoice",
            invoice.Id.ToString(),
            after: new
            {
                invoice.BookingId,
                invoice.RoomAmount,
                invoice.ServiceAmount,
                invoice.TotalAmount,
                invoice.PaymentMethod
            });

        if (earned != 0 && loyaltyCustomer != null)
        {
            await auditLog.WriteAsync(
                "LOYALTY_EARN",
                "Customer",
                loyaltyCustomer.CustomerId.ToString(),
                reason: $"Hóa đơn #{invoice.Id}",
                after: new
                {
                    pointsEarned = earned,
                    loyaltyCustomer.LoyaltyPoints,
                    loyaltyCustomer.LoyaltyTier
                });
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
