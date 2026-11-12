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
    }
}