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
public class HotelsController(HotelDbContext dbContext, IAuditLogService auditLog) : ControllerBase
{
    /// <summary>
    /// Lọc: search (tên hoặc địa chỉ), phone, email, includeInactive (mặc định chỉ khách sạn đang hoạt động).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? phone,
        [FromQuery] string? email,
        [FromQuery] bool includeInactive = false)
    {
        var query = dbContext.Hotels.AsQueryable();

        if (!includeInactive)
            query = query.Where(h => h.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(h =>
                h.HotelName.Contains(s) ||
                (h.Address != null && h.Address.Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var p = phone.Trim();
            query = query.Where(h => h.Phone != null && h.Phone.Contains(p));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var e = email.Trim();
            query = query.Where(h => h.Email != null && h.Email.Contains(e));
        }

        var list = await query.OrderBy(h => h.HotelName).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] bool includeInactive = false)
    {
        var query = dbContext.Hotels.AsQueryable().Where(h => h.HotelId == id);
        if (!includeInactive)
            query = query.Where(h => h.IsActive);

        var hotel = await query.FirstOrDefaultAsync();
        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn." });

        return Ok(hotel);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create(CreateHotelRequest request)
    {
        var hotelName = request.HotelName.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        var dupResult = await ValidateHotelUniquenessAsync(hotelName, phone, email, excludeHotelId: null);
        if (dupResult != null)
            return dupResult;

        var hotel = new Hotel
        {
            HotelName = hotelName,
            Address = request.Address?.Trim(),
            Phone = phone,
            Email = email,
            IsActive = request.IsActive
        };

        dbContext.Hotels.Add(hotel);
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "HOTEL_CREATE",
            "Hotel",
            hotel.HotelId.ToString(),
            after: new
            {
                hotel.HotelId,
                hotel.HotelName,
                hotel.Address,
                hotel.Phone,
                hotel.Email,
                hotel.IsActive
            });

        return Ok(new { message = "Thêm khách sạn thành công.", data = hotel });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Update(int id, UpdateHotelRequest request)
    {
        var hotel = await dbContext.Hotels.FirstOrDefaultAsync(h => h.HotelId == id && h.IsActive);
        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn để cập nhật." });

        var hotelName = request.HotelName.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();

        var dupResult = await ValidateHotelUniquenessAsync(hotelName, phone, email, excludeHotelId: id);
        if (dupResult != null)
            return dupResult;

        var before = new
        {
            hotel.HotelId,
            hotel.HotelName,
            hotel.Address,
            hotel.Phone,
            hotel.Email,
            hotel.IsActive
        };

        hotel.HotelName = hotelName;
        hotel.Address = request.Address?.Trim();
        hotel.Phone = phone;
        hotel.Email = email;
        hotel.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "HOTEL_UPDATE",
            "Hotel",
            hotel.HotelId.ToString(),
            before: before,
            after: new
            {
                hotel.HotelId,
                hotel.HotelName,
                hotel.Address,
                hotel.Phone,
                hotel.Email,
                hotel.IsActive
            });

        return Ok(new { message = "Cập nhật khách sạn thành công.", data = hotel });
    }

    /// <summary>Xóa mềm: IsActive = false (không xóa dòng DB).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(int id)
    {
        var hotel = await dbContext.Hotels.FirstOrDefaultAsync(h => h.HotelId == id && h.IsActive);
        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn để ngưng hoạt động." });

        var hasActiveChildren = await dbContext.Rooms.AnyAsync(r => r.HotelId == id && r.IsActive)
            || await dbContext.RoomTypes.AnyAsync(rt => rt.HotelId == id && rt.IsActive);
        if (hasActiveChildren)
            return BadRequest(new { message = "Không thể ngưng hoạt động khách sạn khi vẫn còn phòng/loại phòng đang hoạt động." });

        var before = new
        {
            hotel.HotelId,
            hotel.HotelName,
            hotel.Address,
            hotel.Phone,
            hotel.Email,
            hotel.IsActive
        };

        hotel.IsActive = false;
        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "HOTEL_SOFT_DELETE",
            "Hotel",
            hotel.HotelId.ToString(),
            reason: "Ngưng hoạt động khách sạn (xóa mềm)",
            before: before,
            after: new
            {
                hotel.HotelId,
                hotel.HotelName,
                hotel.Address,
                hotel.Phone,
                hotel.Email,
                hotel.IsActive
            });

        return Ok(new { message = "Ngưng hoạt động khách sạn thành công." });
    }

    /// <summary>Không cho trùng tên / SĐT / email với khách sạn khác đang hoạt động.</summary>
    private async Task<IActionResult?> ValidateHotelUniquenessAsync(
        string hotelNameTrimmed,
        string? phoneTrimmedOrNull,
        string? emailTrimmedOrNull,
        int? excludeHotelId)
    {
        var nameKey = hotelNameTrimmed.ToLowerInvariant();
        var nameDup = await dbContext.Hotels.AnyAsync(h =>
            h.IsActive &&
            (!excludeHotelId.HasValue || h.HotelId != excludeHotelId.Value) &&
            h.HotelName.ToLower() == nameKey);
        if (nameDup)
            return BadRequest(new { message = "Tên khách sạn đã tồn tại (khách sạn đang hoạt động)." });

        if (phoneTrimmedOrNull is not null)
        {
            var phoneDup = await dbContext.Hotels.AnyAsync(h =>
                h.IsActive &&
                (!excludeHotelId.HasValue || h.HotelId != excludeHotelId.Value) &&
                h.Phone != null &&
                h.Phone == phoneTrimmedOrNull);
            if (phoneDup)
                return BadRequest(new { message = "Số điện thoại đã được dùng cho khách sạn khác." });
        }

        if (emailTrimmedOrNull is not null)
        {
            var emailKey = emailTrimmedOrNull.ToLowerInvariant();
            var emailDup = await dbContext.Hotels.AnyAsync(h =>
                h.IsActive &&
                (!excludeHotelId.HasValue || h.HotelId != excludeHotelId.Value) &&
                h.Email != null &&
                h.Email.ToLower() == emailKey);
            if (emailDup)
                return BadRequest(new { message = "Email đã được dùng cho khách sạn khác." });
        }

        return null;
    }
}
