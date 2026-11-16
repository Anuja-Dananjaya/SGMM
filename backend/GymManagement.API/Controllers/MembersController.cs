using GymManagement.API.Models;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.Dtos;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require login globally for this controller
    public class MembersController : ControllerBase
    {
        private readonly IMemberService _memberService;

        public MembersController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        // Member Endpoint
        [HttpGet("me")]
        [Authorize(Roles = "Member")] 
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var profile = await _memberService.GetMemberProfileAsync(userId);
            if (profile == null) return NotFound(new { Message = "Member profile not found." });

            return Ok(profile);
        }

        // Admin & Staff Endpoints
        [HttpPost("assign")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<MemberResponseDto>> AssignMembership(AssignMembershipDto dto)
        {
            var result = await _memberService.AssignMembershipAsync(dto);
            if (result == null) return BadRequest("Invalid User ID or Membership Plan ID.");
            
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff,Trainer")]
        public async Task<ActionResult<IEnumerable<MemberResponseDto>>> GetAllMembers()
        {
            var members = await _memberService.GetAllMembersAsync();
            return Ok(members);
        }

        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CancelMembership(int id)
        {
            var success = await _memberService.CancelMembershipAsync(id);
            if (!success) return NotFound("Membership record not found.");
            
            return Ok(new { message = "Membership cancelled successfully." });
        }
    }
}