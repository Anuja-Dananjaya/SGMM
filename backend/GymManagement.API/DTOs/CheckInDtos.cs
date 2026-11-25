using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Dtos
{
    public class ActiveQRResponseDto
    {
        public string QRCode { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class MobileCheckInRequestDto
    {
        public string ScannedQRCode { get; set; } = string.Empty;
    }

    public class ManualCheckInRequestDto
    {
        [Required]
        public int MemberId { get; set; }
    }

    public class CheckInResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class AttendanceRecordDto
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public DateTime CheckInTime { get; set; }
        public bool IsMembershipActive { get; set; }
    }
}
