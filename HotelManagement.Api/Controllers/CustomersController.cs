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
public class CustomersController(HotelDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await dbContext.Customers.OrderByDescending(c => c.CustomerId).ToListAsync();
        return Ok(customers);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION")]
    public async Task<IActionResult> Create(CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            CustomerType = request.CustomerType.Trim().ToUpperInvariant(),
            FullName = request.FullName.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            TaxCode = request.TaxCode?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Notes = request.Notes?.Trim()
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();
        return Ok(customer);
    }
}
