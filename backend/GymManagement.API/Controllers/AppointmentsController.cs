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
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var member = await _context.Members
                .OrderByDescending(m => m.EndDate)
                .FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return BadRequest(new { Message = "Member profile not found." });

            dto.MemberId = member.Id;

            var result = await _appointmentService.BookAppointmentAsync(dto);
            if (!result.Success) return BadRequest(new { Message = result.Message });

            return Ok(new { Message = result.Message });
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var appointments = await _appointmentService.GetAllAppointmentsAsync();
            return Ok(appointments);
        }

        [HttpGet("trainer/schedule")]
        [Authorize(Roles = "Trainer")]
        public async Task<IActionResult> GetTrainerAppointments()
        {
            var trainerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(trainerId)) return Unauthorized();

            var appointments = await _appointmentService.GetTrainerAppointmentsAsync(trainerId);
            return Ok(appointments);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Trainer,Admin,Staff")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var isAdminOrStaff = User.IsInRole("Admin") || User.IsInRole("Staff");
            var result = await _appointmentService.UpdateAppointmentStatusAsync(id, status, userId, isAdminOrStaff);

            if (!result.Success) return BadRequest(new { Message = result.Message });

            return Ok(new { Message = result.Message });
        }

        [HttpGet("member/schedule")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMemberAppointments()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var member = await _context.Members
                .OrderByDescending(m => m.EndDate)
                .FirstOrDefaultAsync(m => m.UserId == userId);
            if (member == null) return BadRequest(new { Message = "Member profile not found." });

            var appointments = await _appointmentService.GetMemberAppointmentsAsync(member.Id);
            return Ok(appointments);
        }
    }
}
