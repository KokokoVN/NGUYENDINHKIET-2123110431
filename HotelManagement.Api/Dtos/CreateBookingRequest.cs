using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateBookingRequest
{
    [Required]
    public int RoomId { get; set; }

    public long? CustomerId { get; set; }

    [Required]
    public DateOnly CheckInDate { get; set; }

    [Required]
    public DateOnly CheckOutDate { get; set; }

    [Range(1, 20)]
    public int Adults { get; set; } = 1;

    [Range(0, 20)]
    public int Children { get; set; }

    [MaxLength(500)]
    public string? SpecialRequest { get; set; }
}
