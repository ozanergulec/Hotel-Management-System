// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetRoomById/GetRoomByIdQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories; // Kullanılmıyor, kaldırılabilir
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces; // IApplicationDbContext, IDateTimeService için
using CleanArchitecture.Core.Interfaces; // IDateTimeService için
using Microsoft.EntityFrameworkCore;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById
{
    // Query Sınıfı (Değişiklik yok)
    public class GetRoomByIdQuery : IRequest<GetRoomByIdViewModel>
    {
        public int Id { get; set; }
        public DateTime? StatusCheckDate { get; set; } // Saat bilgisi içerebilir veya null olabilir
    }

    // Query Handler Sınıfı (Güncellendi)
    public class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, GetRoomByIdViewModel>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultCheckTime = new TimeSpan(16, 0, 0); // Varsayılan saat 16:00

        public GetRoomByIdQueryHandler(
            IApplicationDbContext context,
            IMapper mapper,
            IDateTimeService dateTimeService)
        {
             _context = context;
             _mapper = mapper;
             _dateTimeService = dateTimeService;
        }

        public async Task<GetRoomByIdViewModel> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
        {
            // <<<< BAŞLANGIÇ: Check DateTime Belirleme (GetAllRooms ile aynı mantık) >>>>
            DateTime checkDateTime;

            if (request.StatusCheckDate.HasValue)
            {
                var requestedDate = request.StatusCheckDate.Value;
                if (requestedDate.TimeOfDay == TimeSpan.Zero)
                {
                    checkDateTime = requestedDate.Date + DefaultCheckTime;
                }
                else
                {
                    checkDateTime = requestedDate;
                }

                if (checkDateTime.Kind == DateTimeKind.Unspecified)
                {
                     checkDateTime = checkDateTime.ToUniversalTime();
                }
                else if (checkDateTime.Kind == DateTimeKind.Local)
                {
                    checkDateTime = checkDateTime.ToUniversalTime();
                }
            }
            else
            {
                checkDateTime = _dateTimeService.NowUtc;
            }
            // <<<< BİTİŞ: Check DateTime Belirleme >>>>

            var room = await _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.MaintenanceIssues)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            var roomViewModel = _mapper.Map<GetRoomByIdViewModel>(room);

            roomViewModel.Features = room.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
            roomViewModel.MaintenanceDetails = _mapper.Map<List<MaintenanceIssueViewModel>>(room.MaintenanceIssues) ?? new List<MaintenanceIssueViewModel>();

            // <<< DEĞİŞİKLİK: Güncellenmiş Calculate metodunu çağır >>>
            roomViewModel.ComputedStatus = CalculateRoomStatus(room, checkDateTime);
            // <<< DEĞİŞİKLİK: Yanıta `.Date` değil, kullanılan checkDateTime'ı ata >>>
            roomViewModel.StatusCheckDate = checkDateTime;

            return roomViewModel;
        }

         // <<< BAŞLANGIÇ: Güncellenmiş CalculateRoomStatus Metodu (GetAllRooms ile aynı) >>>
        // Not: Bu metodu ortak bir yerde tanımlamak (örn. bir servis sınıfı) daha iyi olabilir.
        private string CalculateRoomStatus(Room room, DateTime checkDateTime)
        {
             if (room.IsOnMaintenance)
            {
                return "Maintenance";
            }

            var conflictingReservation = room.Reservations
                .FirstOrDefault(res =>
                    (res.Status == "Pending" || res.Status == "Checked-in") &&
                    checkDateTime >= res.StartDate &&
                    checkDateTime < res.EndDate);

             if (conflictingReservation != null)
             {
                 if (conflictingReservation.Status == "Checked-in")
                 {
                     return "Occupied";
                 }
                 return "Occupied"; // Veya "Reserved"
             }

             return "Available";
        }
         // <<< BİTİŞ: Güncellenmiş CalculateRoomStatus Metodu >>>
    }
}