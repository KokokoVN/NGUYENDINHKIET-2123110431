using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreatePaymentRequest
{
    public long? StayId { get; set; }

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    [MaxLength(300)]
    public string? Note { get; set; }
}
