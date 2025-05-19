using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation;
using CleanArchitecture.Core.Interfaces.Repositories;
using Moq;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.UnitTests
{
    public class Reservations
    {
        private readonly Fixture fixture;
        private readonly Mock<IReservationRepositoryAsync> reservationRepositoryAsync;
        private readonly Mock<ICustomerRepositoryAsync> customerRepositoryAsync;
        private readonly Mock<IRoomRepositoryAsync> roomRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Reservations()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            reservationRepositoryAsync = new Mock<IReservationRepositoryAsync>();
            customerRepositoryAsync = new Mock<ICustomerRepositoryAsync>();
            roomRepositoryAsync = new Mock<IRoomRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_ShouldReturnReservationId()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var room = fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .Create();
            
            var createReservationCommand = fixture.Build<CreateReservationCommand>()
                .With(c => c.CustomerIdNumber, customer.IdNumber)
                .With(c => c.RoomId, room.Id)
                .With(c => c.StartDate, DateTime.UtcNow.Date)
                .With(c => c.EndDate, DateTime.UtcNow.AddDays(2).Date)
                .Create();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(customer.IdNumber))
                .ReturnsAsync(customer);
                
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            reservationRepositoryAsync.Setup(r => r.IsRoomAvailableAsync(
                It.IsAny<int>(), 
                It.IsAny<DateTime>(), 
                It.IsAny<DateTime>(), 
                It.IsAny<int?>()))
                .ReturnsAsync(true);
                
            reservationRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Reservation>()))
                .ReturnsAsync((Reservation r) => { r.Id = 1; return r; });
            
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act
            var result = await handler.Handle(createReservationCommand, CancellationToken.None);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            reservationRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Reservation>()), Times.Once);
        }
        
        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_WithNonExistingCustomer_ShouldThrowValidationException()
        {
            // Arrange
            var createReservationCommand = fixture.Create<CreateReservationCommand>();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(It.IsAny<string>()))
                .ReturnsAsync((Customer)null);
                
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(createReservationCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_WithNonExistingRoom_ShouldThrowEntityNotFoundException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var createReservationCommand = fixture.Build<CreateReservationCommand>()
                .With(c => c.CustomerIdNumber, customer.IdNumber)
                .Create();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(customer.IdNumber))
                .ReturnsAsync(customer);
                
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Room)null);
                
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<EntityNotFoundException>(() => 
                handler.Handle(createReservationCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_WithRoomUnderMaintenance_ShouldThrowValidationException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var room = fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, true) // Bakım durumu
                .Create();
            
            var createReservationCommand = fixture.Build<CreateReservationCommand>()
                .With(c => c.CustomerIdNumber, customer.IdNumber)
                .With(c => c.RoomId, room.Id)
                .Create();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(customer.IdNumber))
                .ReturnsAsync(customer);
                
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(createReservationCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_WithUnavailableRoom_ShouldThrowValidationException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var room = fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .Create();
            
            var createReservationCommand = fixture.Build<CreateReservationCommand>()
                .With(c => c.CustomerIdNumber, customer.IdNumber)
                .With(c => c.RoomId, room.Id)
                .With(c => c.StartDate, DateTime.UtcNow.Date)
                .With(c => c.EndDate, DateTime.UtcNow.AddDays(2).Date)
                .Create();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(customer.IdNumber))
                .ReturnsAsync(customer);
                
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            reservationRepositoryAsync.Setup(r => r.IsRoomAvailableAsync(
                It.IsAny<int>(), 
                It.IsAny<DateTime>(), 
                It.IsAny<DateTime>(), 
                It.IsAny<int?>()))
                .ReturnsAsync(false); // Oda müsait değil
                
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(createReservationCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_CreateReservationCommandHandlerInvoked_WithEndDateBeforeStartDate_ShouldThrowValidationException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var room = fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .Create();
            
            var createReservationCommand = fixture.Build<CreateReservationCommand>()
                .With(c => c.CustomerIdNumber, customer.IdNumber)
                .With(c => c.RoomId, room.Id)
                .With(c => c.StartDate, DateTime.UtcNow.Date.AddDays(2)) // Bitiş tarihinden sonra
                .With(c => c.EndDate, DateTime.UtcNow.Date) // Başlangıç tarihinden önce
                .Create();
            
            customerRepositoryAsync.Setup(c => c.GetByIdNumberAsync(customer.IdNumber))
                .ReturnsAsync(customer);
                
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            var handler = new CreateReservationCommandHandler(
                reservationRepositoryAsync.Object,
                customerRepositoryAsync.Object,
                roomRepositoryAsync.Object,
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(createReservationCommand, CancellationToken.None));
        }
    }
} 