using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GymManagement.API.Models;

namespace GymManagement.API.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<MembershipPlan> MembershipPlans { get; set; }
        public DbSet<Member> Members { get; set; }
        public DbSet<CheckInRecord> CheckInRecords { get; set; }
        public DbSet<Trainer> Trainers { get; set; }
        public DbSet<GymClass> GymClasses { get; set; }
        public DbSet<ClassBooking> ClassBookings { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        public DbSet<WorkoutDay> WorkoutDays { get; set; }
        public DbSet<WorkoutExercise> WorkoutExercises { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<WorkoutPlan>()
                .HasMany(wp => wp.WorkoutDays)
                .WithOne(wd => wd.WorkoutPlan)
                .HasForeignKey(wd => wd.WorkoutPlanId)
                .OnDelete(DeleteBehavior.Cascade);

            // FIX: Removed the invalid .Exercises line and added .WithOne
            builder.Entity<WorkoutDay>()
                .HasMany(d => d.WorkoutExercises)
                .WithOne(e => e.WorkoutDay)
                .HasForeignKey(we => we.WorkoutDayId)
                .OnDelete(DeleteBehavior.Cascade);
       }
    }
}