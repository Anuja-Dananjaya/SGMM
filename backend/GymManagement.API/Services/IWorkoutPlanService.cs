using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public interface IWorkoutPlanService
    {
        Task<(bool Success, string Message)> CreatePlanAsync(CreateWorkoutPlanDto dto, string trainerId);
        Task<IEnumerable<WorkoutPlanResponseDto>> GetMemberPlansAsync(int memberId);
        Task<IEnumerable<WorkoutPlanResponseDto>> GetTrainerPlansAsync(string trainerId);
        Task<(bool Success, string Message)> UpdatePlanAsync(int planId, CreateWorkoutPlanDto dto, string trainerId);
        Task<bool> DeletePlanAsync(int planId, string trainerId);
    }
}