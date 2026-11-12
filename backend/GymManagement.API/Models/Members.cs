using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymManagement.API.Models
{
    public class Member
    {
        [Key]
        public int Id { get; set; }

        // Link to the ASP.NET Identity User (for login/name/email)
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [ForeignKey("UserId")]
        public ApplicationUser User { get; set; } = null!;

        // Link to the Membership Plan they purchased
        [Required]
        public int MembershipPlanId { get; set; }
        
        [ForeignKey("MembershipPlanId")]
        public MembershipPlan MembershipPlan { get; set; } = null!;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        // A unique string we will use later to generate their mobile QR code
        public string QRCodeContent { get; set; } = Guid.NewGuid().ToString();

        public bool IsActive { get; set; } = true;
    }
}