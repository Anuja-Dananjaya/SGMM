using GymManagement.API.Data;
using GymManagement.API.Dtos;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public class MemberService : IMemberService
    {
        private readonly AppDbContext _context;

        public MemberService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<MemberResponseDto?> AssignMembershipAsync(AssignMembershipDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            var plan = await _context.MembershipPlans.FindAsync(dto.MembershipPlanId);

            if (user == null || plan == null) return null;

            var startDate = DateTime.UtcNow;
            
            var member = new Member
            {
                UserId = dto.UserId,
                MembershipPlanId = dto.MembershipPlanId,
                StartDate = startDate,
                EndDate = startDate.AddMonths(plan.DurationInMonths),
                IsActive = true,
                QRCodeContent = Guid.NewGuid().ToString() // Unique ID for mobile check-in
            };

            _context.Members.Add(member);
            await _context.SaveChangesAsync();

            return new MemberResponseDto
            {
                Id = member.Id,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email!,
                MembershipPlanId = plan.Id,
                PlanName = plan.Name,
                StartDate = member.StartDate,
                EndDate = member.EndDate,
                IsActive = member.IsActive,
                QRCodeContent = member.QRCodeContent
            };
        }

        public async Task<IEnumerable<MemberResponseDto>> GetAllMembersAsync()
        {
            var members = await _context.Members
                .Include(m => m.User)
                .Include(m => m.MembershipPlan)
                .Select(m => new MemberResponseDto
                {
                    Id = m.Id,
                    UserId = m.UserId,
                    FullName = m.User.FullName,
                    Email = m.User.Email!,
                    MembershipPlanId = m.MembershipPlanId,
                    PlanName = m.MembershipPlan.Name,
                    StartDate = m.StartDate,
                    EndDate = m.EndDate,
                    IsActive = m.EndDate > DateTime.UtcNow && m.IsActive, // Auto-flag as inactive if expired
                    QRCodeContent = m.QRCodeContent
                })
                .ToListAsync();

            return members;
        }

        public async Task<bool> CancelMembershipAsync(int memberId)
        {
            var member = await _context.Members.FindAsync(memberId);
            if (member == null) return false;

            member.IsActive = false;
            member.EndDate = DateTime.UtcNow; // Expire it immediately
            
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<(bool Success, string Message)> UpdateMembershipAsync(int memberId, UpdateMembershipDto dto)
        {
            var member = await _context.Members.FindAsync(memberId);
            if (member == null) return (false, "Membership record not found.");

            var plan = await _context.MembershipPlans.FindAsync(dto.MembershipPlanId);
            if (plan == null) return (false, "Membership plan not found.");

            if (dto.EndDate <= dto.StartDate) return (false, "End date must be after the start date.");

            member.MembershipPlanId = dto.MembershipPlanId;
            member.StartDate = dto.StartDate;
            member.EndDate = dto.EndDate;
            member.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return (true, "Membership updated successfully.");
        }

        public async Task<(bool Success, string Message)> RenewMembershipAsync(int memberId)
        {
            var member = await _context.Members
                .Include(m => m.MembershipPlan)
                .FirstOrDefaultAsync(m => m.Id == memberId);
            if (member == null) return (false, "Membership record not found.");

            var now = DateTime.UtcNow;

            // Still running: extend from the current end date so no paid days are lost.
            // Already expired/cancelled: start a fresh period from today.
            var stillRunning = member.IsActive && member.EndDate > now;
            var baseDate = stillRunning ? member.EndDate : now;

            if (!stillRunning) member.StartDate = now;
            member.EndDate = baseDate.AddMonths(member.MembershipPlan.DurationInMonths);
            member.IsActive = true;

            await _context.SaveChangesAsync();
            return (true, $"Membership renewed until {member.EndDate:d}.");
        }

        public async Task<MemberProfileDto?> GetMemberProfileAsync(string userId)
        {
            var records = await _context.Members
                .Include(m => m.MembershipPlan)
                .Include(m => m.User)
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.EndDate)
                .ToListAsync();

            var latest = records.FirstOrDefault();
            if (latest == null) return null;

            var now = DateTime.UtcNow;

            return new MemberProfileDto
            {
                Id = latest.Id,
                FullName = !string.IsNullOrWhiteSpace(latest.User.FullName)
                    ? latest.User.FullName
                    : (latest.User.UserName ?? "Unknown"),
                Email = latest.User.Email ?? "",
                Phone = latest.User.PhoneNumber ?? "",
                PlanName = latest.MembershipPlan?.Name ?? "No Plan",
                PlanPrice = latest.MembershipPlan?.Price ?? 0,
                StartDate = latest.StartDate,
                EndDate = latest.EndDate,
                IsActive = latest.IsActive && latest.EndDate > now,
                QRCodeContent = latest.QRCodeContent ?? "",
                MembershipHistory = records.Select(r => new MembershipHistoryItemDto
                {
                    Id = r.Id,
                    PlanName = r.MembershipPlan?.Name ?? "Unknown Plan",
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    IsActive = r.IsActive && r.EndDate > now
                }).ToList()
            };
        }

        public async Task<(bool Success, string Message)> UpdateMyProfileAsync(string userId, UpdateMyProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (false, "User account not found.");

            if (string.IsNullOrWhiteSpace(dto.FullName))
                return (false, "Full name is required.");

            user.FullName = dto.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();

            await _context.SaveChangesAsync();
            return (true, "Profile updated successfully.");
        }
    }
}