using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class SetUserRolesRequest
{
    [Required]
    [MinLength(1)]
    public List<string> RoleCodes { get; set; } = [];
}
