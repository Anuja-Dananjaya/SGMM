using GymManagement.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public interface IMemberService
    {
        Task<MemberResponseDto?> AssignMembershipAsync(AssignMembershipDto dto);
        Task<IEnumerable<MemberResponseDto>> GetAllMembersAsync();
        Task<bool> CancelMembershipAsync(int memberId);
        Task<(bool Success, string Message)> UpdateMembershipAsync(int memberId, UpdateMembershipDto dto);
        Task<(bool Success, string Message)> RenewMembershipAsync(int memberId);
        Task<MemberProfileDto?> GetMemberProfileAsync(string userId);
        Task<(bool Success, string Message)> UpdateMyProfileAsync(string userId, UpdateMyProfileDto dto);
    }
}