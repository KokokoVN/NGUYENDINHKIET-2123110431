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
public class ServiceOrdersController(HotelDbContext dbContext) : ControllerBase
{
    private sealed class ServiceOrderView
    {
        public long ServiceOrderId { get; set; }
        public long StayId { get; set; }
        public long? ReservationId { get; set; }
        public int? RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public string ServiceCode { get; set; } = string.Empty;
        public string? ServiceName { get; set; }
        public string? Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string StatusCode { get; set; } = "ACTIVE";
        public string? CancelReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] long? stayId,
        [FromQuery] long? reservationId,
        [FromQuery] string? search,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query =
            from o in dbContext.ServiceOrders
            join s in dbContext.Stays on o.StayId equals s.StayId into stayJoin
            from s in stayJoin.DefaultIfEmpty()
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join hs in dbContext.HotelServices
                on new { HotelId = s.HotelId, o.ServiceCode } equals new { hs.HotelId, hs.ServiceCode } into serviceJoin
            from hs in serviceJoin.DefaultIfEmpty()
            select new ServiceOrderView
            {
                ServiceOrderId = o.ServiceOrderId,
                StayId = o.StayId,
                ReservationId = s.ReservationId,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                ServiceCode = o.ServiceCode,
                ServiceName = hs != null ? hs.ServiceName : null,
                Description = o.Description,
                Quantity = o.Quantity,
                UnitPrice = o.UnitPrice,
                StatusCode = o.StatusCode,
                CancelReason = o.CancelReason,
                CreatedAt = o.CreatedAt
            };

