namespace HotelManagement.Api.Models;

public class ServiceOrder
{
    public long ServiceOrderId { get; set; }
    public long StayId { get; set; }
    public string ServiceCode { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public string StatusCode { get; set; } = "ACTIVE";
    public string? CancelReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Stay? Stay { get; set; }
}
