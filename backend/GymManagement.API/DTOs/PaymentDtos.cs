using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.DTOs
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int MemberId { get; set; }
        public string? MemberName { get; set; }
        public string? MemberEmail { get; set; }
        public string? PlanName { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CreatePaymentDto
    {
        [Required]
        public int MemberId { get; set; }

        [Required]
        [Range(0.01, 9999999.99, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = "Cash";

        public string Status { get; set; } = "Completed";
    }

    public class UpdatePaymentStatusDto
    {
        [Required]
        public string Status { get; set; } = "Completed";

        public string? PaymentMethod { get; set; }
    }
}
