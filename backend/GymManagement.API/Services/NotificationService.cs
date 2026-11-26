using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GymManagement.API.Data;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        // Admin & Staff: view all notifications and summary counts
        public async Task<object> GetNotificationsSummaryAsync()
        {
            var today = DateTime.UtcNow.Date;
            var logs = await _context.NotificationLogs
                .OrderByDescending(n => n.SentAt)
                .Take(100)
                .ToListAsync();

            return new
            {
                summary = new
                {
                    sentToday = logs.Count(l => l.SentAt.Date == today),
                    expirySent = logs.Count(l => l.Type == "Expiry Reminder"),
                    bookingConfirmations = logs.Count(l => l.Type == "Booking Confirmation"),
                    paymentReminders = logs.Count(l => l.Type == "Payment Reminder"),
                },
                logs = logs.Select(l => new
                {
                    l.Id,
                    l.RecipientName,
                    l.RecipientEmail,
                    l.Type,
                    l.Subject,
                    l.MessageBody,
                    l.SentAt,
                    l.Status
                }).ToList()
            };
        }

        // Member (Mobile App): view notifications sent to this member
        public async Task<object> GetMemberNotificationsAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
                return new List<object>();

            var email = user.Email.ToLower();

            return await _context.NotificationLogs
                .Where(n => n.RecipientEmail.ToLower() == email)
                .OrderByDescending(n => n.SentAt)
                .Take(50)
                .Select(n => new
                {
                    n.Id,
                    n.Type,
                    n.Subject,
                    n.MessageBody,
                    n.SentAt,
                    n.Status
                })
                .ToListAsync();
        }

        // Runs automatically every day (and when Admin/Staff clicks "Run Scheduled Reminders Now")
        public async Task<object> RunScheduledRemindersAsync()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var sevenDaysAhead = now.AddDays(7);

            // Prevent sending the same reminder twice on the same day
            var alreadySentToday = await _context.NotificationLogs
                .Where(n => n.SentAt >= today)
                .Select(n => new { n.RecipientEmail, n.Type })
                .ToListAsync();

            var sentSet = alreadySentToday
                .Select(x => $"{x.RecipientEmail.ToLower()}|{x.Type}")
                .ToHashSet();

            int expiryCount = 0;
            int paymentCount = 0;

            // 1. Membership Expiry Reminders (active memberships expiring within 7 days)
            var expiringMembers = await _context.Members
                .Include(m => m.User)
                .Include(m => m.MembershipPlan)
                .Where(m => m.IsActive && m.EndDate > now && m.EndDate <= sevenDaysAhead)
                .ToListAsync();

            foreach (var m in expiringMembers)
            {
                var email = m.User?.Email;
                if (string.IsNullOrWhiteSpace(email)) continue;

                var key = $"{email.ToLower()}|Expiry Reminder";
                if (sentSet.Contains(key)) continue;

                var daysLeft = Math.Max(0, (int)Math.Ceiling((m.EndDate - now).TotalDays));
                var subject = daysLeft <= 1
                    ? $"Your {m.MembershipPlan.Name} membership expires tomorrow"
                    : $"Your {m.MembershipPlan.Name} membership expires in {daysLeft} days";
                var body = $"Hi {m.User!.FullName}, your {m.MembershipPlan.Name} membership expires on {m.EndDate:dd MMM yyyy}. Please visit the front desk to renew.";

                _context.NotificationLogs.Add(new NotificationLog
                {
                    RecipientName = m.User.FullName,
                    RecipientEmail = email,
                    Type = "Expiry Reminder",
                    Subject = subject,
                    MessageBody = body,
                    SentAt = DateTime.UtcNow,
                    Status = "Sent"
                });

                sentSet.Add(key);
                expiryCount++;
            }

            // 2. Payment Reminders (Pending payments)
            var pendingPayments = await (
                from p in _context.Payments
                where p.Status == "Pending"
                join m in _context.Members on p.MemberId equals m.Id
                join u in _context.Users on m.UserId equals u.Id
                join plan in _context.MembershipPlans on m.MembershipPlanId equals plan.Id
                select new { p, u, plan }
            ).ToListAsync();

            foreach (var item in pendingPayments)
            {
                var email = item.u.Email;
                if (string.IsNullOrWhiteSpace(email)) continue;

                var key = $"{email.ToLower()}|Payment Reminder";
                if (sentSet.Contains(key)) continue;

                var subject = $"Pending payment: LKR {item.p.Amount:N2} for {item.plan.Name}";
                var body = $"Hi {item.u.FullName}, you have a pending payment of LKR {item.p.Amount:N2} for {item.plan.Name}. Please settle it at the front desk.";

                _context.NotificationLogs.Add(new NotificationLog
                {
                    RecipientName = item.u.FullName,
                    RecipientEmail = email,
                    Type = "Payment Reminder",
                    Subject = subject,
                    MessageBody = body,
                    SentAt = DateTime.UtcNow,
                    Status = "Sent"
                });

                sentSet.Add(key);
                paymentCount++;
            }

            await _context.SaveChangesAsync();

            return new
            {
                expirySent = expiryCount,
                paymentSent = paymentCount,
                totalProcessed = expiryCount + paymentCount,
                message = (expiryCount + paymentCount) > 0
                    ? $"Sent {expiryCount + paymentCount} notification(s) ({expiryCount} expiry, {paymentCount} payment)."
                    : "No new reminders due right now."
            };
        }

        // Called automatically when a member books a class
        public async Task SendBookingConfirmationAsync(string memberName, string memberEmail, string className, DateTime classDate, TimeSpan startTime)
        {
            if (string.IsNullOrWhiteSpace(memberEmail)) return;

            var subject = $"Class Booking Confirmed: {className} ({classDate:dd MMM})";
            var body = $"Hi {memberName}, your booking for {className} on {classDate:dd MMM yyyy} at {startTime:hh\\:mm} is confirmed.";

            _context.NotificationLogs.Add(new NotificationLog
            {
                RecipientName = memberName,
                RecipientEmail = memberEmail,
                Type = "Booking Confirmation",
                Subject = subject,
                MessageBody = body,
                SentAt = DateTime.UtcNow,
                Status = "Sent"
            });

            await _context.SaveChangesAsync();
        }

        public async Task<(bool Success, string Message)> ResendNotificationAsync(int logId)
        {
            var log = await _context.NotificationLogs.FindAsync(logId);
            if (log == null) return (false, "Notification not found.");

            log.SentAt = DateTime.UtcNow;
            log.Status = "Sent";
            await _context.SaveChangesAsync();

            return (true, $"Notification resent to {log.RecipientName}.");
        }
    }
}
