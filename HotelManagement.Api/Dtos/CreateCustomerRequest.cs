using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateCustomerRequest
{
    [Required]
    [MaxLength(20)]
    public string CustomerType { get; set; } = "INDIVIDUAL";

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [MaxLength(50)]
    public string? TaxCode { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [EmailAddress]
    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
