using System;
using System.Linq;
using System.Threading.Tasks;
using GymManagement.API.Data;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetDashboardAsync()
        {
            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var sevenDaysAgo = todayStart.AddDays(-6);
            var sevenDaysAhead = now.AddDays(7);
            var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var members = await _context.Members
                .Include(m => m.User)
                .Include(m => m.MembershipPlan)
                .ToListAsync();

            var activeMembers = members.Where(m => m.IsActive && m.EndDate > now).ToList();
            var expiringSoon = activeMembers
                .Where(m => m.EndDate <= sevenDaysAhead)
                .OrderBy(m => m.EndDate)
                .Take(6)
                .Select(m => new
                {
                    id = m.Id,
                    name = m.User.FullName,
                    plan = m.MembershipPlan.Name,
                    expiry = m.EndDate,
                    daysLeft = Math.Max(0, (int)Math.Ceiling((m.EndDate - now).TotalDays))
                })
                .ToList();

            var recentCheckIns = await _context.CheckInRecords
                .Where(c => c.CheckInTime >= sevenDaysAgo)
                .ToListAsync();

            var todayAttendance = recentCheckIns.Count(c => c.CheckInTime.Date == todayStart);

            var weeklyCounts = Enumerable.Range(0, 7).Select(offset =>
            {
                var date = sevenDaysAgo.AddDays(offset);
                var count = recentCheckIns.Count(c => c.CheckInTime.Date == date);
                return new
                {
                    day = date == todayStart ? $"{date:dddd} (Today)" : date.ToString("dddd"),
                    date = date.ToString("yyyy-MM-dd"),
                    count
                };
            }).ToList();

            var maxDaily = Math.Max(1, weeklyCounts.Max(x => x.count));
            var weeklyAttendance = weeklyCounts.Select(x => new
            {
                x.day,
                x.date,
                x.count,
                pct = (int)Math.Round(x.count * 100.0 / maxDaily)
            }).ToList();

            var completedPaymentsThisMonth = await _context.Payments
                .Where(p => p.Status == "Completed" && p.PaymentDate >= monthStart)
                .ToListAsync();

            var monthlyRevenue = completedPaymentsThisMonth.Sum(p => p.Amount);

            var allCompletedPayments = await _context.Payments
                .Where(p => p.Status == "Completed")
                .ToListAsync();

            var memberPlanMap = members.ToDictionary(m => m.Id, m => m.MembershipPlan.Name);
            var totalCompletedRevenue = allCompletedPayments.Sum(p => p.Amount);

            var revenueByPlan = allCompletedPayments
                .GroupBy(p => memberPlanMap.TryGetValue(p.MemberId, out var planName) ? planName : "Other")
                .Select(g => new
                {
                    plan = g.Key,
                    transactions = g.Count(),
                    amount = g.Sum(p => p.Amount),
                    pct = totalCompletedRevenue > 0 ? (int)Math.Round((double)(g.Sum(p => p.Amount) / totalCompletedRevenue) * 100) : 0
                })
                .OrderByDescending(x => x.amount)
                .ToList();

            var activeClasses = await _context.GymClasses
                .Where(c => c.Status == "Active")
                .ToListAsync();

            var confirmedBookings = await _context.ClassBookings
                .Where(b => b.Status == "Confirmed")
                .ToListAsync();

            var weeklyBookings = confirmedBookings.Count(b => b.BookingDate >= sevenDaysAgo);

            var upcomingClasses = activeClasses
                .Where(c => c.ClassDate.Date >= todayStart)
                .OrderBy(c => c.ClassDate).ThenBy(c => c.StartTime)
                .Take(5)
                .Select(c =>
                {
                    var enrolled = confirmedBookings.Count(b => b.ClassId == c.ClassId);
                    return new
                    {
                        id = $"cls-{c.ClassId}",
                        title = c.ClassName,
                        subtitle = $"{c.ClassDate:dd MMM} · Class",
                        time = $"{c.StartTime:hh\\:mm} – {c.EndTime:hh\\:mm}",
                        info = enrolled >= c.Capacity ? $"{enrolled} / {c.Capacity} Full" : $"{enrolled} / {c.Capacity} Booked",
                        isFull = enrolled >= c.Capacity
                    };
                })
                .ToList();

            return new
            {
                activeMemberships = activeMembers.Count,
                totalMembers = members.Count,
                expiringSoonCount = activeMembers.Count(m => m.EndDate <= sevenDaysAhead),
                todayAttendance,
                weeklyCheckInsTotal = recentCheckIns.Count,
                weeklyClassBookings = weeklyBookings,
                activeClassesCount = activeClasses.Count,
                monthlyRevenue,
                weeklyAttendance,
                revenueByPlan,
                expiringSoon,
                upcomingSchedule = upcomingClasses
            };
        }

        public async Task<object> GetMembershipReportAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.Members
                .Include(m => m.User)
                .Include(m => m.MembershipPlan)
                .AsQueryable();

            if (fromDate.HasValue) query = query.Where(m => m.StartDate >= fromDate.Value.Date);
            if (toDate.HasValue)
            {
                var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(m => m.StartDate <= endOfDay);
            }

            var list = await query.OrderByDescending(m => m.StartDate).ToListAsync();
            var now = DateTime.UtcNow;
            var soon = now.AddDays(7);

            string GetStatus(Member m)
            {
                if (!m.IsActive || m.EndDate <= now) return "Expired";
                if (m.EndDate <= soon) return "Expiring Soon";
                return "Active";
            }

            var rows = list.Select(m => new
            {
                memberName = m.User.FullName,
                email = m.User.Email ?? "",
                planName = m.MembershipPlan.Name,
                startDate = m.StartDate,
                endDate = m.EndDate,
                status = GetStatus(m)
            }).ToList();

            return new
            {
                summary = new
                {
                    total = rows.Count,
                    active = rows.Count(r => r.status == "Active"),
                    expiringSoon = rows.Count(r => r.status == "Expiring Soon"),
                    expired = rows.Count(r => r.status == "Expired")
                },
                rows
            };
        }

        public async Task<object> GetAttendanceReportAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.CheckInRecords
                .Include(c => c.Member).ThenInclude(m => m.User)
                .Include(c => c.Member).ThenInclude(m => m.MembershipPlan)
                .AsQueryable();

            if (fromDate.HasValue) query = query.Where(c => c.CheckInTime >= fromDate.Value.Date);
            if (toDate.HasValue)
            {
                var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(c => c.CheckInTime <= endOfDay);
            }

            var list = await query.OrderByDescending(c => c.CheckInTime).ToListAsync();
            var now = DateTime.UtcNow;
            var distinctDays = Math.Max(1, list.Select(c => c.CheckInTime.Date).Distinct().Count());

            var rows = list.Select(c => new
            {
                memberName = c.Member.User.FullName,
                email = c.Member.User.Email ?? "",
                planName = c.Member.MembershipPlan.Name,
                checkInTime = c.CheckInTime,
                status = (c.Member.IsActive && c.Member.EndDate > now) ? "Active" : "Expired"
            }).ToList();

            return new
            {
                summary = new
                {
                    totalCheckIns = rows.Count,
                    uniqueMembers = list.Select(c => c.MemberId).Distinct().Count(),
                    dailyAverage = Math.Round((double)rows.Count / distinctDays, 1),
                    daysCovered = list.Select(c => c.CheckInTime.Date).Distinct().Count()
                },
                rows
            };
        }

        public async Task<object> GetRevenueReportAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = from p in _context.Payments
                        join m in _context.Members on p.MemberId equals m.Id into mj
                        from m in mj.DefaultIfEmpty()
                        join u in _context.Users on m.UserId equals u.Id into uj
                        from u in uj.DefaultIfEmpty()
                        join plan in _context.MembershipPlans on m.MembershipPlanId equals plan.Id into pj
                        from plan in pj.DefaultIfEmpty()
                        select new { p, u, plan };

            if (fromDate.HasValue) query = query.Where(x => x.p.PaymentDate >= fromDate.Value.Date);
            if (toDate.HasValue)
            {
                var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(x => x.p.PaymentDate <= endOfDay);
            }

            var list = await query.OrderByDescending(x => x.p.PaymentDate).ToListAsync();

            var completed = list.Where(x => x.p.Status == "Completed").ToList();
            var pending = list.Where(x => x.p.Status == "Pending").ToList();
            var topMethod = completed
                .GroupBy(x => x.p.PaymentMethod)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .FirstOrDefault() ?? "—";

            var rows = list.Select(x => new
            {
                receiptNo = $"INV-{x.p.PaymentId:D4}",
                memberName = x.u != null ? x.u.FullName : $"Member #{x.p.MemberId}",
                planName = x.plan != null ? x.plan.Name : "Gym Membership",
                paymentDate = x.p.PaymentDate,
                paymentMethod = x.p.PaymentMethod,
                amount = x.p.Amount,
                status = x.p.Status
            }).ToList();

            return new
            {
                summary = new
                {
                    totalRevenue = completed.Sum(x => x.p.Amount),
                    completedCount = completed.Count,
                    pendingAmount = pending.Sum(x => x.p.Amount),
                    pendingCount = pending.Count,
                    topMethod
                },
                rows
            };
        }

        public async Task<object> GetClassesReportAsync(DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.GymClasses.AsQueryable();

            if (fromDate.HasValue) query = query.Where(c => c.ClassDate >= fromDate.Value.Date);
            if (toDate.HasValue)
            {
                var endOfDay = toDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(c => c.ClassDate <= endOfDay);
            }

            var classes = await query.OrderByDescending(c => c.ClassDate).ToListAsync();
            var classIds = classes.Select(c => c.ClassId).ToList();
            var bookings = await _context.ClassBookings
                .Where(b => classIds.Contains(b.ClassId))
                .ToListAsync();

            var rows = classes.Select(c =>
            {
                var enrolled = bookings.Count(b => b.ClassId == c.ClassId && b.Status == "Confirmed");
                var occupancy = c.Capacity > 0 ? (int)Math.Round(enrolled * 100.0 / c.Capacity) : 0;
                var displayStatus = c.Status == "Cancelled"
                    ? "Cancelled"
                    : (enrolled >= c.Capacity ? "Full" : "Active");

                return new
                {
                    className = c.ClassName,
                    classDate = c.ClassDate,
                    time = $"{c.StartTime:hh\\:mm} – {c.EndTime:hh\\:mm}",
                    enrolledCount = enrolled,
                    capacity = c.Capacity,
                    occupancy,
                    status = displayStatus
                };
            }).ToList();

            var totalCapacity = classes.Sum(c => c.Capacity);
            var totalConfirmed = rows.Sum(r => r.enrolledCount);
            var cancelledBookings = bookings.Count(b => b.Status == "Cancelled");

            return new
            {
                summary = new
                {
                    scheduledClasses = rows.Count,
                    totalBookings = totalConfirmed,
                    avgOccupancy = totalCapacity > 0 ? (int)Math.Round(totalConfirmed * 100.0 / totalCapacity) : 0,
                    cancelledBookings
                },
                rows
            };
        }
    }
}
