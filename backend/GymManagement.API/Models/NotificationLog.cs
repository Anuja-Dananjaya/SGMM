using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class NotificationLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(120)]
        public string RecipientName { get; set; } = string.Empty;

        [Required]
        [MaxLength(180)]
        public string RecipientEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty; // Expiry Reminder | Booking Confirmation | Payment Reminder

        [Required]
        [MaxLength(255)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string MessageBody { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(40)]
        public string Status { get; set; } = "Sent"; // Sent | Simulated | Failed

        [MaxLength(500)]
        public string? ErrorMessage { get; set; }
    }
}
