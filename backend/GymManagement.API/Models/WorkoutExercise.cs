using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class WorkoutExercise
    {
        public int Id { get; set; }

        public int WorkoutDayId { get; set; }
        public WorkoutDay WorkoutDay { get; set; }

        [Required]
        [MaxLength(100)]
        public string ExerciseName { get; set; } = string.Empty;

        // Validation: Must be at least 1 set, no negative numbers or zeros
        [Range(1, 100, ErrorMessage = "Sets must be greater than 0.")]
        public int Sets { get; set; }

        // Validation: Must be at least 1 rep
        [Range(1, 500, ErrorMessage = "Reps must be greater than 0.")]
        public int Reps { get; set; }

        // Validation: Rest time in seconds. Cannot be negative.
        [Range(0, 600, ErrorMessage = "Rest time cannot be negative.")]
        public int RestTimeInSeconds { get; set; }
    }
}