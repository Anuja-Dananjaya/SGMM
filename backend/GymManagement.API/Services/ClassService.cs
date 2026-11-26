using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GymManagement.API.Data;
using GymManagement.API.DTOs;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Services
{
    public class ClassService : IClassService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public ClassService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<GymClassDto>> GetAllClassesAsync()
        {
            return await _context.GymClasses
                .Select(c => new GymClassDto
                {
                    ClassId = c.ClassId,
                    TrainerId = c.TrainerId,
                    ClassName = c.ClassName,
                    Description = c.Description,
                    ClassDate = c.ClassDate,
                    StartTime = c.StartTime,
                    EndTime = c.EndTime,
                    Capacity = c.Capacity,
                    Status = c.Status,
                    EnrolledCount = _context.ClassBookings.Count(b => b.ClassId == c.ClassId && b.Status == "Confirmed")
                }).ToListAsync();
        }

        public async Task<GymClassDto> CreateClassAsync(CreateGymClassDto dto)
        {
            var newClass = new GymClass
            {
                TrainerId = dto.TrainerId,
                ClassName = dto.ClassName,
                Description = dto.Description,
                ClassDate = dto.ClassDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Capacity = dto.Capacity,
                Status = "Active"
            };

            _context.GymClasses.Add(newClass);
            await _context.SaveChangesAsync();

            return new GymClassDto
            {
                ClassId = newClass.ClassId,
                TrainerId = newClass.TrainerId,
                ClassName = newClass.ClassName,
                Description = newClass.Description,
                ClassDate = newClass.ClassDate,
                StartTime = newClass.StartTime,
                EndTime = newClass.EndTime,
                Capacity = newClass.Capacity,
                Status = newClass.Status,
                EnrolledCount = 0
            };
        }

        public async Task<(bool Success, string Message)> UpdateClassAsync(int classId, UpdateGymClassDto dto)
        {
            var gymClass = await _context.GymClasses.FindAsync(classId);
            if (gymClass == null) return (false, "Class not found.");

            if (dto.EndTime <= dto.StartTime)
                return (false, "End time must be after start time.");

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();
            if (status != "Active" && status != "Cancelled")
                return (false, "Status must be Active or Cancelled.");

            var enrolledCount = await _context.ClassBookings
                .CountAsync(b => b.ClassId == classId && b.Status == "Confirmed");

            if (dto.Capacity < enrolledCount)
                return (false, $"Capacity cannot be lower than the {enrolledCount} confirmed bookings.");

            gymClass.TrainerId = dto.TrainerId;
            gymClass.ClassName = dto.ClassName.Trim();
            gymClass.Description = dto.Description?.Trim();
            gymClass.ClassDate = dto.ClassDate;
            gymClass.StartTime = dto.StartTime;
            gymClass.EndTime = dto.EndTime;
            gymClass.Capacity = dto.Capacity;
            gymClass.Status = status;

            await _context.SaveChangesAsync();
            return (true, "Class updated successfully.");
        }

        public async Task<(bool Success, string Message)> DeleteClassAsync(int classId)
        {
            var gymClass = await _context.GymClasses.FindAsync(classId);
            if (gymClass == null) return (false, "Class not found.");

            var hasConfirmedBookings = await _context.ClassBookings
                .AnyAsync(b => b.ClassId == classId && b.Status == "Confirmed");

            if (hasConfirmedBookings)
                return (false, "Cannot delete a class that has confirmed bookings. Cancel bookings first or set status to Cancelled.");

            var oldBookings = await _context.ClassBookings
                .Where(b => b.ClassId == classId)
                .ToListAsync();
            if (oldBookings.Any())
            {
                _context.ClassBookings.RemoveRange(oldBookings);
            }

            _context.GymClasses.Remove(gymClass);
            await _context.SaveChangesAsync();
            return (true, "Class deleted successfully.");
        }

        public async Task<bool> BookClassAsync(string userId, int classId)
        {
            var member = await _context.Members
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) throw new InvalidOperationException("Member profile not found.");

            var gymClass = await _context.GymClasses.FindAsync(classId);
            if (gymClass == null || gymClass.Status != "Active") return false;

            var enrolledCount = await _context.ClassBookings.CountAsync(b => b.ClassId == classId && b.Status == "Confirmed");
            if (enrolledCount >= gymClass.Capacity) throw new InvalidOperationException("Class capacity is full.");

            var alreadyBooked = await _context.ClassBookings.AnyAsync(b => b.ClassId == classId && b.MemberId == member.Id && b.Status == "Confirmed");
            if (alreadyBooked) throw new InvalidOperationException("You have already booked this class.");

            var booking = new ClassBooking
            {
                MemberId = member.Id,
                ClassId = classId,
                BookingDate = DateTime.UtcNow,
                Status = "Confirmed"
            };

            _context.ClassBookings.Add(booking);
            await _context.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(member.User?.Email))
                {
                    await _notificationService.SendBookingConfirmationAsync(
                        member.User.FullName,
                        member.User.Email,
                        gymClass.ClassName,
                        gymClass.ClassDate,
                        gymClass.StartTime);
                }
            }
            catch
            {
                // Email/notification logging should never fail the class booking itself.
            }

            return true;
        }

        private static bool IsCancellable(string bookingStatus, DateTime classDate, TimeSpan startTime)
        {
            return bookingStatus == "Confirmed" && classDate.Date + startTime > DateTime.Now;
        }

        public async Task<IEnumerable<ClassBookingDto>> GetMyBookingsAsync(string userId)
        {
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return new List<ClassBookingDto>();

            var rows = await _context.ClassBookings
                .Where(b => b.MemberId == member.Id)
                .Join(_context.GymClasses, b => b.ClassId, c => c.ClassId, (b, c) => new { b, c })
                .OrderByDescending(x => x.c.ClassDate)
                .ThenByDescending(x => x.c.StartTime)
                .ToListAsync();

            return rows.Select(x => new ClassBookingDto
            {
                BookingId = x.b.BookingId,
                ClassId = x.c.ClassId,
                ClassName = x.c.ClassName,
                ClassDate = x.c.ClassDate,
                StartTime = x.c.StartTime,
                EndTime = x.c.EndTime,
                BookingDate = x.b.BookingDate,
                Status = x.b.Status,
                CanCancel = IsCancellable(x.b.Status, x.c.ClassDate, x.c.StartTime)
            }).ToList();
        }

        public async Task<IEnumerable<ClassBookingDto>> GetClassBookingsAsync(int classId)
        {
            var rows = await (
                from b in _context.ClassBookings
                where b.ClassId == classId
                join c in _context.GymClasses on b.ClassId equals c.ClassId
                join m in _context.Members on b.MemberId equals m.Id
                join u in _context.Users on m.UserId equals u.Id
                orderby b.BookingDate
                select new { b, c, u }
            ).ToListAsync();

            return rows.Select(x => new ClassBookingDto
            {
                BookingId = x.b.BookingId,
                ClassId = x.c.ClassId,
                ClassName = x.c.ClassName,
                ClassDate = x.c.ClassDate,
                StartTime = x.c.StartTime,
                EndTime = x.c.EndTime,
                BookingDate = x.b.BookingDate,
                Status = x.b.Status,
                CanCancel = x.b.Status == "Confirmed",
                MemberName = x.u.FullName,
                MemberEmail = x.u.Email
            }).ToList();
        }

        public async Task<(bool Success, string Message)> CancelBookingAsync(int bookingId, string userId, bool isStaff)
        {
            var booking = await _context.ClassBookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (booking == null) return (false, "Booking not found.");

            var gymClass = await _context.GymClasses.FindAsync(booking.ClassId);
            if (gymClass == null) return (false, "Class not found.");

            if (booking.Status != "Confirmed") return (false, "This booking is already cancelled.");

            if (!isStaff)
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
                if (member == null || booking.MemberId != member.Id) return (false, "Booking not found.");

                if (!IsCancellable(booking.Status, gymClass.ClassDate, gymClass.StartTime))
                    return (false, "This class has already started, so the booking can no longer be cancelled.");
            }

            booking.Status = "Cancelled";
            await _context.SaveChangesAsync();
            return (true, "Booking cancelled.");
        }
    }
}