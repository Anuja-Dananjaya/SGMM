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
    }
}