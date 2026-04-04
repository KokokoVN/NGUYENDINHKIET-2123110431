using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateRoomTypeRequest
{
    [Required]
    public int HotelId { get; set; }

    [Required]
    [MaxLength(200)]
    public string RoomTypeName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Capacity { get; set; } = 2;

    [Range(0, double.MaxValue)]
    public decimal BaseRate { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}
