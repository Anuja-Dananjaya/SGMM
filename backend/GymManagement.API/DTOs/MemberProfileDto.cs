using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Dtos
{
    public class MemberProfileDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public decimal PlanPrice { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public string QRCodeContent { get; set; } = string.Empty;
        public List<MembershipHistoryItemDto> MembershipHistory { get; set; } = new();
    }

    public class MembershipHistoryItemDto
    {
        public int Id { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateMyProfileDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Phone { get; set; }
    }
}
