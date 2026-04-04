namespace HotelManagement.Api.Models;

/// <summary>
/// Danh mục dịch vụ theo khách sạn (bảng dbo.HotelService).
/// </summary>
public class HotelServiceItem
{
    public int HotelServiceId { get; set; }
    public int HotelId { get; set; }
    public string ServiceCode { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public decimal DefaultUnitPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
