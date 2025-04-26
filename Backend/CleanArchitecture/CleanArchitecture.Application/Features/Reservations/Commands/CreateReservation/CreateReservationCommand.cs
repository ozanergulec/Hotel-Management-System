// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CreateReservation/CreateReservationCommand.cs
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Features.Reservations.DTOs;
using ValidationException = CleanArchitecture.Core.Exceptions.ValidationException;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    public class CreateReservationCommand : IRequest<CreateReservationResponse>
    {
        [Required(ErrorMessage = "Müşteri kimlik numarası gereklidir.")]
        public string CustomerIdNumber { get; set; } // Use ID number to find customer

        public int RoomId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        
        // Status default "Pending" olacak, command'da belirtmeye gerek yok.
    }

    public class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, CreateReservationResponse>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMapper _mapper;

        public CreateReservationCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            ICustomerRepositoryAsync customerRepository,
            IRoomRepositoryAsync roomRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _customerRepository = customerRepository;
            _roomRepository = roomRepository;
            _mapper = mapper;
        }

        // Metodun dönüş tipi Task<int> yerine Task<CreateReservationResponse> olarak değiştirildi
        public async Task<CreateReservationResponse> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
        {
            // --- Müşteri, Oda bulma ve kontroller (önceki adımla aynı) ---
            var customer = await _customerRepository.GetByIdNumberAsync(request.CustomerIdNumber);
            if (customer == null)
            {
                throw new ValidationException($"Customer with ID number '{request.CustomerIdNumber}' not found. Please create the customer first.");
            }

            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            if (room.IsOnMaintenance)
            {
                 throw new ValidationException("Cannot make a reservation for a room that is under maintenance.");
            }

            var isAvailable = await _reservationRepository.IsRoomAvailableAsync(
                request.RoomId, request.StartDate, request.EndDate);

            if (!isAvailable)
            {
                throw new ValidationException("The selected room is not available for the specified date range.");
            }
            // --- Kontroller Sonu ---


            // Rezervasyonu oluştur
            var reservation = _mapper.Map<Reservation>(request);
            reservation.CustomerId = customer.Id;
            reservation.Status = "Pending";

            // Fiyat Hesaplama (önceki adımla aynı)
            var startDateOnly = request.StartDate.Date;
            var endDateOnly = request.EndDate.Date;
            if (endDateOnly <= startDateOnly)
            {
                throw new ValidationException("End date must be after the start date.");
            }
            int numberOfNights = (int)(endDateOnly - startDateOnly).TotalDays;
            if (numberOfNights <= 0)
            {
                 throw new ValidationException("Reservation must be for at least one night.");
            }
            reservation.Price = room.PricePerNight * numberOfNights;
            // Fiyat Hesaplama Sonu


            // Rezervasyonu kaydet
            await _reservationRepository.AddAsync(reservation);

            // <<< DEĞİŞİKLİK: Sadece ID yerine ID ve Fiyat içeren nesneyi döndür >>>
            return new CreateReservationResponse
            {
                Id = reservation.Id,
                CalculatedPrice = reservation.Price // Hesaplanan fiyatı ekle
            };
        }
    }
}