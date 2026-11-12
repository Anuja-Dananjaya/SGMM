using System;

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

    public class CheckInResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}