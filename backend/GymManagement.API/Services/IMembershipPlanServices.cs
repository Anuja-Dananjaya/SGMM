using GymManagement.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public interface IMembershipPlanService
    {
        Task<IEnumerable<MembershipPlan>> GetAllPlansAsync();
        Task<MembershipPlan?> GetPlanByIdAsync(int id);
        Task<MembershipPlan> CreatePlanAsync(MembershipPlan plan);
        Task<bool> UpdatePlanAsync(int id, MembershipPlan plan);
        Task<bool> DeletePlanAsync(int id);
    }
}