using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateServiceRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(0, 100000000)]
    public decimal UnitPrice { get; set; }
}
