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
public class HotelsController(HotelDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Lọc: search (tên hoặc địa chỉ), phone, email, includeInactive (mặc định chỉ khách sạn đang hoạt động).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? phone,
        [FromQuery] string? email,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
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

        query = query.OrderBy(h => h.HotelName);

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

        return Ok(new { message = "Ngưng hoạt động khách sạn thành công." });
    }

    [HttpPut("{id:int}/restore")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Restore(int id)
    {
        var hotel = await dbContext.Hotels.FirstOrDefaultAsync(h => h.HotelId == id && !h.IsActive);
        if (hotel is null)
            return NotFound(new { message = "Không tìm thấy khách sạn đã ngưng hoạt động." });

        var dupResult = await ValidateHotelUniquenessAsync(
            hotel.HotelName.Trim(),
            string.IsNullOrWhiteSpace(hotel.Phone) ? null : hotel.Phone.Trim(),
            string.IsNullOrWhiteSpace(hotel.Email) ? null : hotel.Email.Trim(),
            excludeHotelId: id);
        if (dupResult != null)
            return dupResult;

        hotel.IsActive = true;
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Đã kích hoạt lại khách sạn." });
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
