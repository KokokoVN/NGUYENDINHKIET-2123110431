using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateCustomerRequest
{
    [Required]
    [RegularExpression("^(INDIVIDUAL|COMPANY|AGENCY)$", ErrorMessage = "CustomerType phải là INDIVIDUAL, COMPANY hoặc AGENCY.")]
    public string CustomerType { get; set; } = "INDIVIDUAL";

    [MaxLength(200)]
    public string? FullName { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [MaxLength(50)]
    public string? TaxCode { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
