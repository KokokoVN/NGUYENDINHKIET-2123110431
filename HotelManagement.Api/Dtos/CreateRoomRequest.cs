using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateRoomRequest
{
    [Required]
    public int HotelId { get; set; }

    [Required]
    public int RoomTypeId { get; set; }

    [Required]
    [MaxLength(50)]
    public string RoomNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Floor { get; set; }

    [MaxLength(30)]
    public string StatusCode { get; set; } = "VACANT";
}
