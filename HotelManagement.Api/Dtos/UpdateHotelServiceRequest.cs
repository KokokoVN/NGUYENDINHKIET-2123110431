using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateHotelServiceRequest
{
    [Required]
    [MaxLength(200)]
    public string ServiceName { get; set; } = string.Empty;

    [Range(0, 999999999)]
    public decimal DefaultUnitPrice { get; set; }

    public bool IsActive { get; set; } = true;
}
