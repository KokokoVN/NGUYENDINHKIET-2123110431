using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateServiceOrdersBulkRequest
{
    [Required]
    public long StayId { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Cần ít nhất 1 dịch vụ.")]
    public List<CreateServiceOrdersBulkItem> Items { get; set; } = [];
}

public class CreateServiceOrdersBulkItem
{
    [Required]
    [MaxLength(50)]
    public string ServiceCode { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    [Range(1, 999)]
    public int Quantity { get; set; } = 1;

    [Range(0, 999999999)]
    public decimal UnitPrice { get; set; }
}

