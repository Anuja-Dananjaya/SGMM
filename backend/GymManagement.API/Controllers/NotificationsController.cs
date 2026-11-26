using System.Security.Claims;
using System.Threading.Tasks;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetNotifications()
        {
            return Ok(await _notificationService.GetNotificationsSummaryAsync());
        }

        [HttpGet("my")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            return Ok(await _notificationService.GetMemberNotificationsAsync(userId));
        }

        [HttpPost("run-now")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> RunScheduledNow()
        {
            return Ok(await _notificationService.RunScheduledRemindersAsync());
        }

        [HttpPost("{id}/resend")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Resend(int id)
        {
            var (success, message) = await _notificationService.ResendNotificationAsync(id);
            if (!success) return BadRequest(new { Message = message });

            return Ok(new { Message = message });
        }
    }
}
