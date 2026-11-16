using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Dtos
{
    // 1. What the frontend sends to CREATE a plan
    public class CreateWorkoutPlanDto
    {
        [Required]
        public int MemberId { get; set; }
        
        [Required]
        public string Title { get; set; } // e.g., "Beginner Hypertrophy"
        
        public string Goal { get; set; } // e.g., "Weight Loss"
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public List<CreateWorkoutDayDto> Days { get; set; } = new();
    }

    public class CreateWorkoutDayDto
    {
        [Required]
        public string DayName { get; set; } // e.g., "Monday" or "Push Day"
        
        public List<CreateWorkoutExerciseDto> Exercises { get; set; } = new();
    }

    public class CreateWorkoutExerciseDto
    {
        [Required]
        public string ExerciseName { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public string RestTime { get; set; } // e.g., "60s"
        public string Notes { get; set; }
    }

    // 2. What we send BACK to the mobile app for the Member to view
    public class WorkoutPlanResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Goal { get; set; }
        public string TrainerName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<WorkoutDayResponseDto> Days { get; set; } = new();
    }

    public class WorkoutDayResponseDto
    {
        public int Id { get; set; }
        public string DayName { get; set; }
        public List<WorkoutExerciseResponseDto> Exercises { get; set; } = new();
    }

    public class WorkoutExerciseResponseDto
    {
        public int Id { get; set; }
        public string ExerciseName { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public string RestTime { get; set; }
        public string Notes { get; set; }
    }
}