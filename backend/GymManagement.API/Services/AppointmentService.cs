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
            // 1. RULE: Cannot book in the past
            // Using DateTime.UtcNow. If your app sends local Sri Lanka time, ensure you are comparing apples to apples.
            if (dto.StartTime < DateTime.UtcNow)
            {
                return (false, "Cannot book an appointment in the past.");
            }

            // 2. RULE: End time must be after start time
            if (dto.EndTime <= dto.StartTime)
            {
                return (false, "End time must be after the start time.");
            }

            // 3. RULE: Prevent Double Booking
            // Checks if the Trainer already has a non-cancelled appointment that overlaps with this time
            var isDoubleBooked = await _context.Appointments
                .AnyAsync(a => a.TrainerId == dto.TrainerId 
                            && a.Status != "Cancelled" 
                            && dto.StartTime < a.EndTime 
                            && dto.EndTime > a.StartTime);

            if (isDoubleBooked)
            {
                return (false, "The trainer is already booked for this time slot.");
            }

            // 4. Save the valid appointment
            var appointment = new Appointment
            {
                MemberId = dto.MemberId,
                TrainerId = dto.TrainerId,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = "Pending" // Trainer must approve it later
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return (true, "Appointment booked successfully.");
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
                    TrainerName = a.Trainer.UserName ?? "Unknown",
                    MemberName = a.Member.User.UserName ?? "Unknown",
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status
                }).ToListAsync();
        }


         public async Task<(bool Success, string Message)> UpdateAppointmentStatusAsync(int appointmentId, string status, string trainerId)
        {
            var appointment = await _context.Appointments.FindAsync(appointmentId);

            if (appointment == null)
            {
                return (false, "Appointment not found.");
            }

            // Security: Ensure the trainer modifying the appointment is the one assigned to it
            if (appointment.TrainerId != trainerId)
            {
                return (false, "You are not authorized to update this appointment.");
            }

            // Validate status
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
                    TrainerName = a.Trainer.UserName ?? "Unknown",
                    MemberName = a.Member.User.UserName ?? "Unknown",
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    Status = a.Status
                }).ToListAsync();
        }
    }
}