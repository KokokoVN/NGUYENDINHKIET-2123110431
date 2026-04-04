namespace HotelManagement.Api.Models;

public class Payment
{
    public long PaymentId { get; set; }
    public long? StayId { get; set; }
    public long? ReservationId { get; set; }
    public string PaymentType { get; set; } = "CHARGE";
    public string MethodCode { get; set; } = "CASH";
    public decimal Amount { get; set; }
    public string StatusCode { get; set; } = "PAID";
    public string? ReferenceNo { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
