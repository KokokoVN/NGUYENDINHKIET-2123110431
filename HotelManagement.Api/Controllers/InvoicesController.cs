using HotelManagement.Api.Data;
using HotelManagement.Api.Dtos;
using HotelManagement.Api.Models;
using HotelManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HotelManagement.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController(
    HotelDbContext dbContext,
    ILoyaltyService loyalty) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var query = dbContext.Invoices
            .AsNoTracking()
            .Include(i => i.Booking)
            .AsQueryable();

        var paidReservationIds = dbContext.Payments
            .Where(p => p.StatusCode == "PAID" && p.ReservationId.HasValue)
            .Select(p => p.ReservationId!.Value)
            .Distinct();
        query = query.Where(i => paidReservationIds.Contains(i.BookingId));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(i =>
                i.PaymentMethod.Contains(s) ||
                (i.Note != null && i.Note.Contains(s)) ||
                i.BookingId.ToString().Contains(s));
        }

        query = query.OrderByDescending(i => i.Id);

        var usePaging = page.HasValue || pageSize.HasValue;
        if (!usePaging)
        {
            var invoices = await query.ToListAsync();
            return Ok(invoices);
        }

        var currentPage = Math.Max(1, page ?? 1);
        var currentPageSize = Math.Clamp(pageSize ?? 20, 1, 200);
        var totalItems = await query.CountAsync();
        var totalPages = totalItems == 0 ? 1 : (int)Math.Ceiling(totalItems / (double)currentPageSize);
        if (currentPage > totalPages) currentPage = totalPages;

        var items = await query
            .Skip((currentPage - 1) * currentPageSize)
            .Take(currentPageSize)
            .ToListAsync();

        return Ok(new { items, page = currentPage, pageSize = currentPageSize, totalItems, totalPages });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await dbContext.Invoices
            .AsNoTracking()
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        var serviceItems = await (
            from s in dbContext.Stays
            where s.ReservationId == invoice.BookingId
            join o in dbContext.ServiceOrders on s.StayId equals o.StayId
            where o.StatusCode == "ACTIVE"
            join r in dbContext.Rooms on s.RoomId equals r.RoomId into roomJoin
            from r in roomJoin.DefaultIfEmpty()
            join hs in dbContext.HotelServices
                on new { HotelId = s.HotelId, o.ServiceCode } equals new { hs.HotelId, hs.ServiceCode } into serviceJoin
            from hs in serviceJoin.DefaultIfEmpty()
            select new
            {
                o.ServiceOrderId,
                o.StayId,
                RoomId = s.RoomId,
                RoomNumber = r != null ? r.RoomNumber : null,
                o.ServiceCode,
                ServiceName = hs != null ? hs.ServiceName : null,
                o.Description,
                o.Quantity,
                o.UnitPrice,
                lineTotal = o.Quantity * o.UnitPrice
            }).AsNoTracking().ToListAsync();

        var nightsStayed = invoice.Booking is null
            ? 0
            : Math.Max(0, invoice.Booking.CheckOutDate.DayNumber - invoice.Booking.CheckInDate.DayNumber);

        return Ok(new
        {
            invoice.Id,
            invoice.BookingId,
            invoice.RoomAmount,
            invoice.ServiceAmount,
            invoice.TotalAmount,
            invoice.PaidAt,
            invoice.PaymentMethod,
            invoice.Note,
            booking = invoice.Booking,
            nightsStayed,
            ratePerNight = invoice.Booking?.RatePerNight,
            serviceItems
        });
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> ExportPdf(int id)
    {
        var invoice = await dbContext.Invoices
            .AsNoTracking()
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null)
            return NotFound(new { message = "Không tìm thấy hóa đơn." });

        var serviceItems = await (
            from s in dbContext.Stays
            where s.ReservationId == invoice.BookingId
            join o in dbContext.ServiceOrders on s.StayId equals o.StayId
            where o.StatusCode == "ACTIVE"
            join hs in dbContext.HotelServices
                on new { HotelId = s.HotelId, o.ServiceCode } equals new { hs.HotelId, hs.ServiceCode } into serviceJoin
            from hs in serviceJoin.DefaultIfEmpty()
            select new
            {
                o.ServiceCode,
                ServiceName = hs != null ? hs.ServiceName : null,
                o.Quantity,
                o.UnitPrice,
                LineTotal = o.Quantity * o.UnitPrice
            }).AsNoTracking().ToListAsync();

        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(24);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Text("HOA DON THANH TOAN").Bold().FontSize(18);
                    col.Item().Text($"So hoa don: #{invoice.Id}");
                    col.Item().Text($"Ngay thanh toan: {invoice.PaidAt:dd/MM/yyyy HH:mm}");
                });

                page.Content().Column(col =>
                {
                    col.Spacing(8);
                    col.Item().Text($"Booking: #{invoice.BookingId}");
                    col.Item().Text($"Tien phong: {invoice.RoomAmount:N0} VND");
                    col.Item().Text($"Tien dich vu: {invoice.ServiceAmount:N0} VND");
                    col.Item().Text($"Tong thanh toan: {invoice.TotalAmount:N0} VND").Bold();
                    col.Item().Text($"Phuong thuc: {invoice.PaymentMethod}");
                    if (!string.IsNullOrWhiteSpace(invoice.Note))
                        col.Item().Text($"Ghi chu: {invoice.Note}");

                    col.Item().PaddingTop(8).Text("Chi tiet dich vu").Bold();
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Ma DV").Bold();
                            header.Cell().Element(CellStyle).Text("Ten DV").Bold();
                            header.Cell().Element(CellStyle).Text("SL").Bold();
                            header.Cell().Element(CellStyle).Text("Don gia").Bold();
                            header.Cell().Element(CellStyle).Text("Thanh tien").Bold();
                        });

                        if (serviceItems.Count == 0)
                        {
                            table.Cell().ColumnSpan(5).Element(CellStyle).Text("Khong co dich vu su dung.");
                        }
                        else
                        {
                            foreach (var item in serviceItems)
                            {
                                table.Cell().Element(CellStyle).Text(item.ServiceCode);
                                table.Cell().Element(CellStyle).Text(item.ServiceName ?? "-");
                                table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                                table.Cell().Element(CellStyle).Text($"{item.UnitPrice:N0}");
                                table.Cell().Element(CellStyle).Text($"{item.LineTotal:N0}");
                            }
                        }
                    });
                });

                page.Footer().AlignCenter().Text("Cam on quy khach da su dung dich vu.");
            });
        }).GeneratePdf();

        return File(pdfBytes, "application/pdf", $"invoice-{invoice.Id}.pdf");

        static IContainer CellStyle(IContainer container)
            => container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4).PaddingHorizontal(2);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,RECEPTION,ACCOUNTANT")]
    public async Task<IActionResult> Create(CreateInvoiceRequest request)
    {
        var booking = await dbContext.Bookings
            .FirstOrDefaultAsync(b => b.ReservationId == request.BookingId);
        if (booking is null)
        {
            return NotFound(new { message = "Khong tim thay don dat phong." });
        }

        if (await dbContext.Invoices.AnyAsync(i => i.BookingId == booking.ReservationId))
            return BadRequest(new { message = "Đặt phòng này đã có hóa đơn." });

        if (booking.StatusCode != "CHECKED_OUT")
        {
            return BadRequest(new { message = "Chi duoc xuat hoa don sau khi tra phong." });
        }

        var stayIds = await dbContext.Stays
            .Where(s => s.ReservationId == booking.ReservationId)
            .Select(s => s.StayId)
            .ToListAsync();
        var serviceAmount = await dbContext.ServiceOrders
            .Where(o => stayIds.Contains(o.StayId) && o.StatusCode == "ACTIVE")
            .SumAsync(o => (decimal?)(o.Quantity * o.UnitPrice)) ?? 0m;
        var totalNights = booking.CheckOutDate.DayNumber - booking.CheckInDate.DayNumber;
        var roomAmount = totalNights * booking.RatePerNight;
        var invoice = new Invoice
        {
            BookingId = booking.ReservationId,
            RoomAmount = roomAmount,
            ServiceAmount = serviceAmount,
            TotalAmount = roomAmount + serviceAmount,
            PaymentMethod = request.PaymentMethod.Trim(),
            Note = request.Note?.Trim(),
            PaidAt = DateTime.UtcNow
        };

        dbContext.Invoices.Add(invoice);

        var earned = 0;
        Customer? loyaltyCustomer = null;
        if (booking.CustomerId.HasValue)
        {
            loyaltyCustomer = await dbContext.Customers.FirstOrDefaultAsync(c =>
                c.CustomerId == booking.CustomerId.Value && c.DeletedAt == null);
            if (loyaltyCustomer != null)
            {
                earned = loyalty.PointsEarnedFromInvoiceTotal(invoice.TotalAmount);
                if (earned != 0)
                    loyalty.ApplyPointsAndTier(loyaltyCustomer, earned);
            }
        }

        await dbContext.SaveChangesAsync();

        if (earned != 0 && loyaltyCustomer != null)
        {
        }

        return Ok(new
        {
            message = "Xuat hoa don thanh cong.",
            data = invoice,
            loyalty = loyaltyCustomer is null
                ? null
                : new
                {
                    customerId = loyaltyCustomer.CustomerId,
                    pointsEarned = earned,
                    loyaltyCustomer.LoyaltyPoints,
                    loyaltyCustomer.LoyaltyTier
                }
        });
    }
}
