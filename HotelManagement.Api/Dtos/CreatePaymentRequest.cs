using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreatePaymentRequest
{
    public long? StayId { get; set; }
    public long? ReservationId { get; set; }

    [Required]
    [RegularExpression("^(CHARGE|DEPOSIT|REFUND)$")]
    public string PaymentType { get; set; } = "CHARGE";

    [Required]
    [RegularExpression("^(CASH|BANK_TRANSFER|CARD|OTHER)$")]
    public string MethodCode { get; set; } = "CASH";

    [Range(0.01, 999999999)]
    public decimal Amount { get; set; }

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(300)]
    public string? Note { get; set; }
}
