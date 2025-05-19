using AutoFixture;
using AutoFixture.Kernel;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces;
using CleanArchitecture.Infrastructure.Contexts;
using CleanArchitecture.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.Infrastructure.Tests
{
    public class RoomRepositoryTest
    {
        private readonly Fixture _fixture;
        private readonly Mock<ILogger<ApplicationDbContext>> _logger;
        private readonly Room _existingRoom;
        private readonly ApplicationDbContext _context;

        public RoomRepositoryTest()
        {
            _fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => _fixture.Behaviors.Remove(b));
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            // Var olan oda oluşturma
            _existingRoom = _fixture.Build<Room>()
                .With(r => r.RoomNumber, 101)
                .With(r => r.RoomType, "Standard")
                .With(r => r.Floor, 1)
                .With(r => r.IsOnMaintenance, false)
                .Create();
                
            _logger = new Mock<ILogger<ApplicationDbContext>>();

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(_fixture.Create<string>());

            _context = new ApplicationDbContext(optionsBuilder.Options, _logger.Object);

            _context.Rooms.Add(_existingRoom);
            _context.SaveChanges();
        }

        [Fact]
        public async Task When_IsUniqueRoomNumberAsyncCalledWithExistingRoomNumber_ShouldReturnFalse()
        {
            // Arrange
            var repository = new RoomRepositoryAsync(_context);

            // Act
            var result = await repository.IsUniqueRoomNumberAsync(_existingRoom.RoomNumber);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task When_IsUniqueRoomNumberAsyncCalledWithNonExistingRoomNumber_ShouldReturnTrue()
        {
            // Arrange
            var repository = new RoomRepositoryAsync(_context);
            var nonExistingRoomNumber = 999; // Mevcut olmayan oda numarası

            // Act
            var result = await repository.IsUniqueRoomNumberAsync(nonExistingRoomNumber);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task When_GetRoomsByTypeAsyncCalled_ShouldReturnMatchingRooms()
        {
            // Arrange
            var repository = new RoomRepositoryAsync(_context);
            var roomType = "Suite";
            
            // Aynı tipte birkaç oda ekle
            var rooms = _fixture.Build<Room>()
                .With(r => r.RoomType, roomType)
                .CreateMany(3)
                .ToList();
                
            _context.Rooms.AddRange(rooms);
            _context.SaveChanges();

            // Act
            var result = await repository.GetRoomsByTypeAsync(roomType);

            // Assert
            Assert.NotEmpty(result);
            Assert.Equal(3, result.Count);
            Assert.All(result, r => Assert.Equal(roomType, r.RoomType));
        }

        [Fact]
        public async Task When_GetRoomsByFloorAsyncCalled_ShouldReturnMatchingRooms()
        {
            // Arrange
            var repository = new RoomRepositoryAsync(_context);
            var floor = 2;
            
            // Aynı katta birkaç oda ekle
            var rooms = _fixture.Build<Room>()
                .With(r => r.Floor, floor)
                .CreateMany(3)
                .ToList();
                
            _context.Rooms.AddRange(rooms);
            _context.SaveChanges();

            // Act
            var result = await repository.GetRoomsByFloorAsync(floor);

            // Assert
            Assert.NotEmpty(result);
            Assert.Equal(3, result.Count);
            Assert.All(result, r => Assert.Equal(floor, r.Floor));
        }

        [Fact]
        public async Task When_GetAvailableRoomsAsyncCalled_ShouldReturnOnlyAvailableRooms()
        {
            // Arrange
            // Yeni bir veritabanı bağlamı oluşturalım
            var dbName = Guid.NewGuid().ToString();
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName);
            var context = new ApplicationDbContext(optionsBuilder.Options, _logger.Object);
            
            var repository = new RoomRepositoryAsync(context);
            
            // Test için tarih aralığı
            var startDate = DateTime.Now.AddDays(1);
            var endDate = DateTime.Now.AddDays(3);
            
            // Bakımda olmayan oda
            var availableRoom = _fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .With(r => r.Reservations, new List<Reservation>())
                .Create();
                
            // Bakımda olan oda
            var maintenanceRoom = _fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, true)
                .With(r => r.Reservations, new List<Reservation>())
                .Create();
            
            // Rezervasyonu olan oda
            var bookedRoom = _fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .With(r => r.Reservations, new List<Reservation>())
                .Create();
                
            // Rezervasyon oluştur
            var reservation = _fixture.Build<Reservation>()
                .With(r => r.RoomId, bookedRoom.Id)
                .With(r => r.Room, bookedRoom)
                .With(r => r.StartDate, startDate.AddDays(-1))
                .With(r => r.EndDate, endDate.AddDays(1))
                .With(r => r.Status, "Pending")
                .Create();
                
            bookedRoom.Reservations.Add(reservation);
            
            // Odaları veritabanına ekle
            context.Rooms.Add(availableRoom);
            context.Rooms.Add(maintenanceRoom);
            context.Rooms.Add(bookedRoom);
            context.Reservations.Add(reservation);
            context.SaveChanges();

            // Act
            var result = await repository.GetAvailableRoomsAsync(startDate, endDate);

            // Assert
            Assert.NotEmpty(result);
            Assert.Single(result);
            Assert.Equal(availableRoom.Id, result.First().Id);
            Assert.All(result, r => Assert.False(r.IsOnMaintenance));
        }

        [Fact]
        public async Task When_GetRoomWithDetailsAsyncCalled_ShouldReturnRoomWithAllRelatedEntities()
        {
            // Arrange
            // Yeni bir veritabanı bağlamı oluşturalım
            var dbName = Guid.NewGuid().ToString();
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(dbName);
            var context = new ApplicationDbContext(optionsBuilder.Options, _logger.Object);
            
            var repository = new RoomRepositoryAsync(context);
            
            // Yeni bir oda oluştur
            var room = _fixture.Build<Room>()
                .With(r => r.IsOnMaintenance, false)
                .With(r => r.Amenities, new List<Amenity>())
                .With(r => r.MaintenanceIssues, new List<MaintenanceIssue>())
                .With(r => r.Reservations, new List<Reservation>())
                .Create();
                
            // Amenities ekle
            var amenity1 = _fixture.Create<Amenity>();
            var amenity2 = _fixture.Create<Amenity>();
            
            // Maintenance issue ekle
            var maintenanceIssue = _fixture.Build<MaintenanceIssue>()
                .With(m => m.RoomId, room.Id)
                .With(m => m.Room, room)
                .Create();
                
            room.Amenities.Add(amenity1);
            room.Amenities.Add(amenity2);
            room.MaintenanceIssues.Add(maintenanceIssue);
                
            // Veritabanına ekle
            context.Rooms.Add(room);
            context.Amenities.AddRange(amenity1, amenity2);
            context.MaintenanceIssues.Add(maintenanceIssue);
            context.SaveChanges();

            // Act
            var result = await repository.GetRoomWithDetailsAsync(room.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(room.Id, result.Id);
            Assert.Equal(2, result.Amenities.Count);
            Assert.Contains(result.Amenities, a => a.Id == amenity1.Id);
            Assert.Contains(result.Amenities, a => a.Id == amenity2.Id);
            Assert.Single(result.MaintenanceIssues);
        }
    }
} 