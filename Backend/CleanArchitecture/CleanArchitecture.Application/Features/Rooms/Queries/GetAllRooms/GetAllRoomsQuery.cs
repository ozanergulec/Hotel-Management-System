// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories; // IRoomRepositoryAsync için
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces; // IApplicationDbContext, IDateTimeService için
using Microsoft.EntityFrameworkCore;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    // Query Sınıfı (Değişiklik yok)
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string RoomType { get; set; }
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; }
        public DateTime? AvailabilityStartDate { get; set; }
        public DateTime? AvailabilityEndDate { get; set; }
        public DateTime? StatusCheckDate { get; set; } // Saat bilgisi içerebilir veya null olabilir
    }

    // Query Handler Sınıfı (Güncellendi)
    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultCheckTime = new TimeSpan(16, 0, 0); // Varsayılan saat 16:00

        public GetAllRoomsQueryHandler(
            IApplicationDbContext context,
            IMapper mapper,
            IDateTimeService dateTimeService)
        {
            _context = context;
            _mapper = mapper;
            _dateTimeService = dateTimeService;
        }

        public async Task<PagedResponse<GetAllRoomsViewModel>> Handle(GetAllRoomsQuery request, CancellationToken cancellationToken)
        {
            // <<<< BAŞLANGIÇ: Check DateTime Belirleme (16:00 Varsayılanı ile) >>>>
            DateTime checkDateTime; // Kontrol edilecek kesin zamanı tutacak

            if (request.StatusCheckDate.HasValue)
            {
                var requestedDate = request.StatusCheckDate.Value;
                // ASP.NET Core model binding genellikle gelen string'i DateTime'a çevirir.
                // Eğer saat bilgisi yoksa (örn. sadece "2025-04-26" geldiyse), TimeOfDay 00:00:00 olur.
                if (requestedDate.TimeOfDay == TimeSpan.Zero)
                {
                    // Saat girilmemişse, tarihin üzerine varsayılan saati (16:00) ekle
                    checkDateTime = requestedDate.Date + DefaultCheckTime;
                }
                else
                {
                    // Saat girilmişse, o saati kullan
                    checkDateTime = requestedDate;
                }

                // Gelen tarihin Kind'ı Unspecified ise UTC'ye çevir varsayalım
                // veya sunucunun yerel saatiyse ToUniversalTime() kullan.
                // Eğer API'nız her zaman UTC bekliyorsa SpecifyKind yeterli olabilir.
                if (checkDateTime.Kind == DateTimeKind.Unspecified)
                {
                    // Bu senaryo, model binding'in nasıl çalıştığına bağlı.
                    // Gelen string'de timezone yoksa ve sunucu Local ise, bu Local olur.
                    // Güvenli olması için UTC'ye çevirelim.
                     checkDateTime = checkDateTime.ToUniversalTime();
                     // VEYA her zaman UTC geldiğini varsayıyorsanız:
                     // checkDateTime = DateTime.SpecifyKind(checkDateTime, DateTimeKind.Utc);
                }
                else if (checkDateTime.Kind == DateTimeKind.Local)
                {
                    checkDateTime = checkDateTime.ToUniversalTime();
                }
                // Eğer zaten UTC ise dokunma
            }
            else
            {
                // StatusCheckDate hiç girilmemişse, şu anki UTC zamanını kullan
                checkDateTime = _dateTimeService.NowUtc;
            }
            // <<<< BİTİŞ: Check DateTime Belirleme >>>>


            // Filtreleme için kullanılacak tarihleri de UTC'ye çevir (Availability)
             DateTime? availabilityStartDateUtc = request.AvailabilityStartDate.HasValue
                ? (request.AvailabilityStartDate.Value.Kind == DateTimeKind.Local
                    ? request.AvailabilityStartDate.Value.ToUniversalTime()
                    : DateTime.SpecifyKind(request.AvailabilityStartDate.Value, DateTimeKind.Utc))
                : (DateTime?)null;
            DateTime? availabilityEndDateUtc = request.AvailabilityEndDate.HasValue
                ? (request.AvailabilityEndDate.Value.Kind == DateTimeKind.Local
                    ? request.AvailabilityEndDate.Value.ToUniversalTime()
                    : DateTime.SpecifyKind(request.AvailabilityEndDate.Value, DateTimeKind.Utc))
                : (DateTime?)null;


            var query = _context.Rooms
                .Include(r => r.Amenities)
                 // Hesaplama için ilgili rezervasyonları (status ve tarih aralığına göre ön filtreleme) çekebiliriz.
                 // Ancak CalculateRoomStatus içinde tüm Pending/Checked-in'leri almak daha garanti olabilir.
                 // Şimdilik tüm relevant olanları alalım:
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .AsQueryable();

            // Filtreleme
            if (!string.IsNullOrEmpty(request.RoomType))
            {
                query = query.Where(r => r.RoomType == request.RoomType);
            }
            if (request.Floor.HasValue)
            {
                query = query.Where(r => r.Floor == request.Floor.Value);
            }
            if (request.IsOnMaintenance.HasValue)
            {
                 query = query.Where(r => r.IsOnMaintenance == request.IsOnMaintenance.Value);
            }

            // Müsaitlik tarih aralığına göre filtrele (UTC değerleri kullanarak)
             if (availabilityStartDateUtc.HasValue && availabilityEndDateUtc.HasValue)
            {
                var startDate = availabilityStartDateUtc.Value;
                var endDate = availabilityEndDateUtc.Value;

                 query = query.Where(room =>
                        !room.IsOnMaintenance &&
                        !room.Reservations.Any(res =>
                            // Sadece Aktif/Bekleyen çakışmaları kontrol et
                            (res.Status == "Pending" || res.Status == "Checked-in") &&
                            res.StartDate < endDate && // Tam DateTime karşılaştırması
                            res.EndDate > startDate     // Tam DateTime karşılaştırması
                        ));
            }


            var totalRecords = await query.CountAsync(cancellationToken);

            var pagedData = await query
                .OrderBy(r => r.RoomNumber)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var roomViewModels = _mapper.Map<List<GetAllRoomsViewModel>>(pagedData);

            // ViewModel'leri Doldurma
            foreach (var viewModel in roomViewModels)
            {
                var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
                if (roomEntity != null)
                {
                    viewModel.Features = roomEntity.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
                    viewModel.IsOnMaintenance = roomEntity.IsOnMaintenance;
                    // <<< DEĞİŞİKLİK: Güncellenmiş Calculate metodunu çağır >>>
                    viewModel.ComputedStatus = CalculateRoomStatus(roomEntity, checkDateTime);
                     // <<< DEĞİŞİKLİK: Yanıta `.Date` değil, kullanılan checkDateTime'ı ata >>>
                    viewModel.StatusCheckDate = checkDateTime;
                }
            }

            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
        }

        // <<< BAŞLANGIÇ: Güncellenmiş CalculateRoomStatus Metodu >>>
        private string CalculateRoomStatus(Room room, DateTime checkDateTime) // Parametre adı değişti
        {
             if (room.IsOnMaintenance)
            {
                return "Maintenance";
            }

            // checkDateTime anında odayı meşgul eden (Pending veya Checked-in) bir rezervasyon var mı?
            // Veritabanındaki StartDate ve EndDate'in de UTC olduğu varsayılıyor.
            var conflictingReservation = room.Reservations
                .FirstOrDefault(res =>
                    (res.Status == "Pending" || res.Status == "Checked-in") &&
                    checkDateTime >= res.StartDate && // Başlangıç dahil
                    checkDateTime < res.EndDate);      // Bitiş hariç

            if (conflictingReservation != null)
            {
                // Eğer çakışan rezervasyon 'Checked-in' ise kesinlikle 'Occupied'
                if (conflictingReservation.Status == "Checked-in")
                {
                    return "Occupied";
                }
                // Eğer çakışan rezervasyon 'Pending' ise, bu 'Rezerve Edilmiş' anlamına gelir.
                // İsteğe bağlı olarak farklı bir durum ("Reserved") döndürebilirsiniz
                // veya basitlik için bunu da 'Occupied' gibi gösterebilirsiniz.
                // Şimdilik ikisi için de "Occupied" döndürelim.
                return "Occupied"; // Veya "Reserved"
            }

            // Çakışan aktif/bekleyen rezervasyon yoksa müsaittir.
            return "Available";
        }
        // <<< BİTİŞ: Güncellenmiş CalculateRoomStatus Metodu >>>
    }
}