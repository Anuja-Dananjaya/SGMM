using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using GymManagement.API.Data;
using GymManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TrainersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly AppDbContext _context;

        public TrainersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            AppDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTrainers()
        {
            var trainerUsers = await _userManager.GetUsersInRoleAsync("Trainer");
            var profiles = await _context.Trainers.ToListAsync();
            var profileByUserId = profiles
                .GroupBy(p => p.UserId)
                .ToDictionary(g => g.Key, g => g.First());

            var trainerList = trainerUsers.Select(t =>
            {
                profileByUserId.TryGetValue(t.Id, out var profile);
                var displayName = !string.IsNullOrWhiteSpace(t.FullName)
                    ? t.FullName
                    : (t.UserName ?? "Trainer");

                return new
                {
                    Id = t.Id,
                    Name = displayName,
                    FullName = displayName,
                    Email = t.Email ?? "",
                    Phone = t.PhoneNumber ?? "",
                    Specialization = profile?.Specialization ?? "Personal Training",
                    Availability = profile?.Availability ?? "Mon-Fri 08:00-16:00",
                    Status = profile?.Status ?? "Active"
                };
            }).OrderBy(t => t.FullName).ToList();

            return Ok(trainerList);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreateTrainer([FromBody] CreateTrainerDto dto)
        {
            if (!await _roleManager.RoleExistsAsync("Trainer"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Trainer"));
            }

            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null)
            {
                return BadRequest(new { Message = "A user with this email already exists." });
            }

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName.Trim(),
                PhoneNumber = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                var err = string.Join(" ", createResult.Errors.Select(e => e.Description));
                return BadRequest(new { Message = string.IsNullOrWhiteSpace(err) ? "Failed to create trainer account." : err });
            }

            await _userManager.AddToRoleAsync(user, "Trainer");

            var profile = new Trainer
            {
                UserId = user.Id,
                Specialization = string.IsNullOrWhiteSpace(dto.Specialization) ? "Personal Training" : dto.Specialization.Trim(),
                Availability = string.IsNullOrWhiteSpace(dto.Availability) ? "Mon-Fri 08:00-16:00" : dto.Availability.Trim(),
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim()
            };

            _context.Trainers.Add(profile);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Trainer created successfully.", Id = user.Id });
        }

        [HttpPut("{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateTrainer(string userId, [FromBody] UpdateTrainerDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound(new { Message = "Trainer account not found." });

            user.FullName = dto.FullName.Trim();
            user.Email = dto.Email.Trim();
            user.UserName = dto.Email.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var err = string.Join(" ", updateResult.Errors.Select(e => e.Description));
                return BadRequest(new { Message = string.IsNullOrWhiteSpace(err) ? "Failed to update trainer account." : err });
            }

            var profile = await _context.Trainers.FirstOrDefaultAsync(t => t.UserId == userId);
            if (profile == null)
            {
                profile = new Trainer { UserId = userId };
                _context.Trainers.Add(profile);
            }

            profile.Specialization = string.IsNullOrWhiteSpace(dto.Specialization) ? "Personal Training" : dto.Specialization.Trim();
            profile.Availability = string.IsNullOrWhiteSpace(dto.Availability) ? "Mon-Fri 08:00-16:00" : dto.Availability.Trim();
            profile.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Trainer profile updated successfully." });
        }

        [HttpPost("seed")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SeedTrainer()
        {
            if (!await _roleManager.RoleExistsAsync("Trainer"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Trainer"));
            }

            var existingTrainer = await _userManager.FindByEmailAsync("trainer1@gym.com");
            if (existingTrainer == null)
            {
                var trainer = new ApplicationUser
                {
                    UserName = "trainer1@gym.com",
                    Email = "trainer1@gym.com",
                    FullName = "Coach Ruwan",
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(trainer, "Trainer@123");
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(trainer, "Trainer");
                    _context.Trainers.Add(new Trainer
                    {
                        UserId = trainer.Id,
                        Specialization = "Strength & HIIT",
                        Availability = "Mon-Fri 08:00-16:00",
                        Status = "Active"
                    });
                    await _context.SaveChangesAsync();
                    return Ok(new { Message = "Trainer account created successfully!" });
                }

                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Trainer account already exists." });
        }
    }

    public class CreateTrainerDto
    {
        [Required] public string FullName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        [Required, MinLength(6)] public string Password { get; set; } = string.Empty;
        [MaxLength(100)] public string? Specialization { get; set; }
        [MaxLength(100)] public string? Availability { get; set; }
        [MaxLength(20)] public string Status { get; set; } = "Active";
    }

    public class UpdateTrainerDto
    {
        [Required] public string FullName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        [MaxLength(100)] public string? Specialization { get; set; }
        [MaxLength(100)] public string? Availability { get; set; }
        [MaxLength(20)] public string Status { get; set; } = "Active";
    }
}
