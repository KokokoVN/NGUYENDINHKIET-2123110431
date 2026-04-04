using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

/// <summary>Khách lưu trú (CCCD/hộ chiếu) — khác Customer (khách đặt/hợp đồng).</summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class GuestsController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? idNumber)
    {
        var query = dbContext.Guests.AsQueryable().Where(g => g.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(g =>
                g.FullName.Contains(s) ||
                (g.Phone != null && g.Phone.Contains(s)) ||
                (g.Email != null && g.Email.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(idNumber))
        {
            var idn = idNumber.Trim();
            query = query.Where(g => g.IdNumber != null && g.IdNumber.Contains(idn));
        }

        var list = await query.OrderByDescending(g => g.GuestId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var g = await dbContext.Guests.FirstOrDefaultAsync(x => x.GuestId == id && x.DeletedAt == null);
        if (g is null)
            return NotFound(new { message = "Không tìm thấy khách." });
        return Ok(g);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create([FromBody] CreateGuestRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var now = DateTime.UtcNow;
        var guest = new Guest
        {
            FullName = request.FullName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            IdType = string.IsNullOrWhiteSpace(request.IdType) ? null : request.IdType.Trim(),
            IdNumber = string.IsNullOrWhiteSpace(request.IdNumber) ? null : request.IdNumber.Trim(),
            DateOfBirth = request.DateOfBirth,
            Nationality = string.IsNullOrWhiteSpace(request.Nationality) ? null : request.Nationality.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        dbContext.Guests.Add(guest);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("GUEST_CREATE", "Guest", guest.GuestId.ToString(), after: guest);
        return Ok(guest);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateGuestRequest request)
    {
        var guest = await dbContext.Guests.FirstOrDefaultAsync(x => x.GuestId == id && x.DeletedAt == null);
        if (guest is null)
            return NotFound(new { message = "Không tìm thấy khách." });

        var before = new { guest.FullName, guest.Phone, guest.IdNumber };
        guest.FullName = request.FullName.Trim();
        guest.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        guest.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        guest.IdType = string.IsNullOrWhiteSpace(request.IdType) ? null : request.IdType.Trim();
        guest.IdNumber = string.IsNullOrWhiteSpace(request.IdNumber) ? null : request.IdNumber.Trim();
        guest.DateOfBirth = request.DateOfBirth;
        guest.Nationality = string.IsNullOrWhiteSpace(request.Nationality) ? null : request.Nationality.Trim();
        guest.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("GUEST_UPDATE", "Guest", guest.GuestId.ToString(), before: before, after: guest);
        return Ok(guest);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(long id)
    {
        var guest = await dbContext.Guests.FirstOrDefaultAsync(x => x.GuestId == id && x.DeletedAt == null);
        if (guest is null)
            return NotFound(new { message = "Không tìm thấy khách." });

        guest.DeletedAt = DateTime.UtcNow;
        guest.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync("GUEST_SOFT_DELETE", "Guest", guest.GuestId.ToString(), before: new { guest.FullName });
        return Ok(new { message = "Đã xóa mềm khách lưu trú." });
    }
}
