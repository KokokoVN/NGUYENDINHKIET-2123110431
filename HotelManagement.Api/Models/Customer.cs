namespace HotelManagement.Api.Models;

public class Customer
{
    public long CustomerId { get; set; }
    public string CustomerType { get; set; } = "INDIVIDUAL";
    public string? FullName { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
}
