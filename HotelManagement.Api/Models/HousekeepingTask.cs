namespace HotelManagement.Api.Models;

public class HousekeepingTask
{
    public long TaskId { get; set; }
    public int RoomId { get; set; }
    public int? AssignedTo { get; set; }
    public string StatusCode { get; set; } = "OPEN";
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
