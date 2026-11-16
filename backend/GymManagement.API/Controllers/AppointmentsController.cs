using System.Security.Claims;
using System.Threading.Tasks;
using GymManagement.API.Data;
using GymManagement.API.Dtos;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;
        private readonly AppDbContext _context;

        public AppointmentsController(IAppointmentService appointmentService, AppDbContext context)
        {
            _appointmentService = appointmentService;
            _context = context;
        }

        [HttpPost("book")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> BookAppointment([FromBody] CreateAppointmentDto dto)
        {
            // 1. Securely extract the logged-in User ID from the JWT token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // 2. Look up their real Member ID from the database
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return BadRequest(new { Message = "Member profile not found." });

            // 3. Overwrite whatever the frontend sent with the SECURE Member ID
            dto.MemberId = member.Id;

            // 4. Proceed with booking
            var result = await _appointmentService.BookAppointmentAsync(dto);
            
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpGet("trainer/schedule")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> GetTrainerAppointments()
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(trainerId)) 
            {
                return Unauthorized();
            }

            var appointments = await _appointmentService.GetTrainerAppointmentsAsync(trainerId);
            return Ok(appointments);
        }

         [HttpPut("{id}/status")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(trainerId)) 
            {
                return Unauthorized();
            }

            var result = await _appointmentService.UpdateAppointmentStatusAsync(id, status, trainerId);
            
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpGet("member/schedule")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMemberAppointments()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return BadRequest(new { Message = "Member profile not found." });

            var appointments = await _appointmentService.GetMemberAppointmentsAsync(member.Id);
            return Ok(appointments);
        }
    }
}