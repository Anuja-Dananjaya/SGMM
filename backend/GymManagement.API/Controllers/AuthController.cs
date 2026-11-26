using GymManagement.API.Models;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using GymManagement.API.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity; // REQUIRED for UserManager

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicationUser> _userManager; // ADDED THIS

        // Injected UserManager here so we can edit users
        public AuthController(IAuthService authService, UserManager<ApplicationUser> userManager)
        {
            _authService = authService;
            _userManager = userManager; 
        }

        [HttpPost("register")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (dto.Role != "Admin" && dto.Role != "Staff" && dto.Role != "Trainer" && dto.Role != "Member")
                return BadRequest(new { message = "Role must be Admin, Staff, Trainer or Member." });

            // Staff may only register Member accounts (prevents privilege escalation).
            if (User.IsInRole("Staff") && !User.IsInRole("Admin") && dto.Role != "Member")
                return Forbid();

            var success = await _authService.RegisterAsync(dto);
            if (!success) return BadRequest(new { message = "Registration failed. Check email uniqueness and password complexity." });
            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var response = await _authService.LoginAsync(dto);
            if (response == null) return Unauthorized(new { message = "Invalid email or password." });
            return Ok(response);
        }
        
        [HttpGet("users")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        // NEW: The missing PUT endpoint that caused your 404 error!
        [HttpPut("users/{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            // Allowed roles: Admin, Staff, Trainer, Member.
            if (dto.Role != "Admin" && dto.Role != "Staff" && dto.Role != "Trainer" && dto.Role != "Member")
                return BadRequest(new { message = "Role must be Admin, Staff, Trainer or Member." });

            // Staff may only manage Member accounts (prevents privilege escalation).
            if (User.IsInRole("Staff") && !User.IsInRole("Admin"))
            {
                var targetRoles = await _userManager.GetRolesAsync(user);
                if (targetRoles.Any(r => r != "Member") || dto.Role != "Member")
                    return Forbid();
            }

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.UserName = dto.Email; 
            user.PhoneNumber = dto.Phone;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(new { message = "Failed to update user details." });

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(dto.Role))
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRoleAsync(user, dto.Role);
            }

            if (!string.IsNullOrEmpty(dto.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                await _userManager.ResetPasswordAsync(user, token, dto.Password);
            }

            return Ok(new { message = "User updated successfully!" });
        }
    }

    // DTO for receiving the Edit Form data
    public class UpdateUserDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Password { get; set; }
    }
}