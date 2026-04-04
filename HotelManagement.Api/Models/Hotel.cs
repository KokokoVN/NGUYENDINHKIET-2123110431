namespace HotelManagement.Api.Models;

public class Hotel
{
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
}
