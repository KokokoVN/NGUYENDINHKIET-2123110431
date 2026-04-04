using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class UpdateHousekeepingTaskRequest
{
    public int? AssignedTo { get; set; }

    [Required]
    [RegularExpression("^(OPEN|IN_PROGRESS|DONE|CANCELLED)$")]
    public string StatusCode { get; set; } = "OPEN";

    [MaxLength(300)]
    public string? Note { get; set; }
}
