using HotelManagement.Api.Models;

namespace HotelManagement.Api.Services;

public interface ILoyaltyService
{
    /// <summary>Điểm cộng từ tổng thanh toán hóa đơn (1 điểm / 100.000đ, làm tròn xuống).</summary>
    int PointsEarnedFromInvoiceTotal(decimal totalAmount);

    /// <summary>Hạng từ tổng điểm: BRONZE / SILVER / GOLD / PLATINUM.</summary>
    string TierFromPoints(int points);

    /// <summary>Cập nhật điểm + hạng sau khi cộng điểm.</summary>
    void ApplyPointsAndTier(Customer customer, int pointsDelta);

    /// <summary>Hạng kế tiếp và số điểm còn thiếu (nếu đã PLATINUM thì next = null).</summary>
    (string? NextTier, int PointsToNext) PointsToNextTier(int points);
}
