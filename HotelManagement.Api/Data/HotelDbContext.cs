using HotelManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Api.Data;

public class HotelDbContext(DbContextOptions<HotelDbContext> options) : DbContext(options)
{
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>().HasData(
            new Room { Id = 1, RoomNumber = "101", RoomType = "Standard", PricePerNight = 500000 },
            new Room { Id = 2, RoomNumber = "102", RoomType = "Deluxe", PricePerNight = 800000 },
            new Room { Id = 3, RoomNumber = "201", RoomType = "Suite", PricePerNight = 1500000 }
        );
    }
}
