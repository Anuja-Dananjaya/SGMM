using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class GymClass
    {
        [Key]
        public int ClassId { get; set; }

        public int TrainerId { get; set; }
        public Trainer? Trainer { get; set; }

        [Required]
        [MaxLength(100)]
        public string ClassName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Description { get; set; }

        [Required]
        public DateTime ClassDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        [Required]
        public int Capacity { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Active";
    }
}