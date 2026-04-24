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
public class PaymentsController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? stayId,
        [FromQuery] long? reservationId,
        [FromQuery] string? statusCode,
        [FromQuery] string? search,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.Payments
            .AsNoTracking()
            .AsQueryable();
        if (stayId.HasValue)
            query = query.Where(p => p.StayId == stayId.Value);
        if (reservationId.HasValue)
            query = query.Where(p => p.ReservationId == reservationId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var s = statusCode.Trim().ToUpperInvariant();
            query = query.Where(p => p.StatusCode == s);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(p =>
                (p.ReferenceNo != null && p.ReferenceNo.Contains(s)) ||
                (p.Note != null && p.Note.Contains(s)) ||
                p.PaymentType.Contains(s) ||
                p.MethodCode.Contains(s));
        }

        query = query.OrderByDescending(p => p.PaymentId);
        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var list = await query.ToListAsync();
            return Ok(new
            {
                message = "Lấy danh sách thanh toán thành công.",
                data = list
            });
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
        return Ok(new
        {
            message = "Lấy danh sách thanh toán thành công.",
            data = new { items, page = currentPage, pageSize = currentPageSize, totalItems, totalPages }
        });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var p = await dbContext.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.PaymentId == id);
        if (p is null)
            return NotFound(new { message = "Không tìm thấy thanh toán." });
        return Ok(new
        {
            message = "Lấy chi tiết thanh toán thành công.",
            data = p
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,ACCOUNTANT")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { message = "Dữ liệu thanh toán không hợp lệ." });

        if (!request.StayId.HasValue || request.StayId.Value <= 0)
            return BadRequest(new { message = "Cần gửi stayId hợp lệ để thanh toán." });

        var stay = await dbContext.Stays
            .FirstOrDefaultAsync(s => s.StayId == request.StayId.Value);
        if (stay is null)
            return BadRequest(new { message = "Stay không tồn tại." });

        if (stay.ReservationId is null)
            return BadRequest(new { message = "Stay chưa gắn đặt phòng, không thể thanh toán." });

        if (stay.StatusCode != "CHECKED_OUT" || !stay.CheckOutAt.HasValue)
            return BadRequest(new { message = "Chỉ thanh toán khi stay đã check-out." });

        var booking = await dbContext.Bookings
            .FirstOrDefaultAsync(b => b.ReservationId == stay.ReservationId.Value);
        if (booking is null)
            return BadRequest(new { message = "Đặt phòng của stay không tồn tại." });

        var duplicatedPaid = await dbContext.Payments
            .AnyAsync(p => p.StayId == stay.StayId && p.StatusCode == "PAID");
        if (duplicatedPaid)
            return BadRequest(new { message = "Stay này đã được thanh toán thành công." });

        var nightsStayed = Math.Max(0,
            DateOnly.FromDateTime(stay.CheckOutAt.Value.Date).DayNumber -
            DateOnly.FromDateTime(stay.CheckInAt.Date).DayNumber);
        if (nightsStayed == 0)
            nightsStayed = Math.Max(0, booking.CheckOutDate.DayNumber - booking.CheckInDate.DayNumber);

        var roomAmount = nightsStayed * booking.RatePerNight;
        var serviceAmount = await dbContext.ServiceOrders
            .Where(o => o.StayId == stay.StayId && o.StatusCode == "ACTIVE")
            .SumAsync(o => (decimal?)(o.Quantity * o.UnitPrice)) ?? 0m;
        var totalAmount = roomAmount + serviceAmount;
        if (totalAmount <= 0)
            return BadRequest(new { message = "Không thể tạo thanh toán với số tiền bằng 0." });

        var now = DateTime.UtcNow;
        var payment = new Payment
        {
            StayId = stay.StayId,
            ReservationId = stay.ReservationId.Value,
            PaymentType = "CHARGE",
            MethodCode = "CASH",
            Amount = totalAmount,
            StatusCode = "PAID",
            ReferenceNo = string.IsNullOrWhiteSpace(request.ReferenceNo) ? null : request.ReferenceNo.Trim(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Payments.Add(payment);
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            message = "Tạo thanh toán thành công.",
            data = payment
        });
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

        return Ok(new
        {
            message = "Hủy giao dịch thành công.",
            data = payment
        });
    }
}
