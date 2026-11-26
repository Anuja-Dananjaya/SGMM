using System;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public interface IReportService
    {
        Task<object> GetDashboardAsync();
        Task<object> GetMembershipReportAsync(DateTime? fromDate = null, DateTime? toDate = null);
        Task<object> GetAttendanceReportAsync(DateTime? fromDate = null, DateTime? toDate = null);
        Task<object> GetRevenueReportAsync(DateTime? fromDate = null, DateTime? toDate = null);
        Task<object> GetClassesReportAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}
