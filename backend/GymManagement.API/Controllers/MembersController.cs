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
    [Authorize(Roles = "Admin,Staff")] // LOCK: Only Admins and Staff can manage members
    public class MembersController : ControllerBase
    {
        private readonly IMemberService _memberService;

        public MembersController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        [HttpPost("assign")]
        public async Task<ActionResult<MemberResponseDto>> AssignMembership(AssignMembershipDto dto)
        {
            var result = await _memberService.AssignMembershipAsync(dto);
            if (result == null) return BadRequest("Invalid User ID or Membership Plan ID.");
            
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberResponseDto>>> GetAllMembers()
        {
            var members = await _memberService.GetAllMembersAsync();
            return Ok(members);
        }
    }
}