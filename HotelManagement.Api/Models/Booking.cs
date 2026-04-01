namespace HotelManagement.Api.Models;

public class Booking
{
    public long ReservationId { get; set; }
    public int HotelId { get; set; }
    public int RoomId { get; set; }
    public long? CustomerId { get; set; }
    public string StatusCode { get; set; } = "CONFIRMED";
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public decimal RatePerNight { get; set; }
    public string? SpecialRequest { get; set; }
    public Room? Room { get; set; }
    public Customer? Customer { get; set; }
    public List<BookingServiceUsage> ServiceUsages { get; set; } = [];
}
