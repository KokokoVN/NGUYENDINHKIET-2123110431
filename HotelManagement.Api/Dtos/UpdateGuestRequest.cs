using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateGuestRequest
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? IdType { get; set; }

    [MaxLength(50)]
    public string? IdNumber { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(100)]
    public string? Nationality { get; set; }
}
