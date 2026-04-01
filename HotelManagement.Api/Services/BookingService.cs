using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Services;

public class BookingService(HotelDbContext dbContext) : IBookingService
{
    public async Task<(bool Success, string Message, Booking? Booking)> CreateBookingAsync(CreateBookingRequest request)
    {
        if (request.CheckInDate >= request.CheckOutDate)
        {
            return (false, "Ngay check-out phai lon hon ngay check-in.", null);
        }

        var room = await dbContext.Rooms.FirstOrDefaultAsync(r => r.Id == request.RoomId && r.IsActive);
        if (room is null)
        {
            return (false, "Phong khong ton tai hoac da ngung hoat dong.", null);
        }

        var hasOverlap = await dbContext.Bookings.AnyAsync(b =>
            b.RoomId == request.RoomId &&
            request.CheckInDate < b.CheckOutDate &&
            request.CheckOutDate > b.CheckInDate);

        if (hasOverlap)
        {
            return (false, "Phong da duoc dat trong khoang thoi gian nay.", null);
        }

        var totalNights = request.CheckOutDate.DayNumber - request.CheckInDate.DayNumber;
        var booking = new Booking
        {
            RoomId = request.RoomId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            TotalAmount = totalNights * room.PricePerNight
        };

        dbContext.Bookings.Add(booking);
        await dbContext.SaveChangesAsync();

        return (true, "Dat phong thanh cong.", booking);
    }
}
