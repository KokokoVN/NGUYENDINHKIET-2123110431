namespace HotelManagement.Api.Models;

public class RoomType
{
    public int RoomTypeId { get; set; }
    public int HotelId { get; set; }
    public string RoomTypeName { get; set; } = string.Empty;
    public int Capacity { get; set; } = 2;
    public decimal BaseRate { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
