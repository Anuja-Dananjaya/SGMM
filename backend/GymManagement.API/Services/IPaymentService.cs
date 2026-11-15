using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.DTOs;

namespace GymManagement.API.Services
{
    public interface IPaymentService
    {
        Task<PaymentDto> RecordPaymentAsync(CreatePaymentDto dto);
        
        Task<IEnumerable<PaymentDto>> GetAllPaymentsAsync(DateTime? startDate = null, DateTime? endDate = null, int? memberId = null);
        
        Task<IEnumerable<PaymentDto>> GetMemberPaymentsAsync(string userId);
    }
}