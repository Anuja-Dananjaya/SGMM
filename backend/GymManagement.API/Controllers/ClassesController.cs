using System;
using System.Security.Claims;
using System.Threading.Tasks;
using GymManagement.API.DTOs;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ClassesController : ControllerBase
    {
        private readonly IClassService _classService;

        public ClassesController(IClassService classService)
        {
            _classService = classService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllClasses()
        {
            var classes = await _classService.GetAllClassesAsync();
            return Ok(classes);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreateClass([FromBody] CreateGymClassDto dto)
        {
            var createdClass = await _classService.CreateClassAsync(dto);
            return CreatedAtAction(nameof(GetAllClasses), new { id = createdClass.ClassId }, createdClass);
        }

        [HttpPost("{classId}/book")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> BookClass(int classId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var success = await _classService.BookClassAsync(userId, classId);
                if (!success) return BadRequest(new { Message = "Class is inactive or not found." });

                return Ok(new { Message = "Class booked successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}
