using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Api.Dtos;

public class CreateBookingRequest
{
    [Required]
    public int RoomId { get; set; }

    /// <summary>
    /// Khách đã có trong hệ thống. Không dùng cùng lúc với <see cref="NewCustomer"/>.
    /// </summary>
    public long? CustomerId { get; set; }

    /// <summary>
    /// Tạo khách mới và gán vào đặt phòng trong cùng một giao dịch. Không dùng cùng lúc với <see cref="CustomerId"/>.
    /// </summary>
    public CreateCustomerRequest? NewCustomer { get; set; }

    [Required]
    public DateOnly CheckInDate { get; set; }

    [Required]
    public DateOnly CheckOutDate { get; set; }

    [Range(1, 20)]
    public int Adults { get; set; } = 1;

    [Range(0, 20)]
    public int Children { get; set; }

    /// <summary>
    /// Giá mỗi đêm; nếu null thì lấy theo BaseRate của loại phòng.
    /// </summary>
    [Range(0, 999999999)]
    public decimal? RatePerNight { get; set; }

    [MaxLength(500)]
    public string? SpecialRequest { get; set; }
}
