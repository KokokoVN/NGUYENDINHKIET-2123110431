namespace HotelManagement.Api.Models;

public class Booking
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public decimal TotalAmount { get; set; }
    public Room? Room { get; set; }
}
