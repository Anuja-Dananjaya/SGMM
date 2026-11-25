using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.DTOs
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int MemberId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? PlanName { get; set; }
    }

    public class CreatePaymentDto
    {
        [Required]
        public int MemberId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = "Cash";
    }
}