using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateHotelServiceRequest
{
    [Required]
    public int HotelId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ServiceCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string ServiceName { get; set; } = string.Empty;

    [Range(0, 999999999)]
    public decimal DefaultUnitPrice { get; set; }

    public bool IsActive { get; set; } = true;
}
