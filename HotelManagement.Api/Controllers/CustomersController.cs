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
    IAuditLogService auditLog,
    ILoyaltyService loyalty) : ControllerBase
{
    /// <summary>
    /// Danh sách khách hàng chưa xóa mềm; lọc theo search (họ tên/công ty/SĐT/email).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var query = dbContext.Customers.AsQueryable().Where(c => c.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(c =>
                (c.FullName != null && c.FullName.Contains(s)) ||
                (c.CompanyName != null && c.CompanyName.Contains(s)) ||
                (c.Phone != null && c.Phone.Contains(s)) ||
                (c.Email != null && c.Email.Contains(s)));
        }

        var list = await query.OrderByDescending(c => c.CustomerId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.CustomerId == id && c.DeletedAt == null);
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

        await auditLog.WriteAsync(
            "LOYALTY_ADJUST",
            "Customer",
            customer.CustomerId.ToString(),
            reason: request.Reason?.Trim(),
            before: before,
            after: new { customer.LoyaltyPoints, customer.LoyaltyTier });

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

        await auditLog.WriteAsync(
            "CUSTOMER_CREATE",
            "Customer",
            entity.CustomerId.ToString(),
            after: entity);

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
            customer.TaxCode,
            customer.Phone,
            customer.Email,
            customer.Notes
        };

        customer.CustomerType = request.CustomerType.Trim().ToUpperInvariant();
        customer.FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim();
        customer.CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? null : request.CompanyName.Trim();
        customer.TaxCode = string.IsNullOrWhiteSpace(request.TaxCode) ? null : request.TaxCode.Trim();
        customer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        customer.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        customer.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await dbContext.SaveChangesAsync();

        await auditLog.WriteAsync(
            "CUSTOMER_UPDATE",
            "Customer",
            customer.CustomerId.ToString(),
            before: before,
            after: customer);

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

        await auditLog.WriteAsync(
            "CUSTOMER_SOFT_DELETE",
            "Customer",
            customer.CustomerId.ToString(),
            before: new { customer.FullName, customer.CompanyName, customer.Phone });

        return Ok(new { message = "Đã xóa mềm khách hàng." });
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
