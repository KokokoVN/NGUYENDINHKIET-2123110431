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
public class PaymentsController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? stayId,
        [FromQuery] long? reservationId,
        [FromQuery] string? statusCode)
    {
        var query = dbContext.Payments.AsQueryable();
        if (stayId.HasValue)
            query = query.Where(p => p.StayId == stayId.Value);
        if (reservationId.HasValue)
            query = query.Where(p => p.ReservationId == reservationId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var s = statusCode.Trim().ToUpperInvariant();
            query = query.Where(p => p.StatusCode == s);
        }

        var list = await query.OrderByDescending(p => p.PaymentId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var p = await dbContext.Payments.FirstOrDefaultAsync(x => x.PaymentId == id);
        if (p is null)
            return NotFound(new { message = "Không tìm thấy thanh toán." });
        return Ok(p);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,ACCOUNTANT")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.StayId.HasValue == request.ReservationId.HasValue)
            return BadRequest(new { message = "Cần gửi đúng một trong hai: stayId hoặc reservationId." });

        if (request.StayId.HasValue)
        {
            var ok = await dbContext.Stays.AnyAsync(s => s.StayId == request.StayId.Value);
            if (!ok)
                return BadRequest(new { message = "Stay không tồn tại." });
        }
        else
        {
            var ok = await dbContext.Bookings.AnyAsync(b => b.ReservationId == request.ReservationId!.Value);
            if (!ok)
                return BadRequest(new { message = "Đặt phòng không tồn tại." });
        }

        var now = DateTime.UtcNow;
        var payment = new Payment
        {
            StayId = request.StayId,
            ReservationId = request.ReservationId,
            PaymentType = request.PaymentType.Trim().ToUpperInvariant(),
            MethodCode = request.MethodCode.Trim().ToUpperInvariant(),
            Amount = request.Amount,
            StatusCode = "PAID",
            ReferenceNo = string.IsNullOrWhiteSpace(request.ReferenceNo) ? null : request.ReferenceNo.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Payments.Add(payment);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "PAYMENT_CREATE",
            "Payment",
            payment.PaymentId.ToString(),
            after: new
            {
                payment.StayId,
                payment.ReservationId,
                payment.PaymentType,
                payment.MethodCode,
                payment.Amount
            });

        return Ok(payment);
    }

    [HttpPut("{id:long}/void")]
    [Authorize(Roles = "ADMIN,ACCOUNTANT")]
    public async Task<IActionResult> VoidPayment(long id)
    {
        var payment = await dbContext.Payments.FirstOrDefaultAsync(p => p.PaymentId == id);
        if (payment is null)
            return NotFound(new { message = "Không tìm thấy thanh toán." });
        if (payment.StatusCode != "PAID")
            return BadRequest(new { message = "Chỉ hủy giao dịch đang PAID." });

        payment.StatusCode = "VOID";
        payment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "PAYMENT_VOID",
            "Payment",
            payment.PaymentId.ToString(),
            before: new { StatusCode = "PAID" },
            after: new { payment.StatusCode });

        return Ok(payment);
    }
}
