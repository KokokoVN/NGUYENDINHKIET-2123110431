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
public class HousekeepingTasksController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? roomId,
        [FromQuery] string? statusCode,
        [FromQuery] int? assignedTo)
    {
        var query = dbContext.HousekeepingTasks.AsQueryable().Where(t => t.DeletedAt == null);
        if (roomId.HasValue)
            query = query.Where(t => t.RoomId == roomId.Value);
        if (!string.IsNullOrWhiteSpace(statusCode))
        {
            var s = statusCode.Trim().ToUpperInvariant();
            query = query.Where(t => t.StatusCode == s);
        }

        if (assignedTo.HasValue)
            query = query.Where(t => t.AssignedTo == assignedTo.Value);

        var list = await query.OrderByDescending(t => t.TaskId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var t = await dbContext.HousekeepingTasks.FirstOrDefaultAsync(x => x.TaskId == id && x.DeletedAt == null);
        if (t is null)
            return NotFound(new { message = "Không tìm thấy công việc buồng phòng." });
        return Ok(t);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,HOUSEKEEPING,MANAGER")]
    public async Task<IActionResult> Create([FromBody] CreateHousekeepingTaskRequest request)
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
        var task = new HousekeepingTask
        {
            RoomId = request.RoomId,
            AssignedTo = request.AssignedTo,
            StatusCode = request.StatusCode.Trim().ToUpperInvariant(),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.HousekeepingTasks.Add(task);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("HOUSEKEEPING_CREATE", "HousekeepingTask", task.TaskId.ToString(), after: task);
        return Ok(task);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,RECEPTION,HOUSEKEEPING,MANAGER")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateHousekeepingTaskRequest request)
    {
        var task = await dbContext.HousekeepingTasks.FirstOrDefaultAsync(x => x.TaskId == id && x.DeletedAt == null);
        if (task is null)
            return NotFound(new { message = "Không tìm thấy công việc buồng phòng." });

        if (request.AssignedTo.HasValue)
        {
            var u = await dbContext.AppUsers.AnyAsync(x => x.UserId == request.AssignedTo.Value && x.IsActive);
            if (!u)
                return BadRequest(new { message = "Nhân viên được giao không tồn tại." });
        }

        task.AssignedTo = request.AssignedTo;
        task.StatusCode = request.StatusCode.Trim().ToUpperInvariant();
        task.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        task.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("HOUSEKEEPING_UPDATE", "HousekeepingTask", task.TaskId.ToString(), after: task);
        return Ok(task);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public async Task<IActionResult> SoftDelete(long id)
    {
        var task = await dbContext.HousekeepingTasks.FirstOrDefaultAsync(x => x.TaskId == id && x.DeletedAt == null);
        if (task is null)
            return NotFound(new { message = "Không tìm thấy công việc buồng phòng." });

        task.DeletedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("HOUSEKEEPING_SOFT_DELETE", "HousekeepingTask", task.TaskId.ToString(), null);
        return Ok(new { message = "Đã xóa mềm công việc." });
    }
}
