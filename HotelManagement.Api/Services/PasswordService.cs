using System.Security.Cryptography;
using System.Text;

namespace HotelManagement.Api.Services;

public class PasswordService : IPasswordService
{
    public string Hash(string plainText)
    {
        var bytes = Encoding.UTF8.GetBytes(plainText);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexString(hashBytes);
    }

    public bool Verify(string plainText, string hash)
    {
        var inputHash = Hash(plainText);
        return string.Equals(inputHash, hash, StringComparison.OrdinalIgnoreCase);
    }
}
