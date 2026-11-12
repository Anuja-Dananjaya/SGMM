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
    }
}