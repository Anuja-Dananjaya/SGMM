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

    public class ClassBookingDto
    {
        public int BookingId { get; set; }
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public DateTime ClassDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public DateTime BookingDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool CanCancel { get; set; }
        public string? MemberName { get; set; }
        public string? MemberEmail { get; set; }
    }

    public class CreateGymClassDto
    {
        [Required] public int TrainerId { get; set; }
        [Required] [MaxLength(100)] public string ClassName { get; set; } = string.Empty;
        [MaxLength(255)] public string? Description { get; set; }
        [Required] public DateTime ClassDate { get; set; }
        [Required] public TimeSpan StartTime { get; set; }
        [Required] public TimeSpan EndTime { get; set; }
        [Required] [Range(1, 500)] public int Capacity { get; set; }
    }

    public class UpdateGymClassDto
    {
        [Required] public int TrainerId { get; set; }
        [Required] [MaxLength(100)] public string ClassName { get; set; } = string.Empty;
        [MaxLength(255)] public string? Description { get; set; }
        [Required] public DateTime ClassDate { get; set; }
        [Required] public TimeSpan StartTime { get; set; }
        [Required] public TimeSpan EndTime { get; set; }
        [Required] [Range(1, 500)] public int Capacity { get; set; }
        [Required] [MaxLength(20)] public string Status { get; set; } = "Active";
    }
}