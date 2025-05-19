using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.UpdateRoom;
using CleanArchitecture.Core.Interfaces.Repositories;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.UnitTests
{
    public class Rooms
    {
        private readonly Fixture fixture;
        private readonly Mock<IRoomRepositoryAsync> roomRepositoryAsync;
        private readonly Mock<IAmenityRepositoryAsync> amenityRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Rooms()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            roomRepositoryAsync = new Mock<IRoomRepositoryAsync>();
            amenityRepositoryAsync = new Mock<IAmenityRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateRoomCommandHandlerInvoked_ShouldReturnRoomId()
        {
            // Arrange
            var room = fixture.Create<Room>();
            
            // AutoFixture'ın oluşturamayacağı CreateRoomCommand'ı manuel oluştur
            var createRoomCommand = new CreateRoomCommand
            {
                RoomNumber = fixture.Create<int>(),
                RoomType = fixture.Create<string>(),
                Floor = fixture.Create<int>(),
                RoomCapacity = fixture.Create<string>(),
                PricePerNight = 100.50m, // Decimal değer manuel belirleniyor
                Description = fixture.Create<string>(),
                Features = fixture.Create<List<string>>()
            };
            
            mapper.Setup(m => m.Map<Room>(It.IsAny<CreateRoomCommand>()))
                .Returns(room);
                
            roomRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Room>()))
                .ReturnsAsync(room);
                
            roomRepositoryAsync.Setup(r => r.GetRoomWithDetailsAsync(It.IsAny<int>()))
                .ReturnsAsync(room);
                
            var handler = new CreateRoomCommandHandler(
                roomRepositoryAsync.Object, 
                amenityRepositoryAsync.Object, 
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createRoomCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(room.Id, result);
            roomRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Room>()), Times.Once);
        }
        
        [Fact]
        public async Task When_CreateRoomCommandHandlerInvoked_WithFeatures_ShouldAddAmenitiesToRoom()
        {
            // Arrange
            var room = fixture.Create<Room>();
            var features = new List<string> { "WiFi", "TV", "MiniBar" };
            
            // AutoFixture'ın oluşturamayacağı CreateRoomCommand'ı manuel oluştur
            var createRoomCommand = new CreateRoomCommand
            {
                RoomNumber = fixture.Create<int>(),
                RoomType = fixture.Create<string>(),
                Floor = fixture.Create<int>(),
                RoomCapacity = fixture.Create<string>(),
                PricePerNight = 100.50m, // Decimal değer manuel belirleniyor
                Description = fixture.Create<string>(),
                Features = features
            };
                
            mapper.Setup(m => m.Map<Room>(It.IsAny<CreateRoomCommand>()))
                .Returns(room);
                
            roomRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Room>()))
                .ReturnsAsync(room);
                
            roomRepositoryAsync.Setup(r => r.GetRoomWithDetailsAsync(It.IsAny<int>()))
                .ReturnsAsync(room);
                
            amenityRepositoryAsync.Setup(a => a.GetByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((Amenity)null); // Önce mevcut bir amenity bulunamıyor
                
            var handler = new CreateRoomCommandHandler(
                roomRepositoryAsync.Object, 
                amenityRepositoryAsync.Object, 
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createRoomCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(room.Id, result);
            amenityRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Amenity>()), Times.Exactly(features.Count));
            roomRepositoryAsync.Verify(x => x.UpdateAsync(It.IsAny<Room>()), Times.Exactly(features.Count));
        }
        
        [Fact]
        public async Task When_UpdateRoomCommandHandlerInvoked_WithExistingRoom_ShouldReturnRoomId()
        {
            // Arrange
            var room = fixture.Create<Room>();
            var emptyAmenities = new List<Amenity>();
            
            // AutoFixture'ın oluşturamayacağı UpdateRoomCommand'ı manuel oluştur
            var updateRoomCommand = new UpdateRoomCommand
            {
                Id = room.Id,
                RoomNumber = fixture.Create<int>(),
                RoomType = fixture.Create<string>(),
                Floor = fixture.Create<int>(),
                RoomCapacity = fixture.Create<string>(),
                PricePerNight = 100.50m, // Decimal değer manuel belirleniyor
                Description = fixture.Create<string>(),
                Features = new List<string>() // Boş features listesi
            };
            
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            // UpdateRoom testinde ihtiyaç duyulan ek mock'lar
            amenityRepositoryAsync.Setup(a => a.GetByRoomIdAsync(It.IsAny<int>()))
                .ReturnsAsync(emptyAmenities);
                
            var handler = new UpdateRoomCommandHandler(
                roomRepositoryAsync.Object, 
                amenityRepositoryAsync.Object, 
                mapper.Object);
            
            // Act
            var result = await handler.Handle(updateRoomCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(room.Id, result);
            roomRepositoryAsync.Verify(x => x.UpdateAsync(It.IsAny<Room>()), Times.Once);
        }
        
        [Fact]
        public async Task When_UpdateRoomCommandHandlerInvoked_WithNonExistingRoom_ShouldThrowEntityNotFoundException()
        {
            // Arrange
            // AutoFixture'ın oluşturamayacağı UpdateRoomCommand'ı manuel oluştur
            var updateRoomCommand = new UpdateRoomCommand
            {
                Id = 999, // Olmayan oda ID'si
                RoomNumber = fixture.Create<int>(),
                RoomType = fixture.Create<string>(),
                Floor = fixture.Create<int>(),
                RoomCapacity = fixture.Create<string>(),
                PricePerNight = 100.50m, // Decimal değer manuel belirleniyor
                Description = fixture.Create<string>(),
                Features = fixture.Create<List<string>>()
            };
            
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Room)null);
                
            var handler = new UpdateRoomCommandHandler(
                roomRepositoryAsync.Object, 
                amenityRepositoryAsync.Object, 
                mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<EntityNotFoundException>(() => 
                handler.Handle(updateRoomCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_UpdateRoomCommandHandlerInvoked_WithFeatures_ShouldUpdateAmenities()
        {
            // Arrange
            var room = fixture.Create<Room>();
            var currentAmenities = fixture.CreateMany<Amenity>(3).ToList();
            var features = new List<string> { "WiFi", "TV" };
            
            // AutoFixture'ın oluşturamayacağı UpdateRoomCommand'ı manuel oluştur
            var updateRoomCommand = new UpdateRoomCommand
            {
                Id = room.Id,
                RoomNumber = fixture.Create<int>(),
                RoomType = fixture.Create<string>(),
                Floor = fixture.Create<int>(),
                RoomCapacity = fixture.Create<string>(),
                PricePerNight = 100.50m, // Decimal değer manuel belirleniyor
                Description = fixture.Create<string>(),
                Features = features
            };
            
            roomRepositoryAsync.Setup(r => r.GetByIdAsync(room.Id))
                .ReturnsAsync(room);
                
            amenityRepositoryAsync.Setup(a => a.GetByRoomIdAsync(room.Id))
                .ReturnsAsync(currentAmenities);
                
            // GetByNameAsync metodunun davranışı için mock
            amenityRepositoryAsync.Setup(a => a.GetByNameAsync(It.IsAny<string>()))
                .ReturnsAsync((string name) => 
                {
                    var existingAmenity = new Amenity { Id = fixture.Create<int>(), Name = name };
                    return existingAmenity;
                });
                
            // AddAmenityToRoomAsync metodunun davranışını mock'layalım
            amenityRepositoryAsync.Setup(a => a.AddAmenityToRoomAsync(It.IsAny<int>(), It.IsAny<int>()))
                .Returns(Task.CompletedTask);
                
            var handler = new UpdateRoomCommandHandler(
                roomRepositoryAsync.Object, 
                amenityRepositoryAsync.Object, 
                mapper.Object);
            
            // Act
            var result = await handler.Handle(updateRoomCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(room.Id, result);
            amenityRepositoryAsync.Verify(x => x.RemoveAmenityFromRoomAsync(room.Id, It.IsAny<int>()), Times.Exactly(currentAmenities.Count));
            amenityRepositoryAsync.Verify(x => x.GetByNameAsync(It.IsAny<string>()), Times.Exactly(features.Count));
            amenityRepositoryAsync.Verify(x => x.AddAmenityToRoomAsync(room.Id, It.IsAny<int>()), Times.Exactly(features.Count));
        }
    }
} 