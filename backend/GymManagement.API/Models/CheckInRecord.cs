using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymManagement.API.Models
{
    public class CheckInRecord
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        [Required]
        public DateTime CheckInTime { get; set; }
    }
}