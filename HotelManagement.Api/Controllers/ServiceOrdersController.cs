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
public class ServiceOrdersController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? stayId, [FromQuery] long? reservationId)
    {
        var query = dbContext.ServiceOrders.Include(o => o.Stay).AsQueryable();

        if (stayId.HasValue)
            query = query.Where(o => o.StayId == stayId.Value);
        if (reservationId.HasValue)
        {
            query = query.Where(o =>
                dbContext.Stays.Any(s => s.StayId == o.StayId && s.ReservationId == reservationId.Value));
        }

        var list = await query.OrderByDescending(o => o.ServiceOrderId).ToListAsync();
        return Ok(list);
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

        await auditLog.WriteAsync(
            "SERVICE_ORDER_CREATE",
            "ServiceOrder",
            order.ServiceOrderId.ToString(),
            after: new
            {
                order.StayId,
                order.ServiceCode,
                order.Description,
                order.Quantity,
                order.UnitPrice
            });

        return Ok(order);
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

        await auditLog.WriteAsync(
            "SERVICE_ORDER_CANCEL",
            "ServiceOrder",
            order.ServiceOrderId.ToString(),
            before: new { StatusCode = "ACTIVE" },
            after: new { order.StatusCode, order.CancelReason });

        return Ok(order);
    }
}
