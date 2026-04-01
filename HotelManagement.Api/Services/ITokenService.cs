using HotelManagement.Api.Models;

namespace HotelManagement.Api.Services;

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAtUtc) GenerateToken(AppUser user, string roleCode);
}
