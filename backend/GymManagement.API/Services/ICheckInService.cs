using GymManagement.API.Dtos;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public interface ICheckInService
    {
        ActiveQRResponseDto GetOrGenerateActiveQRCode();
        Task<CheckInResponseDto> ProcessMobileCheckInAsync(string userId, string scannedCode);
        Task<CheckInResponseDto> ProcessManualCheckInAsync(int memberId);
        Task<IEnumerable<CheckInHistoryDto>> GetMemberCheckInHistoryAsync(string userId);
        Task<IEnumerable<AttendanceRecordDto>> GetAllAttendanceAsync(DateTime? startDate = null, DateTime? endDate = null, string? search = null);
    }
}
