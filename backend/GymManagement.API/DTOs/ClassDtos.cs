using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.DTOs
{
    public class GymClassDto
    {
        public int ClassId { get; set; }
        public int TrainerId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime ClassDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int Capacity { get; set; }
        public string Status { get; set; } = string.Empty;
        public int EnrolledCount { get; set; }
    }

    public class CreateGymClassDto
    {
        [Required] public int TrainerId { get; set; }
        [Required] [MaxLength(100)] public string ClassName { get; set; } = string.Empty;
        [MaxLength(255)] public string? Description { get; set; }
        [Required] public DateTime ClassDate { get; set; }
        [Required] public TimeSpan StartTime { get; set; }
        [Required] public TimeSpan EndTime { get; set; }
        [Required] public int Capacity { get; set; }
    }
}