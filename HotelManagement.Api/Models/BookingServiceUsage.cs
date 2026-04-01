namespace HotelManagement.Api.Models;

public class BookingServiceUsage
{
    public int Id { get; set; }
    public long BookingId { get; set; }
    public int HotelServiceId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public Booking? Booking { get; set; }
    public HotelService? HotelService { get; set; }
}
