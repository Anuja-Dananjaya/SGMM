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
                    PlanName = m.MembershipPlan.Name,
                    StartDate = m.StartDate,
                    EndDate = m.EndDate,
                    IsActive = m.EndDate > DateTime.UtcNow && m.IsActive, // Auto-flag as inactive if expired
                    QRCodeContent = m.QRCodeContent
                })
                .ToListAsync();

            return members;
        }
    }
}