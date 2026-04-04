using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateHotelRequest
{
    [Required]
    [MaxLength(200)]
    public string HotelName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    [EmailAddress]
    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;
}
