using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class AdjustLoyaltyRequest
{
    /// <summary>Điểm cộng (dương) hoặc trừ (âm).</summary>
    [Range(-100000, 100000)]
    public int PointsDelta { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}
