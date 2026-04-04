using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateMaintenanceTicketRequest
{
    public int? AssignedTo { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [RegularExpression("^(OPEN|IN_PROGRESS|DONE|CANCELLED)$")]
    public string StatusCode { get; set; } = "OPEN";

    [MaxLength(300)]
    public string? CancelReason { get; set; }
}
