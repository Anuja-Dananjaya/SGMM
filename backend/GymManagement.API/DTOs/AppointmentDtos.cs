using System;

namespace GymManagement.API.Dtos
{
    public class CreateAppointmentDto
    {
        public int MemberId { get; set; }
        public string TrainerId { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }

    public class AppointmentResponseDto
    {
        public int Id { get; set; }
        public string TrainerName { get; set; } = string.Empty;
        public string MemberName { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}