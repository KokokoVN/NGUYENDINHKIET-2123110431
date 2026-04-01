namespace HotelManagement.Api.Models;

public class Hotel
{
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
