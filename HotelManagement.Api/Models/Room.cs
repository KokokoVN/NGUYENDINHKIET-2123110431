namespace HotelManagement.Api.Models;

public class Room
{
    public int RoomId { get; set; }
    public int HotelId { get; set; }
    public int RoomTypeId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string StatusCode { get; set; } = "VACANT";
    public string? Floor { get; set; }
    public bool IsActive { get; set; } = true;
    public RoomType? RoomType { get; set; }
}
