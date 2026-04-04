using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CancelServiceOrderRequest
{
    [MaxLength(300)]
    public string? Reason { get; set; }
}
