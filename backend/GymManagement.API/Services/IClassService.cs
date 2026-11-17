using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.DTOs;

namespace GymManagement.API.Services
{
    public interface IClassService
    {
        Task<IEnumerable<GymClassDto>> GetAllClassesAsync();
        Task<GymClassDto> CreateClassAsync(CreateGymClassDto dto);
        Task<bool> BookClassAsync(string userId, int classId);
        Task<IEnumerable<ClassBookingDto>> GetMyBookingsAsync(string userId);
        Task<IEnumerable<ClassBookingDto>> GetClassBookingsAsync(int classId);
        Task<(bool Success, string Message)> CancelBookingAsync(int bookingId, string userId, bool isStaff);
    }
}