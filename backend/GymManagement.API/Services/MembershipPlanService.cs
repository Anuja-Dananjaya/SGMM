using GymManagement.API.Data;
using GymManagement.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public class MembershipPlanService : IMembershipPlanService
    {
        private readonly AppDbContext _context;

        public MembershipPlanService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MembershipPlan>> GetAllPlansAsync()
        {
            return await _context.MembershipPlans.ToListAsync();
        }

        public async Task<MembershipPlan?> GetPlanByIdAsync(int id)
        {
            return await _context.MembershipPlans.FindAsync(id);
        }

        public async Task<MembershipPlan> CreatePlanAsync(MembershipPlan plan)
        {
            _context.MembershipPlans.Add(plan);
            await _context.SaveChangesAsync();
            return plan;
        }

        public async Task<bool> UpdatePlanAsync(int id, MembershipPlan plan)
        {
            if (id != plan.Id) return false;

            _context.Entry(plan).State = EntityState.Modified;
            
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MembershipPlanExists(id)) return false;
                throw;
            }
        }

        public async Task<bool> DeletePlanAsync(int id)
        {
            var plan = await _context.MembershipPlans.FindAsync(id);
            if (plan == null) return false;

            _context.MembershipPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> MembershipPlanExists(int id)
        {
            return await _context.MembershipPlans.AnyAsync(e => e.Id == id);
        }
    }
}