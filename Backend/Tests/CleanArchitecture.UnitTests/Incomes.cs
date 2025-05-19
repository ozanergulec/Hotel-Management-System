using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Features.Income.Commands.CreateIncome;
using CleanArchitecture.Core.Interfaces.Repositories;
using Moq;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.UnitTests
{
    public class Incomes
    {
        private readonly Fixture fixture;
        private readonly Mock<IIncomeRepositoryAsync> incomeRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Incomes()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            incomeRepositoryAsync = new Mock<IIncomeRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateIncomeCommandHandlerInvoked_ShouldReturnIncomeId()
        {
            // Arrange
            var income = fixture.Create<Income>();
            
            var createIncomeCommand = new CreateIncomeCommand
            {
                IncomeNumber = "IN2207123",
                Date = DateTime.Now.Date,
                CustomerName = "John Doe",
                RoomNumber = "101",
                Amount = 150.75m
            };
            
            mapper.Setup(m => m.Map<Income>(It.IsAny<CreateIncomeCommand>()))
                .Returns(income);
                
            incomeRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Income>()))
                .ReturnsAsync(income);
                
            var handler = new CreateIncomeCommandHandler(
                incomeRepositoryAsync.Object,
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createIncomeCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(income.Id, result);
            incomeRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Income>()), Times.Once);
        }
        
        [Fact]
        public async Task When_CreateIncomeCommandHandlerInvoked_WithoutIncomeNumber_ShouldGenerateIncomeNumber()
        {
            // Arrange
            Income capturedIncome = null;
            
            incomeRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Income>()))
                .Callback<Income>(income => capturedIncome = income)
                .ReturnsAsync((Income income) => income);
                
            mapper.Setup(m => m.Map<Income>(It.IsAny<CreateIncomeCommand>()))
                .Returns((CreateIncomeCommand cmd) => new Income 
                { 
                    Id = 1,
                    IncomeNumber = cmd.IncomeNumber,
                    Date = cmd.Date,
                    CustomerName = cmd.CustomerName,
                    RoomNumber = cmd.RoomNumber,
                    Amount = cmd.Amount
                });
                
            var createIncomeCommand = new CreateIncomeCommand
            {
                // IncomeNumber not provided
                Date = DateTime.Now.Date,
                CustomerName = "Jane Smith",
                RoomNumber = "102",
                Amount = 200.50m
            };
            
            var handler = new CreateIncomeCommandHandler(
                incomeRepositoryAsync.Object,
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createIncomeCommand, CancellationToken.None);
            
            // Assert
            Assert.NotNull(createIncomeCommand.IncomeNumber);
            Assert.StartsWith("IN", createIncomeCommand.IncomeNumber);
            Assert.Equal(9, createIncomeCommand.IncomeNumber.Length); // Format: INyyMMnnn
        }
        
        [Fact]
        public async Task When_GetDailyIncomeAsyncCalled_ShouldReturnTotalDailyIncome()
        {
            // Arrange
            var date = DateTime.Now.Date;
            var expectedAmount = 500.25m;
            
            incomeRepositoryAsync.Setup(r => r.GetDailyIncomeAsync(date))
                .ReturnsAsync(expectedAmount);
                
            // Act
            var result = await incomeRepositoryAsync.Object.GetDailyIncomeAsync(date);
            
            // Assert
            Assert.Equal(expectedAmount, result);
            incomeRepositoryAsync.Verify(x => x.GetDailyIncomeAsync(date), Times.Once);
        }
        
        [Fact]
        public async Task When_GetIncomesByDateRangeAsyncCalled_ShouldReturnIncomesInRange()
        {
            // Arrange
            var startDate = DateTime.Now.Date.AddDays(-7);
            var endDate = DateTime.Now.Date;
            var incomes = fixture.CreateMany<Income>(5).ToList();
            
            incomeRepositoryAsync.Setup(r => r.GetIncomesByDateRangeAsync(startDate, endDate))
                .ReturnsAsync(incomes);
                
            // Act
            var result = await incomeRepositoryAsync.Object.GetIncomesByDateRangeAsync(startDate, endDate);
            
            // Assert
            Assert.Equal(5, result.Count);
            incomeRepositoryAsync.Verify(x => x.GetIncomesByDateRangeAsync(startDate, endDate), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueIncomeNumberAsyncCalled_WithExistingNumber_ShouldReturnFalse()
        {
            // Arrange
            var existingIncomeNumber = "IN2207123";
            
            incomeRepositoryAsync.Setup(r => r.IsUniqueIncomeNumberAsync(existingIncomeNumber))
                .ReturnsAsync(false);
                
            // Act
            var result = await incomeRepositoryAsync.Object.IsUniqueIncomeNumberAsync(existingIncomeNumber);
            
            // Assert
            Assert.False(result);
            incomeRepositoryAsync.Verify(x => x.IsUniqueIncomeNumberAsync(existingIncomeNumber), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueIncomeNumberAsyncCalled_WithNewNumber_ShouldReturnTrue()
        {
            // Arrange
            var newIncomeNumber = "IN2207999";
            
            incomeRepositoryAsync.Setup(r => r.IsUniqueIncomeNumberAsync(newIncomeNumber))
                .ReturnsAsync(true);
                
            // Act
            var result = await incomeRepositoryAsync.Object.IsUniqueIncomeNumberAsync(newIncomeNumber);
            
            // Assert
            Assert.True(result);
            incomeRepositoryAsync.Verify(x => x.IsUniqueIncomeNumberAsync(newIncomeNumber), Times.Once);
        }
    }
} 