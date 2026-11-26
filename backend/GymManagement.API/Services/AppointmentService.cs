using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GymManagement.API.Data;
using GymManagement.API.Models;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public class AppointmentService : IAppointmentService
    {
        private readonly AppDbContext _context;

        public AppointmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> BookAppointmentAsync(CreateAppointmentDto dto)
        {
            if (dto.StartTime < DateTime.UtcNow)
            {
                return (false, "Cannot book an appointment in the past.");
            }

            if (dto.EndTime <= dto.StartTime)
            {
                return (false, "End time must be after the start time.");
            }

            // Prevent double booking for the same trainer
            var isDoubleBooked = await _context.Appointments
                .AnyAsync(a => a.TrainerId == dto.TrainerId
                            && a.Status != "Cancelled"
                            && dto.StartTime < a.EndTime
                            && dto.EndTime > a.StartTime);

            if (isDoubleBooked)
            {
                return (false, "The trainer is already booked for this time slot.");
            }

            var appointment = new Appointment
            {
                MemberId = dto.MemberId,
                TrainerId = dto.TrainerId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = "Pending"
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return (true, "Appointment booked successfully.");
        }

        public async Task<IEnumerable<AppointmentResponseDto>> GetAllAppointmentsAsync()
        {
            return await _context.Appointments
                .Include(a => a.Member)
                    .ThenInclude(m => m.User)
                .Include(a => a.Trainer)
                .OrderByDescending(a => a.StartTime)
                .Select(a => new AppointmentResponseDto
                {
                    Id = a.Id,
                    TrainerName = !string.IsNullOrWhiteSpace(a.Trainer.FullName) ? a.Trainer.FullName : (a.Trainer.UserName ?? "Unknown"),
                    MemberName = !string.IsNullOrWhiteSpace(a.Member.User.FullName) ? a.Member.User.FullName : (a.Member.User.UserName ?? "Unknown"),
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status
                }).ToListAsync();
        }

        public async Task<IEnumerable<AppointmentResponseDto>> GetTrainerAppointmentsAsync(string trainerId)
        {
            return await _context.Appointments
                .Include(a => a.Member)
                    .ThenInclude(m => m.User)
                .Include(a => a.Trainer)
                .Where(a => a.TrainerId == trainerId)
                .OrderBy(a => a.StartTime)
                .Select(a => new AppointmentResponseDto
                {
                    Id = a.Id,
                    TrainerName = !string.IsNullOrWhiteSpace(a.Trainer.FullName) ? a.Trainer.FullName : (a.Trainer.UserName ?? "Unknown"),
                    MemberName = !string.IsNullOrWhiteSpace(a.Member.User.FullName) ? a.Member.User.FullName : (a.Member.User.UserName ?? "Unknown"),
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status
                }).ToListAsync();
        }

        public async Task<(bool Success, string Message)> UpdateAppointmentStatusAsync(int appointmentId, string status, string userId, bool isAdminOrStaff = false)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);
            if (appointment == null)
            {
                return (false, "Appointment not found.");
            }

            if (!isAdminOrStaff && appointment.TrainerId != userId)
            {
                return (false, "You are not authorized to update this appointment.");
            }

            var validStatuses = new[] { "Confirmed", "Cancelled", "Completed" };
            if (!validStatuses.Contains(status))
            {
                return (false, "Invalid status update.");
            }

            appointment.Status = status;
            await _context.SaveChangesAsync();

            return (true, $"Appointment {status.ToLower()} successfully.");
        }

        public async Task<IEnumerable<AppointmentResponseDto>> GetMemberAppointmentsAsync(int memberId)
        {
            return await _context.Appointments
                .Include(a => a.Trainer)
                .Include(a => a.Member)
                    .ThenInclude(m => m.User)
                .Where(a => a.MemberId == memberId)
                .OrderByDescending(a => a.StartTime)
                .Select(a => new AppointmentResponseDto
                {
                    Id = a.Id,
                    TrainerName = !string.IsNullOrWhiteSpace(a.Trainer.FullName) ? a.Trainer.FullName : (a.Trainer.UserName ?? "Unknown"),
                    MemberName = !string.IsNullOrWhiteSpace(a.Member.User.FullName) ? a.Member.User.FullName : (a.Member.User.UserName ?? "Unknown"),
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status
                }).ToListAsync();
        }
    }
}
