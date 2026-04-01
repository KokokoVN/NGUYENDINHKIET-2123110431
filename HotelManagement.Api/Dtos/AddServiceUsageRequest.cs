using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class AddServiceUsageRequest
{
    [Required]
    public long BookingId { get; set; }

    [Required]
    public int HotelServiceId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; }
}
