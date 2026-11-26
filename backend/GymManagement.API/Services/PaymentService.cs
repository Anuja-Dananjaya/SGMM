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

        private static void ExtendMembership(Member member)
        {
            var now = DateTime.UtcNow;
            var stillRunning = member.IsActive && member.EndDate > now;
            var baseDate = stillRunning ? member.EndDate : now;

            if (!stillRunning) member.StartDate = now;
            member.EndDate = baseDate.AddMonths(member.MembershipPlan.DurationInMonths);
            member.IsActive = true;
        }

        public async Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto dto)
        {
            var member = await _context.Members
                .Include(m => m.User)
                .Include(m => m.MembershipPlan)
                .FirstOrDefaultAsync(m => m.Id == dto.MemberId);

            if (member == null) throw new InvalidOperationException("Member not found.");
            if (dto.Amount <= 0) throw new InvalidOperationException("Amount must be greater than zero.");

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Completed" : dto.Status.Trim();
            if (status != "Completed" && status != "Pending")
                throw new InvalidOperationException("Status must be either Completed or Pending.");

            var payment = new Payment
            {
                MemberId = dto.MemberId,
                Amount = dto.Amount,
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "Cash" : dto.PaymentMethod.Trim(),
                PaymentDate = DateTime.UtcNow,
                Status = status
            };
            _context.Payments.Add(payment);

            // Only extend active membership dates once the payment is actually completed.
            if (status == "Completed")
            {
                ExtendMembership(member);
                _context.Members.Update(member);
            }

            await _context.SaveChangesAsync();

            return new PaymentDto
            {
                PaymentId = payment.PaymentId,
                MemberId = payment.MemberId,
                MemberName = member.User.FullName,
                MemberEmail = member.User.Email,
                PlanName = member.MembershipPlan?.Name ?? "Gym Membership",
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status
            };
        }

        public async Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync(
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? memberId = null,
            string? status = null)
        {
            var query = from p in _context.Payments
                        join m in _context.Members on p.MemberId equals m.Id into mj
                        from m in mj.DefaultIfEmpty()
                        join u in _context.Users on m.UserId equals u.Id into uj
                        from u in uj.DefaultIfEmpty()
                        join plan in _context.MembershipPlans on m.MembershipPlanId equals plan.Id into pj
                        from plan in pj.DefaultIfEmpty()
                        select new { p, m, u, plan };

            if (memberId.HasValue && memberId.Value > 0)
            {
                query = query.Where(x => x.p.MemberId == memberId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(x => x.p.PaymentDate >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(x => x.p.PaymentDate <= endOfDay);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var s = status.Trim();
                query = query.Where(x => x.p.Status == s);
            }

            return await query
                .OrderByDescending(x => x.p.PaymentDate)
                .Select(x => new PaymentDto
                {
                    PaymentId = x.p.PaymentId,
                    MemberId = x.p.MemberId,
                    MemberName = x.u != null ? x.u.FullName : $"Member #{x.p.MemberId}",
                    MemberEmail = x.u != null ? x.u.Email : "",
                    PlanName = x.plan != null ? x.plan.Name : "Gym Membership",
                    Amount = x.p.Amount,
                    PaymentDate = x.p.PaymentDate,
                    PaymentMethod = x.p.PaymentMethod,
                    Status = x.p.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<PaymentDto>> GetMemberPaymentsAsync(string userId)
        {
            var memberRows = await _context.Members
                .Include(m => m.MembershipPlan)
                .Where(m => m.UserId == userId)
                .ToListAsync();

            if (!memberRows.Any()) return new List<PaymentDto>();

            var planByMemberId = memberRows.ToDictionary(m => m.Id, m => m.MembershipPlan?.Name ?? "Gym Membership");
            var ids = planByMemberId.Keys.ToList();

            var payments = await _context.Payments
                .Where(p => ids.Contains(p.MemberId))
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return payments.Select(p => new PaymentDto
            {
                PaymentId = p.PaymentId,
                MemberId = p.MemberId,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                Status = p.Status,
                PlanName = planByMemberId.TryGetValue(p.MemberId, out var planName) ? planName : "Gym Membership"
            }).ToList();
        }

        public async Task<(bool Success, string Message)> UpdatePaymentStatusAsync(int paymentId, UpdatePaymentStatusDto dto)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null) return (false, "Payment record not found.");

            var newStatus = dto.Status?.Trim();
            if (newStatus != "Completed" && newStatus != "Pending" && newStatus != "Refunded")
                return (false, "Status must be Completed, Pending, or Refunded.");

            var wasPending = payment.Status == "Pending";
            payment.Status = newStatus;

            if (!string.IsNullOrWhiteSpace(dto.PaymentMethod))
            {
                payment.PaymentMethod = dto.PaymentMethod.Trim();
            }

            if (wasPending && newStatus == "Completed")
            {
                var member = await _context.Members
                    .Include(m => m.MembershipPlan)
                    .FirstOrDefaultAsync(m => m.Id == payment.MemberId);

                if (member != null && member.MembershipPlan != null)
                {
                    ExtendMembership(member);
                    _context.Members.Update(member);
                }
            }

            await _context.SaveChangesAsync();
            return (true, wasPending && newStatus == "Completed"
                ? "Payment marked as Completed and membership extended."
                : $"Payment status updated to {newStatus}.");
        }
    }
}
