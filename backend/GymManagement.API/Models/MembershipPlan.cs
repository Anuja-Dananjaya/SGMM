using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymManagement.API.Models
{
    public class MembershipPlan
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0, 999999.99, ErrorMessage = "Price cannot be negative.")] // LOCK: Backend Price Validation
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        [Range(1, 120, ErrorMessage = "Duration must be at least 1 month.")] // LOCK: Backend Duration Validation
        public int DurationInMonths { get; set; }

        public string Description { get; set; } = string.Empty;
    }
}