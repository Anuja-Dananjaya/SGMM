# Gym Management System: Project Context

## Stack
- Backend: ASP.NET Core Web API (.NET 8), C#, MVC with a service layer
- Data: Entity Framework Core + Pomelo, MySQL database `gymdb`
- Auth: ASP.NET Core Identity + JWT, roles: Admin, Staff, Member
- Web: React (Vite), axios, react-router-dom
- Mobile: React Native (Expo), added in Week 9
- Email: MailKit (Mailtrap for testing)

## Rules
- Controllers are thin and contain no business logic.
- Business rules live in Services (Services/ folder).
- Data access goes through AppDbContext only.
- Use DTOs for all requests and responses; never return entities directly.
- Keep EF Core and Identity packages on version 8.x.

## Folder layout
backend/GymManagement.API/ (Controllers, Models, DTOs, Services, Data)
web/ (React app)
mobile/ (Expo app)

## Database tables
Users, Members, MembershipPlans, Memberships, Trainers, GymClasses,
ClassBookings, TrainerAppointments, Attendance (add CheckInMethod),
Payments, Notifications