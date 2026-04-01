using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HotelManagement.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace HotelManagement.Api.Services;

public class TokenService(IConfiguration configuration) : ITokenService
{
    public (string AccessToken, DateTime ExpiresAtUtc) GenerateToken(AppUser user, string roleCode)
    {
        var jwtSection = configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer missing.");
        var audience = jwtSection["Audience"] ?? throw new InvalidOperationException("Jwt:Audience missing.");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key missing.");
        var expiresMinutes = int.TryParse(jwtSection["ExpiresMinutes"], out var value) ? value : 120;

        var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, roleCode),
            new("fullName", user.FullName ?? string.Empty)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
