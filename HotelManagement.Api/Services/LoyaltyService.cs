using HotelManagement.Api.Models;

namespace HotelManagement.Api.Services;

public class LoyaltyService : ILoyaltyService
{
    /// <summary>Mỗi 100.000 VND trên hóa đơn = 1 điểm (floor).</summary>
    private const decimal DongPerPoint = 100_000m;

    public int PointsEarnedFromInvoiceTotal(decimal totalAmount)
    {
        if (totalAmount <= 0)
            return 0;
        return (int)Math.Floor(totalAmount / DongPerPoint);
    }

    public string TierFromPoints(int points) => points switch
    {
        >= 1000 => "PLATINUM",
        >= 500 => "GOLD",
        >= 200 => "SILVER",
        _ => "BRONZE"
    };

    public void ApplyPointsAndTier(Customer customer, int pointsDelta)
    {
        customer.LoyaltyPoints = Math.Max(0, customer.LoyaltyPoints + pointsDelta);
        customer.LoyaltyTier = TierFromPoints(customer.LoyaltyPoints);
    }

    public (string? NextTier, int PointsToNext) PointsToNextTier(int points)
    {
        if (points < 200)
            return ("SILVER", 200 - points);
        if (points < 500)
            return ("GOLD", 500 - points);
        if (points < 1000)
            return ("PLATINUM", 1000 - points);
        return (null, 0);
    }
}
