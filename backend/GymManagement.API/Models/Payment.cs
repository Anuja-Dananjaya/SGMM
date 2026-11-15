using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int MemberId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, Bank Transfer

        [MaxLength(50)]
        public string Status { get; set; } = "Completed";
    }
}