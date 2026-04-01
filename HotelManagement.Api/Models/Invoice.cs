namespace HotelManagement.Api.Models;

public class Invoice
{
    public int Id { get; set; }
    public long BookingId { get; set; }
    public decimal RoomAmount { get; set; }
    public decimal ServiceAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    public string PaymentMethod { get; set; } = "Cash";
    public string? Note { get; set; }
    public Booking? Booking { get; set; }
}
