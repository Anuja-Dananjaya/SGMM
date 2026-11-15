using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        
        public int MemberId { get; set; }
        public Member Member { get; set; }

        // Links to the ApplicationUser who has the "Trainer" role
        [Required]
        public string TrainerId { get; set; }
        public ApplicationUser Trainer { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Cancelled, Completed

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}