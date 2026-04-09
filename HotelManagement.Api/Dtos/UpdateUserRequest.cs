using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateUserRequest
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }
}
