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
public class MaintenanceTicketsController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? roomId,
        [FromQuery] string? statusCode,
        [FromQuery] int? assignedTo)
    {
        var query = dbContext.MaintenanceTickets.AsQueryable().Where(t => t.DeletedAt == null);
        if (roomId.HasValue)
            query = query.Where(t => t.RoomId == roomId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var s = statusCode.Trim().ToUpperInvariant();
            query = query.Where(t => t.StatusCode == s);
        }

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedTo == assignedTo.Value);

        var list = await query.OrderByDescending(t => t.TicketId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var t = await dbContext.MaintenanceTickets.FirstOrDefaultAsync(x => x.TicketId == id && x.DeletedAt == null);
        if (t is null)
            return NotFound(new { message = "Không tìm thấy ticket kỹ thuật." });
        return Ok(t);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,MAINTENANCE,MANAGER")]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceTicketRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var roomOk = await dbContext.Rooms.AnyAsync(r => r.RoomId == request.RoomId && r.IsActive);
        if (!roomOk)
            return BadRequest(new { message = "Phòng không tồn tại hoặc đã ngưng hoạt động." });

        if (request.AssignedTo.HasValue)
        {
            var u = await dbContext.AppUsers.AnyAsync(x => x.UserId == request.AssignedTo.Value && x.IsActive);
            if (!u)
                return BadRequest(new { message = "Nhân viên được giao không tồn tại." });
        }

        var now = DateTime.UtcNow;
        var ticket = new MaintenanceTicket
        {
            RoomId = request.RoomId,
            AssignedTo = request.AssignedTo,
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            StatusCode = request.StatusCode.Trim().ToUpperInvariant(),
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.MaintenanceTickets.Add(ticket);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("MAINTENANCE_CREATE", "MaintenanceTicket", ticket.TicketId.ToString(), after: ticket);
        return Ok(ticket);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,MAINTENANCE,MANAGER")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateMaintenanceTicketRequest request)
    {
        var ticket = await dbContext.MaintenanceTickets.FirstOrDefaultAsync(x => x.TicketId == id && x.DeletedAt == null);
        if (ticket is null)
            return NotFound(new { message = "Không tìm thấy ticket kỹ thuật." });

        if (request.AssignedTo.HasValue)
        {
            var u = await dbContext.AppUsers.AnyAsync(x => x.UserId == request.AssignedTo.Value && x.IsActive);
            if (!u)
                return BadRequest(new { message = "Nhân viên được giao không tồn tại." });
        }

        ticket.AssignedTo = request.AssignedTo;
        ticket.Title = request.Title.Trim();
        ticket.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        ticket.StatusCode = request.StatusCode.Trim().ToUpperInvariant();
        ticket.CancelReason = string.IsNullOrWhiteSpace(request.CancelReason) ? null : request.CancelReason.Trim();
        ticket.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("MAINTENANCE_UPDATE", "MaintenanceTicket", ticket.TicketId.ToString(), after: ticket);
        return Ok(ticket);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public async Task<IActionResult> SoftDelete(long id)
    {
        var ticket = await dbContext.MaintenanceTickets.FirstOrDefaultAsync(x => x.TicketId == id && x.DeletedAt == null);
        if (ticket is null)
            return NotFound(new { message = "Không tìm thấy ticket kỹ thuật." });

        ticket.DeletedAt = DateTime.UtcNow;
        ticket.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("MAINTENANCE_SOFT_DELETE", "MaintenanceTicket", ticket.TicketId.ToString(), null);
        return Ok(new { message = "Đã xóa mềm ticket." });
    }
}
