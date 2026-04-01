using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;

namespace HotelManagement.Api.Services;

public interface IBookingService
{
    Task<(bool Success, string Message, Booking? Booking)> CreateBookingAsync(CreateBookingRequest request);
}
