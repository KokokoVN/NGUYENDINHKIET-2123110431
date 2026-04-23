namespace HotelManagement.Api.Models;

public class Customer
{
    public long CustomerId { get; set; }
    public string CustomerType { get; set; } = "INDIVIDUAL";
    public string? FullName { get; set; }
    public string? CompanyName { get; set; }
    public string? IdType { get; set; }
    public string? IdNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public int LoyaltyPoints { get; set; }
    public string LoyaltyTier { get; set; } = "BRONZE";
    public DateTime? DeletedAt { get; set; }
}
