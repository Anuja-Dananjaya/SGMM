using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class Trainer
    {
        [Key]
        public int TrainerId { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Specialization { get; set; }

        [MaxLength(100)]
        public string? Availability { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Active";
    }
}