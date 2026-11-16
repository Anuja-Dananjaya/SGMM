namespace GymManagement.API.Models
{
    public class WorkoutExercise
    {
        public int Id { get; set; }
        public string ExerciseName { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        
        public string RestTime { get; set; }
        public string Notes { get; set; }
        
        public int WorkoutDayId { get; set; }
        public WorkoutDay WorkoutDay { get; set; }
    }
}