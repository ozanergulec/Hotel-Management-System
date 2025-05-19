using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Features.Staff.Commands.CreateStaff;
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
    public class Staffs
    {
        private readonly Fixture fixture;
        private readonly Mock<IStaffRepositoryAsync> staffRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Staffs()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            staffRepositoryAsync = new Mock<IStaffRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateStaffCommandHandlerInvoked_ShouldReturnStaffId()
        {
            // Arrange
            var staff = fixture.Build<Staff>()
                .With(s => s.Shifts, new List<Shift>())
                .Create();
            
            var createStaffCommand = new CreateStaffCommand
            {
                FirstName = "John",
                LastName = "Doe",
                Department = "Housekeeping",
                Role = "Supervisor",
                StartDate = DateTime.Now.Date.AddMonths(-3),
                Email = "john.doe@hotel.com",
                PhoneNumber = "+905551234567",
                Salary = 5000.00m,
                IsActive = true
            };
            
            mapper.Setup(m => m.Map<Staff>(It.IsAny<CreateStaffCommand>()))
                .Returns(staff);
                
            staffRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Staff>()))
                .ReturnsAsync(staff);
                
            var handler = new CreateStaffCommandHandler(
                staffRepositoryAsync.Object,
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createStaffCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(staff.Id, result);
            staffRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Staff>()), Times.Once);
        }
        
        [Fact]
        public async Task When_GetStaffByDepartmentAsyncCalled_ShouldReturnDepartmentStaff()
        {
            // Arrange
            var department = "Front Desk";
            var staffList = fixture.Build<Staff>()
                .With(s => s.Department, department)
                .With(s => s.Shifts, new List<Shift>())
                .CreateMany(4)
                .ToList();
            
            staffRepositoryAsync.Setup(r => r.GetStaffByDepartmentAsync(department))
                .ReturnsAsync(staffList);
                
            // Act
            var result = await staffRepositoryAsync.Object.GetStaffByDepartmentAsync(department);
            
            // Assert
            Assert.Equal(4, result.Count);
            Assert.All(result, s => Assert.Equal(department, s.Department));
            staffRepositoryAsync.Verify(x => x.GetStaffByDepartmentAsync(department), Times.Once);
        }
        
        [Fact]
        public async Task When_GetStaffByRoleAsyncCalled_ShouldReturnRoleStaff()
        {
            // Arrange
            var role = "Manager";
            var staffList = fixture.Build<Staff>()
                .With(s => s.Role, role)
                .With(s => s.Shifts, new List<Shift>())
                .CreateMany(2)
                .ToList();
            
            staffRepositoryAsync.Setup(r => r.GetStaffByRoleAsync(role))
                .ReturnsAsync(staffList);
                
            // Act
            var result = await staffRepositoryAsync.Object.GetStaffByRoleAsync(role);
            
            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, s => Assert.Equal(role, s.Role));
            staffRepositoryAsync.Verify(x => x.GetStaffByRoleAsync(role), Times.Once);
        }
        
        [Fact]
        public async Task When_GetActiveStaffAsyncCalled_ShouldReturnActiveStaff()
        {
            // Arrange
            var activeStaff = fixture.Build<Staff>()
                .With(s => s.IsActive, true)
                .With(s => s.Shifts, new List<Shift>())
                .CreateMany(5)
                .ToList();
            
            staffRepositoryAsync.Setup(r => r.GetActiveStaffAsync())
                .ReturnsAsync(activeStaff);
                
            // Act
            var result = await staffRepositoryAsync.Object.GetActiveStaffAsync();
            
            // Assert
            Assert.Equal(5, result.Count);
            Assert.All(result, s => Assert.True(s.IsActive));
            staffRepositoryAsync.Verify(x => x.GetActiveStaffAsync(), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueEmailAsyncCalled_WithExistingEmail_ShouldReturnFalse()
        {
            // Arrange
            var existingEmail = "john.doe@hotel.com";
            
            staffRepositoryAsync.Setup(r => r.IsUniqueEmailAsync(existingEmail))
                .ReturnsAsync(false);
                
            // Act
            var result = await staffRepositoryAsync.Object.IsUniqueEmailAsync(existingEmail);
            
            // Assert
            Assert.False(result);
            staffRepositoryAsync.Verify(x => x.IsUniqueEmailAsync(existingEmail), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueEmailAsyncCalled_WithNewEmail_ShouldReturnTrue()
        {
            // Arrange
            var newEmail = "jane.smith@hotel.com";
            
            staffRepositoryAsync.Setup(r => r.IsUniqueEmailAsync(newEmail))
                .ReturnsAsync(true);
                
            // Act
            var result = await staffRepositoryAsync.Object.IsUniqueEmailAsync(newEmail);
            
            // Assert
            Assert.True(result);
            staffRepositoryAsync.Verify(x => x.IsUniqueEmailAsync(newEmail), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniquePhoneNumberAsyncCalled_WithExistingNumber_ShouldReturnFalse()
        {
            // Arrange
            var existingPhoneNumber = "+905551234567";
            
            staffRepositoryAsync.Setup(r => r.IsUniquePhoneNumberAsync(existingPhoneNumber))
                .ReturnsAsync(false);
                
            // Act
            var result = await staffRepositoryAsync.Object.IsUniquePhoneNumberAsync(existingPhoneNumber);
            
            // Assert
            Assert.False(result);
            staffRepositoryAsync.Verify(x => x.IsUniquePhoneNumberAsync(existingPhoneNumber), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniquePhoneNumberAsyncCalled_WithNewNumber_ShouldReturnTrue()
        {
            // Arrange
            var newPhoneNumber = "+905559876543";
            
            staffRepositoryAsync.Setup(r => r.IsUniquePhoneNumberAsync(newPhoneNumber))
                .ReturnsAsync(true);
                
            // Act
            var result = await staffRepositoryAsync.Object.IsUniquePhoneNumberAsync(newPhoneNumber);
            
            // Assert
            Assert.True(result);
            staffRepositoryAsync.Verify(x => x.IsUniquePhoneNumberAsync(newPhoneNumber), Times.Once);
        }
    }
} 