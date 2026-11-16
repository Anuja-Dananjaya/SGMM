using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using GymManagement.API.Dtos;
using GymManagement.API.Services;
using GymManagement.API.Data;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WorkoutPlansController : ControllerBase
    {
        private readonly IWorkoutPlanService _workoutPlanService;
        private readonly AppDbContext _context;

        public WorkoutPlansController(IWorkoutPlanService workoutPlanService, AppDbContext context)
        {
            _workoutPlanService = workoutPlanService;
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> CreatePlan([FromBody] CreateWorkoutPlanDto dto)
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(trainerId)) return Unauthorized();

            var result = await _workoutPlanService.CreatePlanAsync(dto, trainerId);
            
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpGet("member")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMemberPlans()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Find the specific Member ID linked to this authenticated User account
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return BadRequest(new { Message = "Member profile not found." });

            var plans = await _workoutPlanService.GetMemberPlansAsync(member.Id);
            return Ok(plans);
        }

        [HttpGet("trainer")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> GetTrainerPlans()
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var plans = await _workoutPlanService.GetTrainerPlansAsync(trainerId);
            return Ok(plans);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] CreateWorkoutPlanDto dto)
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var result = await _workoutPlanService.UpdatePlanAsync(id, dto, trainerId);
            
            if (!result.Success) return BadRequest(new { Message = result.Message });
            return Ok(new { Message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var success = await _workoutPlanService.DeletePlanAsync(id, trainerId);
            
            if (!success) return NotFound(new { Message = "Plan not found or unauthorized." });
            return Ok(new { Message = "Plan deleted successfully." });
        }
    }
}