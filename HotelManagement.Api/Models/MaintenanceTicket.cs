namespace HotelManagement.Api.Models;

public class MaintenanceTicket
{
    public long TicketId { get; set; }
    public int RoomId { get; set; }
    public int? AssignedTo { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string StatusCode { get; set; } = "OPEN";
    public string? CancelReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
