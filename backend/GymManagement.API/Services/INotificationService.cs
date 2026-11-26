using System;
using System.Threading.Tasks;

namespace GymManagement.API.Services
{
    public interface INotificationService
    {
        Task<object> GetNotificationsSummaryAsync();
        Task<object> GetMemberNotificationsAsync(string userId);
        Task<object> RunScheduledRemindersAsync();
        Task SendBookingConfirmationAsync(string memberName, string memberEmail, string className, DateTime classDate, TimeSpan startTime);
        Task<(bool Success, string Message)> ResendNotificationAsync(int logId);
    }
}
