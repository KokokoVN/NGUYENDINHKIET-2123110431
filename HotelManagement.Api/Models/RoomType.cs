namespace HotelManagement.Api.Models;

public class RoomType
{
    public int RoomTypeId { get; set; }
    public int HotelId { get; set; }
    public string RoomTypeName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
