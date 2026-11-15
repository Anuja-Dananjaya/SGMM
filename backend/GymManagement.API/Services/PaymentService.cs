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
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;

        public PaymentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto dto)
        {
           var member = await _context.Members
            .Include(m => m.MembershipPlan)
            .FirstOrDefaultAsync(m => m.Id == dto.MemberId);

            if (member == null) throw new InvalidOperationException("Member not found.");

            // 2. Record the transaction
            var payment = new Payment
            {
                MemberId = dto.MemberId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                PaymentDate = DateTime.UtcNow,
                Status = "Completed"
            };
            _context.Payments.Add(payment);

            // 3. Extend the dates based on their EXACT plan duration
            var now = DateTime.UtcNow;
            var currentEndDate = member.EndDate;

            // If they are overdue, the new cycle starts today. If paying early, append to existing time.
            var newStartDate = currentEndDate < now ? now : currentEndDate;

            member.StartDate = newStartDate;

            // Add the precise duration defined in their MembershipPlan (e.g. 1, 3, 6, 12 months)
            member.EndDate = newStartDate.AddMonths(member.MembershipPlan.DurationInMonths);

            _context.Members.Update(member);
            await _context.SaveChangesAsync();

            return new PaymentDto
            {
                PaymentId = payment.PaymentId,
                MemberId = payment.MemberId,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status
            };
        }

        public async Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync(DateTime? startDate = null, DateTime? endDate = null, int? memberId = null)
    {
    // 1. Start with the base query
    var query = _context.Payments.AsQueryable();

    // 2. Apply Member Filter if provided
    if (memberId.HasValue && memberId.Value > 0)
    {
        query = query.Where(p => p.MemberId == memberId.Value);
    }

    // 3. Apply Start Date Filter if provided
    if (startDate.HasValue)
    {
        query = query.Where(p => p.PaymentDate >= startDate.Value.Date);
    }

    // 4. Apply End Date Filter if provided
    if (endDate.HasValue)
    {
        // Add 1 day and subtract a tick to include the entire end day (up to 23:59:59)
        var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
        query = query.Where(p => p.PaymentDate <= endOfDay);
    }

    // 5. Execute and map to DTO
    return await query
        .OrderByDescending(p => p.PaymentDate)
        .Select(p => new PaymentDto
        {
            PaymentId = p.PaymentId,
            MemberId = p.MemberId,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate,
            PaymentMethod = p.PaymentMethod,
            Status = p.Status
        }).ToListAsync();
}

        public async Task<IEnumerable<PaymentDto>> GetMemberPaymentsAsync(string userId)
        {
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) throw new InvalidOperationException("Member not found.");

            return await _context.Payments
                .Where(p => p.MemberId == member.Id)
                .OrderByDescending(p => p.PaymentDate)
                .Select(p => new PaymentDto
                {
                    PaymentId = p.PaymentId,
                    MemberId = p.MemberId,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status
                }).ToListAsync();
        }
    }
}