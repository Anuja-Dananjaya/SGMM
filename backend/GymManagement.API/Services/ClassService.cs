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

        public ClassService(AppDbContext context)
        {
            _context = context;
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
                ClassDate = newClass.ClassDate,
                StartTime = newClass.StartTime,
                EndTime = newClass.EndTime,
                Capacity = newClass.Capacity,
                Status = newClass.Status,
                EnrolledCount = 0
            };
        }

        public async Task<bool> BookClassAsync(string userId, int classId)
        {
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
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
            return true;
        }
    }
}