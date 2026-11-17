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

        public async Task<MemberProfileDto?> GetMemberProfileAsync(string userId)
        {
            var member = await _context.Members
                .Include(m => m.MembershipPlan)
                .Include(m => m.User) 
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null) return null;

            return new MemberProfileDto
            {
                Id = member.Id,
                FullName = member.User.UserName ?? "Unknown",
                Email = member.User.Email ?? "",
                PlanName = member.MembershipPlan?.Name ?? "No Plan",
                StartDate = member.StartDate,
                EndDate = member.EndDate,
                IsActive = member.IsActive,
                QRCodeContent = member.QRCodeContent ?? ""
            };
        }
    }
}