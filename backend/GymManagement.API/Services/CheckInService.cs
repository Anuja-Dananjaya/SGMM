using GymManagement.API.Data;
using GymManagement.API.Dtos;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public class CheckInService : ICheckInService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "CurrentGymQRCode";

        public CheckInService(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // Called by the React Web Admin Dashboard every 30 seconds
        public ActiveQRResponseDto GetOrGenerateActiveQRCode()
        {
            if (!_cache.TryGetValue(CacheKey, out string currentCode))
            {
                // Generate a new secure 6-character code (e.g. GYM-A3F9X)
                currentCode = "GYM-" + Guid.NewGuid().ToString().Substring(0, 5).ToUpper();
                
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromSeconds(30)); // EXPIRES IN 30 SECONDS

                _cache.Set(CacheKey, currentCode, cacheOptions);
            }

            return new ActiveQRResponseDto
            {
                QRCode = currentCode,
                ExpiresAt = DateTime.UtcNow.AddSeconds(30)
            };
        }

        // Called by the React Native Mobile App when a member scans the screen
        public async Task<CheckInResponseDto> ProcessMobileCheckInAsync(string userId, string scannedCode)
        {
            // 1. Verify the QR code is the currently active one
            if (!_cache.TryGetValue(CacheKey, out string activeCode) || activeCode != scannedCode)
            {
                return new CheckInResponseDto { Success = false, Message = "QR Code is invalid or has expired. Please scan the screen again." };
            }

            // 2. Find the Member profile
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId && m.IsActive);
            
            if (member == null)
            {
                return new CheckInResponseDto { Success = false, Message = "No active membership found for your account." };
            }

            if (member.EndDate < DateTime.UtcNow)
            {
                return new CheckInResponseDto { Success = false, Message = $"Membership expired on {member.EndDate:d}." };
            }

            // 3. NEW LOGIC: Prevent double check-ins on the same day
            var today = DateTime.UtcNow.Date;
            var alreadyCheckedIn = await _context.CheckInRecords
                .AnyAsync(c => c.MemberId == member.Id && c.CheckInTime.Date == today);

            if (alreadyCheckedIn)
            {
                return new CheckInResponseDto { Success = false, Message = "You have already checked in today. Have a great workout!" };
            }

            // 4. Log the check-in
            var checkIn = new CheckInRecord
            {
                MemberId = member.Id,
                CheckInTime = DateTime.UtcNow
            };

            _context.CheckInRecords.Add(checkIn);
            await _context.SaveChangesAsync();

            return new CheckInResponseDto { Success = true, Message = "Check-in successful! Welcome to the gym." };
        }

        public async Task<CheckInResponseDto> ProcessManualCheckInAsync(int memberId)
        {
            var member = await _context.Members
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == memberId);

            if (member == null)
            {
                return new CheckInResponseDto { Success = false, Message = "Member record not found." };
            }

            if (!member.IsActive || member.EndDate < DateTime.UtcNow)
            {
                return new CheckInResponseDto { Success = false, Message = $"Cannot check in: {member.User.FullName}'s membership expired on {member.EndDate:d}." };
            }

            var today = DateTime.UtcNow.Date;
            var alreadyCheckedIn = await _context.CheckInRecords
                .AnyAsync(c => c.MemberId == member.Id && c.CheckInTime.Date == today);

            if (alreadyCheckedIn)
            {
                return new CheckInResponseDto { Success = false, Message = $"{member.User.FullName} has already checked in today." };
            }

            var checkIn = new CheckInRecord
            {
                MemberId = member.Id,
                CheckInTime = DateTime.UtcNow
            };

            _context.CheckInRecords.Add(checkIn);
            await _context.SaveChangesAsync();

            return new CheckInResponseDto { Success = true, Message = $"Manual check-in recorded for {member.User.FullName}." };
        }

        public async Task<IEnumerable<CheckInHistoryDto>> GetMemberCheckInHistoryAsync(string userId)
        {
            var memberIds = await _context.Members
                .Where(m => m.UserId == userId)
                .Select(m => m.Id)
                .ToListAsync();

            if (!memberIds.Any()) return new List<CheckInHistoryDto>();

            return await _context.CheckInRecords
                .Where(c => memberIds.Contains(c.MemberId))
                .OrderByDescending(c => c.CheckInTime)
                .Select(c => new CheckInHistoryDto
                {
                    Id = c.Id,
                    CheckInTime = c.CheckInTime
                }).ToListAsync();
        }

        public async Task<IEnumerable<AttendanceRecordDto>> GetAllAttendanceAsync(DateTime? startDate = null, DateTime? endDate = null, string? search = null)
        {
            var query = _context.CheckInRecords
                .Include(c => c.Member)
                    .ThenInclude(m => m.User)
                .Include(c => c.Member)
                    .ThenInclude(m => m.MembershipPlan)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(c => c.CheckInTime >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(c => c.CheckInTime <= endOfDay);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(c =>
                    c.Member.User.FullName.ToLower().Contains(term) ||
                    (c.Member.User.Email != null && c.Member.User.Email.ToLower().Contains(term)) ||
                    c.Member.MembershipPlan.Name.ToLower().Contains(term));
            }

            var now = DateTime.UtcNow;

            return await query
                .OrderByDescending(c => c.CheckInTime)
                .Select(c => new AttendanceRecordDto
                {
                    Id = c.Id,
                    MemberId = c.MemberId,
                    MemberName = c.Member.User.FullName,
                    Email = c.Member.User.Email ?? "",
                    PlanName = c.Member.MembershipPlan.Name,
                    CheckInTime = c.CheckInTime,
                    IsMembershipActive = c.Member.IsActive && c.Member.EndDate > now
                })
                .ToListAsync();
        }
    }
}