using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public interface IAppointmentService
    {
        Task<(bool Success, string Message)> BookAppointmentAsync(CreateAppointmentDto dto);
        Task<IEnumerable<AppointmentResponseDto>> GetTrainerAppointmentsAsync(string trainerId);
        Task<(bool Success, string Message)> UpdateAppointmentStatusAsync(int appointmentId, string status, string trainerId);
        Task<IEnumerable<AppointmentResponseDto>> GetMemberAppointmentsAsync(int memberId);
    }
}