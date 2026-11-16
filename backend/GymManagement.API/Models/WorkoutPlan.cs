using System;
using System.Collections.Generic;

namespace GymManagement.API.Models
{
    public class WorkoutPlan
    {
        public int Id { get; set; }
        
        public int MemberId { get; set; }
        public Member Member { get; set; }
        
        public string TrainerId { get; set; }
        public ApplicationUser Trainer { get; set; }

        public string Title { get; set; }
        public string Goal { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public ICollection<WorkoutDay> WorkoutDays { get; set; } = new List<WorkoutDay>();
    }
}