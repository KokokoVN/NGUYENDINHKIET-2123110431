using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateInvoiceRequest
{
    [Required]
    public long BookingId { get; set; }

    [Required]
    [MaxLength(30)]
    public string PaymentMethod { get; set; } = "Cash";

    [MaxLength(250)]
    public string? Note { get; set; }
}
