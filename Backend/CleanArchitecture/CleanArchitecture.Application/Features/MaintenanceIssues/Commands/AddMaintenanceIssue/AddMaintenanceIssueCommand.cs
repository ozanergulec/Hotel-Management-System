// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/MaintenanceIssues/Commands/AddMaintenanceIssue/AddMaintenanceIssueCommand.cs
// İçindeki AddMaintenanceIssueCommandHandler sınıfının Handle metodu

using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue
{
    // Command sınıfı aynı kalır
    public class AddMaintenanceIssueCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }

    // Command Handler (GÜNCELLENDİ)
    public class AddMaintenanceIssueCommandHandler : IRequestHandler<AddMaintenanceIssueCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;

        public AddMaintenanceIssueCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(AddMaintenanceIssueCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // --- KALDIRILAN BÖLÜM ---
            // Odanın IsOnMaintenance flag'i artık burada otomatik olarak değiştirilmiyor.
            // room.IsOnMaintenance = true;
            // await _roomRepository.UpdateAsync(room);
            // --- KALDIRILAN BÖLÜM SONU ---

            // Add maintenance issue
            var maintenanceIssue = _mapper.Map<MaintenanceIssue>(request);
            // RoomId zaten request içinde var ve AutoMapper tarafından maplenmeli.
            // maintenanceIssue.RoomId = request.RoomId;
            await _maintenanceIssueRepository.AddAsync(maintenanceIssue);

            return maintenanceIssue.Id;
        }
    }
}