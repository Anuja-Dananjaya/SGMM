using GymManagement.API.Dtos;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace GymManagement.API.Services
{
    public interface ICheckInService
    {
        ActiveQRResponseDto GetOrGenerateActiveQRCode();
        Task<CheckInResponseDto> ProcessMobileCheckInAsync(string userId, string scannedCode);
        Task<IEnumerable<CheckInHistoryDto>> GetMemberCheckInHistoryAsync(string userId);
    }
}