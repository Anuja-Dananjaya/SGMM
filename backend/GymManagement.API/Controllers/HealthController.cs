using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GymManagement.API.Data;
using System.Threading.Tasks;

namespace GymManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HealthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStatus()
        {
            // Checks if EF Core can establish a connection to the database
            bool dbConnected = await _context.Database.CanConnectAsync();
            
            if (dbConnected)
            {
                return Ok(new { 
                    status = "Healthy", 
                    database = "Connected to MySQL", 
                    timestamp = System.DateTime.UtcNow 
                });
            }
            
            return StatusCode(500, new { 
                status = "Unhealthy", 
                database = "Failed to connect to MySQL" 
            });
        }
    }
}