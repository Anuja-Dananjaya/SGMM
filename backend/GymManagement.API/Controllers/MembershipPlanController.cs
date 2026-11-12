using GymManagement.API.Models;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipPlansController : ControllerBase
    {
        private readonly IMembershipPlanService _service;

        public MembershipPlansController(IMembershipPlanService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MembershipPlan>>> GetMembershipPlans()
        {
            var plans = await _service.GetAllPlansAsync();
            return Ok(plans);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MembershipPlan>> GetMembershipPlan(int id)
        {
            var plan = await _service.GetPlanByIdAsync(id);
            if (plan == null) return NotFound();
            return Ok(plan);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MembershipPlan>> PostMembershipPlan(MembershipPlan plan)
        {
            var createdPlan = await _service.CreatePlanAsync(plan);
            return CreatedAtAction(nameof(GetMembershipPlan), new { id = createdPlan.Id }, createdPlan);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutMembershipPlan(int id, MembershipPlan plan)
        {
            var success = await _service.UpdatePlanAsync(id, plan);
            if (!success) return BadRequest("Plan update failed or plan not found.");
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMembershipPlan(int id)
        {
            var success = await _service.DeletePlanAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}