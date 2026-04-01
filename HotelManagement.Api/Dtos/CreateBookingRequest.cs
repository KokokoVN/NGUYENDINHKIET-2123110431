using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateBookingRequest
{
    [Required]
    public int RoomId { get; set; }

    [Required]
    [MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string CustomerPhone { get; set; } = string.Empty;

    [Required]
    public DateOnly CheckInDate { get; set; }

    [Required]
    public DateOnly CheckOutDate { get; set; }
}
