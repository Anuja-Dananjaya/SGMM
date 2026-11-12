using GymManagement.API.Dtos;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public interface ICheckInService
    {
        ActiveQRResponseDto GetOrGenerateActiveQRCode();
        Task<CheckInResponseDto> ProcessMobileCheckInAsync(string userId, string scannedCode);
    }
}