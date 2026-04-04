namespace HotelManagement.Api.Models;

public class Stay
{
    public long StayId { get; set; }
    public int HotelId { get; set; }
    public int RoomId { get; set; }
    public long? ReservationId { get; set; }
    public string StatusCode { get; set; } = "IN_HOUSE";
    public DateTime CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public decimal DepositAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Booking? Booking { get; set; }
    public ICollection<ServiceOrder> ServiceOrders { get; set; } = new List<ServiceOrder>();
}
