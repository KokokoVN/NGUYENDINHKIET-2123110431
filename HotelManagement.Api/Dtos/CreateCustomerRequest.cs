using System.ComponentModel.DataAnnotations;
using HotelManagement.Api.Models;

namespace HotelManagement.Api.Dtos;

public class CreateCustomerRequest
{
    [Required]
    [RegularExpression("^(INDIVIDUAL|COMPANY|AGENCY)$", ErrorMessage = "CustomerType phải là INDIVIDUAL, COMPANY hoặc AGENCY.")]
    public string CustomerType { get; set; } = "INDIVIDUAL";

    [MaxLength(200)]
    public string? FullName { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [MaxLength(50)]
    public string? IdType { get; set; }

    [MaxLength(50)]
    public string? IdNumber { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(100)]
    public string? Nationality { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public Customer ToEntity()
    {
        var t = CustomerType.Trim().ToUpperInvariant();
        return new Customer
        {
            CustomerType = t,
            FullName = string.IsNullOrWhiteSpace(FullName) ? null : FullName.Trim(),
            CompanyName = string.IsNullOrWhiteSpace(CompanyName) ? null : CompanyName.Trim(),
            IdType = string.IsNullOrWhiteSpace(IdType) ? null : IdType.Trim(),
            IdNumber = string.IsNullOrWhiteSpace(IdNumber) ? null : IdNumber.Trim(),
            DateOfBirth = DateOfBirth,
            Nationality = string.IsNullOrWhiteSpace(Nationality) ? null : Nationality.Trim(),
            Phone = string.IsNullOrWhiteSpace(Phone) ? null : Phone.Trim(),
            Email = string.IsNullOrWhiteSpace(Email) ? null : Email.Trim(),
            Notes = string.IsNullOrWhiteSpace(Notes) ? null : Notes.Trim(),
            LoyaltyPoints = 0,
            LoyaltyTier = "BRONZE"
        };
    }
}
