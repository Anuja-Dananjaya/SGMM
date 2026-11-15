using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class WorkoutPlan
    {
        public int Id { get; set; }

        public int MemberId { get; set; }
        public Member Member { get; set; }

        [Required]
        public string TrainerId { get; set; }
        public ApplicationUser Trainer { get; set; }

        [Required]
        [MaxLength(100)]
        public string PlanName { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public ICollection<WorkoutDay> WorkoutDays { get; set; } = new List<WorkoutDay>();
    }
}