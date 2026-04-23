using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController(
    HotelDbContext dbContext,
    ILoyaltyService loyalty) : ControllerBase
{
    /// <summary>
    /// Danh sách khách hàng chưa xóa mềm; lọc theo search (họ tên/công ty/SĐT/email).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? idNumber,
        [FromQuery] bool includeInactive = false,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.Customers.AsQueryable();
        if (!includeInactive)
            query = query.Where(c => c.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(c =>
                (c.FullName != null && c.FullName.Contains(s)) ||
                (c.CompanyName != null && c.CompanyName.Contains(s)) ||
                (c.Phone != null && c.Phone.Contains(s)) ||
                (c.Email != null && c.Email.Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(idNumber))
        {
            var idn = idNumber.Trim();
            query = query.Where(c => c.IdNumber != null && c.IdNumber.Contains(idn));
        }

        query = query.OrderByDescending(c => c.CustomerId);

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
    public async Task<IActionResult> GetById(long id, [FromQuery] bool includeInactive = false)
    {
        var query = dbContext.Customers.AsQueryable().Where(c => c.CustomerId == id);
        if (!includeInactive)
            query = query.Where(c => c.DeletedAt == null);
        var customer = await query.FirstOrDefaultAsync();
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng." });

        return Ok(customer);
    }

    /// <summary>Điểm tích lũy, hạng và mốc hạng kế tiếp.</summary>
    [HttpGet("{id:long}/loyalty")]
    public async Task<IActionResult> GetLoyalty(long id)
    {
        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt == null);
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng." });

        var (nextTier, pointsToNext) = loyalty.PointsToNextTier(customer.LoyaltyPoints);
        return Ok(new
        {
            customer.CustomerId,
            customer.LoyaltyPoints,
            customer.LoyaltyTier,
            nextTier,
            pointsToNextTier = pointsToNext,
            ruleEarn = "Khi xuất hóa đơn: 1 điểm / 100.000đ (floor) — chỉ khi đặt phòng có customerId.",
            tierThresholds = new
            {
                BRONZE = "0–199 điểm",
                SILVER = "200–499",
                GOLD = "500–999",
                PLATINUM = "≥1000"
            }
        });
    }

    /// <summary>Điều chỉnh điểm thủ công (ADMIN).</summary>
    [HttpPost("{id:long}/loyalty/adjust")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> AdjustLoyalty(long id, [FromBody] AdjustLoyaltyRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt == null);
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng." });

        var before = new { customer.LoyaltyPoints, customer.LoyaltyTier };
        loyalty.ApplyPointsAndTier(customer, request.PointsDelta);
        await dbContext.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã cập nhật điểm / hạng.",
            customer.LoyaltyPoints,
            customer.LoyaltyTier
        });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        var err = ValidateCustomerProfile(request.CustomerType, request.FullName, request.CompanyName);
        if (err != null)
            return BadRequest(new { message = err });

        var entity = request.ToEntity();
        dbContext.Customers.Add(entity);
        await dbContext.SaveChangesAsync();

        return Ok(entity);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerRequest request)
    {
        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt == null);
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng." });

        var err = ValidateCustomerProfile(request.CustomerType, request.FullName, request.CompanyName);
        if (err != null)
            return BadRequest(new { message = err });

        var before = new
        {
            customer.CustomerType,
            customer.FullName,
            customer.CompanyName,
            customer.IdType,
            customer.IdNumber,
            customer.DateOfBirth,
            customer.Nationality,
            customer.Phone,
            customer.Email,
            customer.Notes
        };

        customer.CustomerType = request.CustomerType.Trim().ToUpperInvariant();
        customer.FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim();
        customer.CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? null : request.CompanyName.Trim();
        customer.IdType = string.IsNullOrWhiteSpace(request.IdType) ? null : request.IdType.Trim();
        customer.IdNumber = string.IsNullOrWhiteSpace(request.IdNumber) ? null : request.IdNumber.Trim();
        customer.DateOfBirth = request.DateOfBirth;
        customer.Nationality = string.IsNullOrWhiteSpace(request.Nationality) ? null : request.Nationality.Trim();
        customer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        customer.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        customer.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await dbContext.SaveChangesAsync();

        return Ok(customer);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> SoftDelete(long id)
    {
        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt == null);
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng." });

        customer.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Đã xóa mềm khách hàng." });
    }

    [HttpPut("{id:long}/restore")]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Restore(long id)
    {
        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt != null);
        if (customer is null)
            return NotFound(new { message = "Không tìm thấy khách hàng đã xóa mềm." });

        customer.DeletedAt = null;
        await dbContext.SaveChangesAsync();

        return Ok(new { message = "Đã khôi phục khách hàng." });
    }

    private static string? ValidateCustomerProfile(string customerType, string? fullName, string? companyName)
    {
        var t = customerType.Trim().ToUpperInvariant();
        if (t == "INDIVIDUAL" && string.IsNullOrWhiteSpace(fullName))
            return "Khách cá nhân cần có họ tên (fullName).";
        if (t is "COMPANY" or "AGENCY" && string.IsNullOrWhiteSpace(companyName))
            return "Khách doanh nghiệp/đại lý cần có tên công ty (companyName).";
        return null;
    }
}
