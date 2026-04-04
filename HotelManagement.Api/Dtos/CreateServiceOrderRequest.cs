using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateServiceOrderRequest
{
    /// <summary>Một trong hai: StayId hoặc ReservationId (đơn đang IN_HOUSE).</summary>
    public long? StayId { get; set; }

    public long? ReservationId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ServiceCode { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    [Range(1, 999)]
    public int Quantity { get; set; } = 1;

    [Range(0, 999999999)]
    public decimal UnitPrice { get; set; }
}
