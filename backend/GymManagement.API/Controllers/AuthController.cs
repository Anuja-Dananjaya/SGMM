using GymManagement.API.Models;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using GymManagement.API.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var success = await _authService.RegisterAsync(dto);
            if (!success) return BadRequest("Registration failed. Check password complexity.");
            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var response = await _authService.LoginAsync(dto);
            if (response == null) return Unauthorized("Invalid email or password.");
            return Ok(response);
        }
        
        [HttpGet("users")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }
    }
}