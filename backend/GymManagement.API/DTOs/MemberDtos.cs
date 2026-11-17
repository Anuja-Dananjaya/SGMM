using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Dtos
{
    public class AssignMembershipDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public int MembershipPlanId { get; set; }
    }

    public class UpdateMembershipDto
    {
        [Required]
        public int MembershipPlanId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class MemberResponseDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int MembershipPlanId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public string QRCodeContent { get; set; } = string.Empty;
    }
}