        if (stayId.HasValue)
            query = query.Where(o => o.StayId == stayId.Value);
        if (reservationId.HasValue)
        {
            query = query.Where(o => o.ReservationId == reservationId.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(o =>
                o.ServiceCode.Contains(s) ||
                (o.Description != null && o.Description.Contains(s)));
        }

        query = query.OrderByDescending(o => o.ServiceOrderId);

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
        var order = await (
            from o in dbContext.ServiceOrders
            where o.ServiceOrderId == id
            join s in dbContext.Stays on o.StayId equals s.StayId into stayJoin
            from s in stayJoin.DefaultIfEmpty()
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join hs in dbContext.HotelServices
                on new { HotelId = s.HotelId, o.ServiceCode } equals new { hs.HotelId, hs.ServiceCode } into serviceJoin
            from hs in serviceJoin.DefaultIfEmpty()
            select new ServiceOrderView
            {
                ServiceOrderId = o.ServiceOrderId,
                StayId = o.StayId,
                ReservationId = s.ReservationId,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                ServiceCode = o.ServiceCode,
                ServiceName = hs != null ? hs.ServiceName : null,
                Description = o.Description,
                Quantity = o.Quantity,
                UnitPrice = o.UnitPrice,
                StatusCode = o.StatusCode,
                CancelReason = o.CancelReason,
                CreatedAt = o.CreatedAt
            }).FirstOrDefaultAsync();
        if (order is null)
            return NotFound(new { message = "Không tìm thấy dịch vụ sử dụng." });
        return Ok(order);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create([FromBody] CreateServiceOrderRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.StayId.HasValue == request.ReservationId.HasValue)
        {
            return BadRequest(new { message = "Cần gửi đúng một trong hai: stayId hoặc reservationId." });
        }

        Stay? stay;
        if (request.StayId.HasValue)
        {
            stay = await dbContext.Stays.FirstOrDefaultAsync(s =>
                s.StayId == request.StayId.Value && s.StatusCode == "IN_HOUSE");
        }
        else
        {
            stay = await dbContext.Stays.FirstOrDefaultAsync(s =>
                s.ReservationId == request.ReservationId!.Value && s.StatusCode == "IN_HOUSE");
        }

        if (stay is null)
        {
            return BadRequest(new
            {
                message =
                    "Không tìm thấy lưu trú đang ở (IN_HOUSE). Chỉ thêm dịch vụ sau khi khách đã check-in."
            });
        }

        var now = DateTime.UtcNow;
        var code = request.ServiceCode.Trim().Replace(' ', '_').ToUpperInvariant();
        if (string.IsNullOrEmpty(code))
            return BadRequest(new { message = "serviceCode không hợp lệ." });

        // Ensure service belongs to this hotel (catalog is per-hotel)
        var serviceOk = await dbContext.HotelServices.AnyAsync(hs =>
            hs.HotelId == stay.HotelId &&
            hs.ServiceCode == code &&
            hs.IsActive);
        if (!serviceOk)
        {
            return BadRequest(new { message = "Dịch vụ không tồn tại trong danh mục của khách sạn này (hoặc đã ngưng hoạt động)." });
        }

        var order = new ServiceOrder
        {
            StayId = stay.StayId,
            ServiceCode = code,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            StatusCode = "ACTIVE",
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ServiceOrders.Add(order);
        await dbContext.SaveChangesAsync();

        return Ok(order);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> CreateBulk([FromBody] CreateServiceOrdersBulkRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var stay = await dbContext.Stays.FirstOrDefaultAsync(s =>
            s.StayId == request.StayId && s.StatusCode == "IN_HOUSE");
        if (stay is null)
        {
            return BadRequest(new
            {
                message = "Không tìm thấy lưu trú đang ở (IN_HOUSE). Chỉ thêm dịch vụ sau khi khách đã check-in."
            });
        }

        var now = DateTime.UtcNow;
        var normalized = request.Items
            .Select((x, idx) => new
            {
                idx,
                code = (x.ServiceCode ?? string.Empty).Trim().Replace(' ', '_').ToUpperInvariant(),
                desc = string.IsNullOrWhiteSpace(x.Description) ? null : x.Description!.Trim(),
                qty = x.Quantity,
                price = x.UnitPrice
            })
            .ToList();

        if (normalized.Any(x => string.IsNullOrEmpty(x.code)))
            return BadRequest(new { message = "Có dịch vụ có serviceCode không hợp lệ." });

        var codes = normalized.Select(x => x.code).Distinct().ToList();
        var activeCodes = await dbContext.HotelServices
            .Where(hs => hs.HotelId == stay.HotelId && hs.IsActive && codes.Contains(hs.ServiceCode))
            .Select(hs => hs.ServiceCode)
            .ToListAsync();

        var missing = codes.Except(activeCodes).ToList();
        if (missing.Count > 0)
        {
            return BadRequest(new
            {
                message = "Có dịch vụ không thuộc danh mục của khách sạn này (hoặc đã ngưng hoạt động).",
                missingServiceCodes = missing
            });
        }

        var orders = normalized.Select(x => new ServiceOrder
        {
            StayId = stay.StayId,
            ServiceCode = x.code,
            Description = x.desc,
            Quantity = x.qty,
            UnitPrice = x.price,
            StatusCode = "ACTIVE",
            CreatedAt = now,
            UpdatedAt = now
        }).ToList();

        await using var tx = await dbContext.Database.BeginTransactionAsync();
        dbContext.ServiceOrders.AddRange(orders);
        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new
        {
            message = "Đã thêm nhiều dịch vụ.",
            data = new
            {
                count = orders.Count,
                serviceOrderIds = orders.Select(o => o.ServiceOrderId).ToList()
            }
        });
    }

    [HttpPut("{id:long}/cancel")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Cancel(long id, [FromBody] CancelServiceOrderRequest? request)
    {
        var order = await dbContext.ServiceOrders.FirstOrDefaultAsync(o => o.ServiceOrderId == id);
        if (order is null)
            return NotFound(new { message = "Không tìm thấy dịch vụ." });

        if (order.StatusCode != "ACTIVE")
            return BadRequest(new { message = "Dịch vụ không ở trạng thái ACTIVE." });

        order.StatusCode = "CANCELLED";
        order.CancelReason = string.IsNullOrWhiteSpace(request?.Reason) ? null : request!.Reason.Trim();
        order.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(order);
    }
}
