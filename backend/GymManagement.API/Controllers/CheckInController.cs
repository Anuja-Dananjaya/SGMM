using GymManagement.API.Dtos;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckInController : ControllerBase
    {
        private readonly ICheckInService _checkInService;

        public CheckInController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
        }

        // 1. ADMIN ENDPOINT: Front desk computer calls this to display the QR code
        [HttpGet("active-qr")]
        [Authorize(Roles = "Admin,Staff")]
        public IActionResult GetActiveQRCode()
        {
            var result = _checkInService.GetOrGenerateActiveQRCode();
            return Ok(result);
        }

        // 2. MEMBER ENDPOINT: Mobile app sends the scanned text here
        [HttpPost("scan")]
        [Authorize(Roles = "Member")] 
        public async Task<IActionResult> ScanQRCode([FromBody] MobileCheckInRequestDto request)
        {
            // Extract the UserId directly from the Member's mobile JWT token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _checkInService.ProcessMobileCheckInAsync(userId, request.ScannedQRCode);
            
            if (!result.Success) return BadRequest(result);

            return Ok(result);
        }
    }
}