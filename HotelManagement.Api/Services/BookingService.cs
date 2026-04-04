using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Services;

public class BookingService(HotelDbContext dbContext, IAuditLogService auditLog) : IBookingService
{
    public async Task<(bool Success, string Message, Booking? Booking)> CreateBookingAsync(CreateBookingRequest request)
    {
        if (request.CheckInDate >= request.CheckOutDate)
            return (false, "Ngày check-out phải lớn hơn ngày check-in.", null);

        if (request.CustomerId.HasValue && request.NewCustomer != null)
            return (false, "Chỉ được chọn một: customerId hoặc newCustomer.", null);

        if (request.NewCustomer != null)
        {
            var profileErr = ValidateCustomerProfile(
                request.NewCustomer.CustomerType,
                request.NewCustomer.FullName,
                request.NewCustomer.CompanyName);
            if (profileErr != null)
                return (false, profileErr, null);
        }

        var room = await dbContext.Rooms
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.RoomId == request.RoomId && r.IsActive);

        if (room is null)
            return (false, "Phòng không tồn tại hoặc đã ngưng hoạt động.", null);

        if (room.RoomType is not { IsActive: true })
            return (false, "Loại phòng không hợp lệ hoặc đã ngưng hoạt động.", null);

        if (room.StatusCode is "OUT_OF_SERVICE" or "MAINTENANCE")
            return (false, "Phòng đang bảo trì hoặc ngưng phục vụ, không thể đặt.", null);

        if (request.CustomerId.HasValue)
        {
            var ok = await dbContext.Customers.AnyAsync(c =>
                c.CustomerId == request.CustomerId.Value && c.DeletedAt == null);
            if (!ok)
                return (false, "Khách hàng không tồn tại hoặc đã bị xóa.", null);
        }

        var hasOverlap = await dbContext.Bookings.AnyAsync(b =>
            b.RoomId == request.RoomId &&
            (b.StatusCode == "CONFIRMED" || b.StatusCode == "CHECKED_IN") &&
            request.CheckInDate < b.CheckOutDate &&
            request.CheckOutDate > b.CheckInDate);

        if (hasOverlap)
            return (false, "Phòng đã được đặt trong khoảng thời gian này.", null);

        var capacity = room.RoomType!.Capacity;
        if (request.Adults + request.Children > capacity)
            return (false, $"Số khách ({request.Adults + request.Children}) vượt sức chứa loại phòng ({capacity}).", null);

        var rate = request.RatePerNight ?? room.RoomType.BaseRate;
        if (rate < 0)
            return (false, "Đơn giá không hợp lệ.", null);

        var booking = new Booking
        {
            HotelId = room.HotelId,
            RoomId = request.RoomId,
            CustomerId = request.NewCustomer != null ? null : request.CustomerId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            Adults = request.Adults,
            Children = request.Children,
            SpecialRequest = request.SpecialRequest?.Trim(),
            RatePerNight = rate,
            StatusCode = "CONFIRMED"
        };

        if (request.NewCustomer != null)
            booking.Customer = request.NewCustomer.ToEntity();

        dbContext.Bookings.Add(booking);
        await dbContext.SaveChangesAsync();

        if (booking.Customer != null)
        {
            await auditLog.WriteAsync(
                "CUSTOMER_CREATE",
                "Customer",
                booking.Customer.CustomerId.ToString(),
                after: booking.Customer);
        }

        var withIncludes = await dbContext.Bookings
            .Include(b => b.Room)
            .Include(b => b.Customer)
            .FirstAsync(b => b.ReservationId == booking.ReservationId);

        await auditLog.WriteAsync(
            "BOOKING_CREATE",
            "Reservation",
            withIncludes.ReservationId.ToString(),
            after: new
            {
                withIncludes.HotelId,
                withIncludes.RoomId,
                withIncludes.CustomerId,
                withIncludes.StatusCode,
                withIncludes.CheckInDate,
                withIncludes.CheckOutDate,
                withIncludes.Adults,
                withIncludes.Children,
                withIncludes.RatePerNight
            });

        return (true, "Đặt phòng thành công.", withIncludes);
    }

    private static string? ValidateCustomerProfile(string customerType, string? fullName, string? companyName)
    {
        var t = customerType.Trim().ToUpperInvariant();
        if (t == "INDIVIDUAL" && string.IsNullOrWhiteSpace(fullName))
            return "Khách cá nhân cần có họ tên (fullName).";
        if (t is "COMPANY" or "AGENCY" && string.IsNullOrWhiteSpace(companyName))
            return "Khách doanh nghiệp/đại lý cần có tên công ty (companyName).";
        return null;
    }
}
