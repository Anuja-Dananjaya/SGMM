using System.Collections.Generic;

namespace GymManagement.API.Models
{
    public class WorkoutDay
    {
        public int Id { get; set; }
        public string DayName { get; set; }
        
        public int WorkoutPlanId { get; set; }
        public WorkoutPlan WorkoutPlan { get; set; }
        
        public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
    }
}