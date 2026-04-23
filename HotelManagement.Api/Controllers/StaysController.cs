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
    private sealed class StayView
    {
        public long StayId { get; set; }
        public long? ReservationId { get; set; }
        public int HotelId { get; set; }
        public string? HotelName { get; set; }
        public int RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public long? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string StatusCode { get; set; } = "IN_HOUSE";
        public DateTime CheckInAt { get; set; }
        public DateTime? CheckOutAt { get; set; }
        public decimal DepositAmount { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? reservationId,
        [FromQuery] int? roomId,
        [FromQuery] int? hotelId,
        [FromQuery] string? statusCode,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query =
            from s in dbContext.Stays
            join b in dbContext.Bookings on s.ReservationId equals b.ReservationId into bookingJoin
            from b in bookingJoin.DefaultIfEmpty()
            join c in dbContext.Customers on b.CustomerId equals c.CustomerId into customerJoin
            from c in customerJoin.DefaultIfEmpty()
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join h in dbContext.Hotels on s.HotelId equals h.HotelId into hotelJoin
            from h in hotelJoin.DefaultIfEmpty()
            select new StayView
            {
                StayId = s.StayId,
                ReservationId = s.ReservationId,
                HotelId = s.HotelId,
                HotelName = h != null ? h.HotelName : null,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                CustomerId = b != null ? b.CustomerId : null,
                CustomerName = c != null ? (c.FullName ?? c.CompanyName) : null,
                StatusCode = s.StatusCode,
                CheckInAt = s.CheckInAt,
                CheckOutAt = s.CheckOutAt,
                DepositAmount = s.DepositAmount,
                Notes = s.Notes,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            };

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

        query = query.OrderByDescending(s => s.StayId);

        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var list = await query.ToListAsync();
            return Ok(list);
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

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var stay = await (
            from s in dbContext.Stays
            where s.StayId == id
            join b in dbContext.Bookings on s.ReservationId equals b.ReservationId into bookingJoin
            from b in bookingJoin.DefaultIfEmpty()
            join c in dbContext.Customers on b.CustomerId equals c.CustomerId into customerJoin
            from c in customerJoin.DefaultIfEmpty()
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join h in dbContext.Hotels on s.HotelId equals h.HotelId into hotelJoin
            from h in hotelJoin.DefaultIfEmpty()
            select new StayView
            {
                StayId = s.StayId,
                ReservationId = s.ReservationId,
                HotelId = s.HotelId,
                HotelName = h != null ? h.HotelName : null,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                CustomerId = b != null ? b.CustomerId : null,
                CustomerName = c != null ? (c.FullName ?? c.CompanyName) : null,
                StatusCode = s.StatusCode,
                CheckInAt = s.CheckInAt,
                CheckOutAt = s.CheckOutAt,
                DepositAmount = s.DepositAmount,
                Notes = s.Notes,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            }).FirstOrDefaultAsync();
        if (stay is null)
            return NotFound(new { message = "Không tìm thấy lưu trú (stay)." });

        return Ok(stay);
    }
}
