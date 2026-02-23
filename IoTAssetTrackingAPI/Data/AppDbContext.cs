using IoTAssetTrackingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAssetTrackingAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Device> Devices { get; set; }
        public DbSet<DeviceType> DeviceTypes { get; set; }
        public DbSet<Firmware> Firmwares { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<DeviceGroupLink> DeviceGroupLinks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Tables
            modelBuilder.Entity<Device>().ToTable("Device");
            modelBuilder.Entity<DeviceType>().ToTable("DeviceType");
            modelBuilder.Entity<Firmware>().ToTable("Firmware");
            modelBuilder.Entity<Group>().ToTable("Group");

            // Self-referencing relationship for Groups
            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasOne(g => g.ParentGroup)           
                      .WithMany(g => g.ChildGroups)      
                      .HasForeignKey(g => g.ParentGroupID)
                      .OnDelete(DeleteBehavior.Restrict);  // avoid cascade delete
            });

            // DeviceGroupLink has composite key
            modelBuilder.Entity<DeviceGroupLink>(entity =>
            {
                entity.ToTable("DeviceGroupLink");
                entity.HasKey(dg => new { dg.DeviceID, dg.GroupID });

                entity.HasOne<Device>()
                      .WithMany()
                      .HasForeignKey(dg => dg.DeviceID);

                entity.HasOne<Group>()
                      .WithMany()
                      .HasForeignKey(dg => dg.GroupID);
            });
        }
    }
}