using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateUserRequest
{
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(30)]
    public string RoleCode { get; set; } = "RECEPTION";
}
