using GymManagement.API.Models;
using System.Threading.Tasks;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
        Task<bool> RegisterAsync(RegisterDto registerDto);
        Task<IEnumerable<object>> GetAllUsersAsync();
    }
}