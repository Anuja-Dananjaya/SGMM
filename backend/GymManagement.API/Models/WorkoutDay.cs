using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class WorkoutDay
    {
        public int Id { get; set; }

        public int WorkoutPlanId { get; set; }
        public WorkoutPlan WorkoutPlan { get; set; }

        [Required]
        [MaxLength(50)]
        public string DayName { get; set; } = string.Empty; // e.g., "Day 1 - Chest/Triceps"

        public ICollection<WorkoutExercise> Exercises { get; set; } = new List<WorkoutExercise>();
    }
}