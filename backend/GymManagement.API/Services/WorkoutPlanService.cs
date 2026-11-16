using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GymManagement.API.Data;
using GymManagement.API.Models;
using GymManagement.API.Dtos;

namespace GymManagement.API.Services
{
    public class WorkoutPlanService : IWorkoutPlanService
    {
        private readonly AppDbContext _context;

        public WorkoutPlanService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> CreatePlanAsync(CreateWorkoutPlanDto dto, string trainerId)
        {
            // 1. Create the main plan
            var plan = new WorkoutPlan
            {
                MemberId = dto.MemberId,
                TrainerId = trainerId,
                Title = dto.Title,
                Goal = dto.Goal,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                WorkoutDays = dto.Days.Select(d => new WorkoutDay
                {
                    DayName = d.DayName,
                    WorkoutExercises = d.Exercises.Select(e => new WorkoutExercise
                    {
                        ExerciseName = e.ExerciseName,
                        Sets = e.Sets,
                        Reps = e.Reps,
                        RestTime = e.RestTime,
                        Notes = e.Notes
                    }).ToList()
                }).ToList()
            };

            // 2. EF Core is smart enough to save the Plan, Days, and Exercises all at once
            _context.WorkoutPlans.Add(plan);
            await _context.SaveChangesAsync();

            return (true, "Workout plan created successfully.");
        }

        public async Task<IEnumerable<WorkoutPlanResponseDto>> GetMemberPlansAsync(int memberId)
        {
            return await _context.WorkoutPlans
                .Include(p => p.Trainer)
                .Include(p => p.WorkoutDays)
                    .ThenInclude(d => d.WorkoutExercises)
                .Where(p => p.MemberId == memberId)
                .OrderByDescending(p => p.StartDate)
                .Select(p => new WorkoutPlanResponseDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Goal = p.Goal,
                    TrainerName = p.Trainer.UserName ?? "Trainer",
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Days = p.WorkoutDays.Select(d => new WorkoutDayResponseDto
                    {
                        Id = d.Id,
                        DayName = d.DayName,
                        Exercises = d.WorkoutExercises.Select(e => new WorkoutExerciseResponseDto
                        {
                            Id = e.Id,
                            ExerciseName = e.ExerciseName,
                            Sets = e.Sets,
                            Reps = e.Reps,
                            RestTime = e.RestTime,
                            Notes = e.Notes
                        }).ToList()
                    }).ToList()
                }).ToListAsync();
        }

        // 1. Get all plans created by this specific trainer
        public async Task<IEnumerable<WorkoutPlanResponseDto>> GetTrainerPlansAsync(string trainerId)
        {
            return await _context.WorkoutPlans
                .Include(p => p.Member) // To get the member's name
                .Include(p => p.WorkoutDays)
                    .ThenInclude(d => d.WorkoutExercises)
                .Where(p => p.TrainerId == trainerId)
                .OrderByDescending(p => p.StartDate)
                .Select(p => new WorkoutPlanResponseDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Goal = p.Goal,
                    // Reusing TrainerName field to send the Member's name to the dashboard
                    TrainerName = p.Member.User.UserName ?? "Member", 
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Days = p.WorkoutDays.Select(d => new WorkoutDayResponseDto
                    {
                        Id = d.Id,
                        DayName = d.DayName,
                        Exercises = d.WorkoutExercises.Select(e => new WorkoutExerciseResponseDto
                        {
                            Id = e.Id,
                            ExerciseName = e.ExerciseName,
                            Sets = e.Sets,
                            Reps = e.Reps,
                            RestTime = e.RestTime,
                            Notes = e.Notes
                        }).ToList()
                    }).ToList()
                }).ToListAsync();
        }

        // 2. Delete a plan securely
        public async Task<bool> DeletePlanAsync(int planId, string trainerId)
        {
            var plan = await _context.WorkoutPlans
                .FirstOrDefaultAsync(p => p.Id == planId && p.TrainerId == trainerId);

            if (plan == null) return false;

            _context.WorkoutPlans.Remove(plan);
            await _context.SaveChangesAsync(); // Cascade delete handles Days and Exercises automatically!
            return true;
        }

        // 3. Edit/Update a plan
        public async Task<(bool Success, string Message)> UpdatePlanAsync(int planId, CreateWorkoutPlanDto dto, string trainerId)
        {
            var plan = await _context.WorkoutPlans
                .Include(p => p.WorkoutDays)
                .FirstOrDefaultAsync(p => p.Id == planId && p.TrainerId == trainerId);

            if (plan == null) return (false, "Plan not found or unauthorized.");

            // Update basic details
            plan.MemberId = dto.MemberId;
            plan.Title = dto.Title;
            plan.Goal = dto.Goal;
            plan.StartDate = dto.StartDate;
            plan.EndDate = dto.EndDate;

            // The safest way to update nested Days/Exercises in EF Core is to remove the old ones and insert the new ones
            _context.WorkoutDays.RemoveRange(plan.WorkoutDays);

            plan.WorkoutDays = dto.Days.Select(d => new WorkoutDay
            {
                DayName = d.DayName,
                WorkoutExercises = d.Exercises.Select(e => new WorkoutExercise
                {
                    ExerciseName = e.ExerciseName,
                    Sets = e.Sets,
                    Reps = e.Reps,
                    RestTime = e.RestTime,
                    Notes = e.Notes
                }).ToList()
            }).ToList();

            await _context.SaveChangesAsync();
            return (true, "Workout plan updated successfully.");
        }
    }
}