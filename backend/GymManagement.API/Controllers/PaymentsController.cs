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
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        // GET: api/payments (Admins & Staff view all revenue)
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllPayments(
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate, 
        [FromQuery] int? memberId)

        {
        var payments = await _paymentService.GetAllPaymentsAsync(startDate, endDate, memberId);
        return Ok(payments);
        }

        // POST: api/payments (Admins & Staff record a new payment)
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> RecordPayment([FromBody] CreatePaymentDto dto)
        {
            var payment = await _paymentService.RecordPaymentAsync(dto);
            return CreatedAtAction(nameof(GetAllPayments), new { id = payment.PaymentId }, payment);
        }

        // GET: api/payments/my-history (Members view their own receipts)
        [HttpGet("my-history")]
        [Authorize(Roles = "Member")]
        public async Task<IActionResult> GetMyPayments()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var payments = await _paymentService.GetMemberPaymentsAsync(userId);
                return Ok(payments);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}