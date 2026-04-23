using HotelManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Data;

public class HotelDbContext(DbContextOptions<HotelDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<AppRole> AppRoles => Set<AppRole>();
    public DbSet<AppUserRole> AppUserRoles => Set<AppUserRole>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Stay> Stays => Set<Stay>();
    public DbSet<ServiceOrder> ServiceOrders => Set<ServiceOrder>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<HotelServiceItem> HotelServices => Set<HotelServiceItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>().ToTable("AppUser", "dbo").HasKey(x => x.UserId);
        modelBuilder.Entity<AppRole>().ToTable("AppRole", "dbo").HasKey(x => x.RoleId);
        modelBuilder.Entity<AppUserRole>().ToTable("AppUserRole", "dbo").HasKey(x => new { x.UserId, x.RoleId });

        modelBuilder.Entity<Hotel>().ToTable("Hotel", "dbo").HasKey(x => x.HotelId);
        modelBuilder.Entity<RoomType>().ToTable("RoomType", "dbo").HasKey(x => x.RoomTypeId);
        modelBuilder.Entity<Room>().ToTable("Room", "dbo").HasKey(x => x.RoomId);
        modelBuilder.Entity<Room>()
            .HasOne(r => r.RoomType)
            .WithMany()
            .HasForeignKey(r => r.RoomTypeId);
        modelBuilder.Entity<Customer>().ToTable("Customer", "dbo").HasKey(x => x.CustomerId);
        modelBuilder.Entity<Booking>().ToTable("Reservation", "dbo").HasKey(x => x.ReservationId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Customer)
            .WithMany()
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Stay>().ToTable("Stay", "dbo").HasKey(x => x.StayId);
        modelBuilder.Entity<ServiceOrder>().ToTable("ServiceOrder", "dbo").HasKey(x => x.ServiceOrderId);

        modelBuilder.Entity<Stay>()
            .HasOne(s => s.Booking)
            .WithOne(b => b.Stay)
            .HasForeignKey<Stay>(s => s.ReservationId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ServiceOrder>()
            .HasOne(o => o.Stay)
            .WithMany(s => s.ServiceOrders)
            .HasForeignKey(o => o.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Invoice>().ToTable("Invoice", "dbo").HasKey(x => x.Id);
        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Booking)
            .WithMany()
            .HasForeignKey(i => i.BookingId);

        modelBuilder.Entity<Payment>().ToTable("Payment", "dbo").HasKey(x => x.PaymentId);
        modelBuilder.Entity<HotelServiceItem>().ToTable("HotelService", "dbo").HasKey(x => x.HotelServiceId);

    }
}
