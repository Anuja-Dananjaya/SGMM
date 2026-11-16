using System.Linq;
using System.Threading.Tasks;
using GymManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Members need to be logged in to see the list
    public class TrainersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public TrainersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetTrainers()
        {
            // Fetch all users assigned to the "Trainer" role
            var trainers = await _userManager.GetUsersInRoleAsync("Trainer");
            
            // Format the output so the React Native picker can read it easily
            var trainerList = trainers.Select(t => new 
            {
                Id = t.Id,
                Name = t.UserName ?? "Trainer"
            });

            return Ok(trainerList);
        }

        [HttpPost("seed")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedTrainer([FromServices] RoleManager<IdentityRole> roleManager)
        {
            // 1. Create the "Trainer" role if it doesn't exist yet
            if (!await roleManager.RoleExistsAsync("Trainer"))
            {
                await roleManager.CreateAsync(new IdentityRole("Trainer"));
            }

            // 2. Check if our dummy trainer already exists
            var existingTrainer = await _userManager.FindByEmailAsync("trainer1@gym.com");
            if (existingTrainer == null)
            {
                var trainer = new ApplicationUser
                {
                    UserName = "trainer1",
                    Email = "trainer1@gym.com",
                    EmailConfirmed = true
                };

                // 3. Create the user with a hashed password
                var result = await _userManager.CreateAsync(trainer, "Trainer@123");
                if (result.Succeeded)
                {
                    // 4. Assign them to the Trainer role
                    await _userManager.AddToRoleAsync(trainer, "Trainer");
                    return Ok(new { Message = "Trainer account created successfully!" });
                }
                
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Trainer account already exists." });
        }
    }
}