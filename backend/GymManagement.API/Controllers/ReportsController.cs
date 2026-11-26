using System;
using System.Threading.Tasks;
using GymManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GymManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin,Staff,Trainer")]
        public async Task<IActionResult> GetDashboard()
        {
            return Ok(await _reportService.GetDashboardAsync());
        }

        [HttpGet("membership")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetMembershipReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            return Ok(await _reportService.GetMembershipReportAsync(fromDate, toDate));
        }

        [HttpGet("attendance")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAttendanceReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            return Ok(await _reportService.GetAttendanceReportAsync(fromDate, toDate));
        }

        [HttpGet("revenue")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            return Ok(await _reportService.GetRevenueReportAsync(fromDate, toDate));
        }

        [HttpGet("classes")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetClassesReport([FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            return Ok(await _reportService.GetClassesReportAsync(fromDate, toDate));
        }
    }
}
