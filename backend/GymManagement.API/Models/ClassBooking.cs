using System;
using System.ComponentModel.DataAnnotations;

namespace GymManagement.API.Models
{
    public class ClassBooking
    {
        [Key]
        public int BookingId { get; set; }

        public int MemberId { get; set; }

        public int ClassId { get; set; }
        public GymClass? GymClass { get; set; }

        [Required]
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Status { get; set; } = "Confirmed";
    }
}