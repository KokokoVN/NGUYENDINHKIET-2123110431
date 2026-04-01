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
    public DbSet<HotelService> HotelServices => Set<HotelService>();
    public DbSet<BookingServiceUsage> BookingServiceUsages => Set<BookingServiceUsage>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>().ToTable("AppUser", "dbo").HasKey(x => x.UserId);
        modelBuilder.Entity<AppRole>().ToTable("AppRole", "dbo").HasKey(x => x.RoleId);
        modelBuilder.Entity<AppUserRole>().ToTable("AppUserRole", "dbo").HasKey(x => new { x.UserId, x.RoleId });

        modelBuilder.Entity<Hotel>().ToTable("Hotel", "dbo").HasKey(x => x.HotelId);
        modelBuilder.Entity<RoomType>().ToTable("RoomType", "dbo").HasKey(x => x.RoomTypeId);
        modelBuilder.Entity<Room>().ToTable("Room", "dbo").HasKey(x => x.RoomId);
        modelBuilder.Entity<Customer>().ToTable("Customer", "dbo").HasKey(x => x.CustomerId);
        modelBuilder.Entity<Booking>().ToTable("Reservation", "dbo").HasKey(x => x.ReservationId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Customer)
            .WithMany()
            .HasForeignKey(b => b.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<BookingServiceUsage>()
            .HasOne(s => s.Booking)
            .WithMany(b => b.ServiceUsages)
            .HasForeignKey(s => s.BookingId);

        modelBuilder.Entity<BookingServiceUsage>()
            .HasOne(s => s.HotelService)
            .WithMany()
            .HasForeignKey(s => s.HotelServiceId);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Booking)
            .WithMany()
            .HasForeignKey(i => i.BookingId);
    }
}
