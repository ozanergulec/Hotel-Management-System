using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Features.Expense.Commands.CreateExpense;
using CleanArchitecture.Core.Interfaces.Repositories;
using Moq;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.UnitTests
{
    public class Expenses
    {
        private readonly Fixture fixture;
        private readonly Mock<IExpenseRepositoryAsync> expenseRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Expenses()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            expenseRepositoryAsync = new Mock<IExpenseRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateExpenseCommandHandlerInvoked_ShouldReturnExpenseId()
        {
            // Arrange
            var expense = fixture.Create<Expense>();
            
            var createExpenseCommand = new CreateExpenseCommand
            {
                ExpenseNumber = "EXP2207123",
                Date = DateTime.Now.Date,
                Category = "Personnel",
                Description = "Monthly salaries",
                Amount = 2500.75m
            };
            
            mapper.Setup(m => m.Map<Expense>(It.IsAny<CreateExpenseCommand>()))
                .Returns(expense);
                
            expenseRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Expense>()))
                .ReturnsAsync(expense);
                
            var handler = new CreateExpenseCommandHandler(
                expenseRepositoryAsync.Object,
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createExpenseCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(expense.Id, result);
            expenseRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Expense>()), Times.Once);
        }
        
        [Fact]
        public async Task When_CreateExpenseCommandHandlerInvoked_WithoutExpenseNumber_ShouldGenerateExpenseNumber()
        {
            // Arrange
            Expense capturedExpense = null;
            
            expenseRepositoryAsync.Setup(r => r.AddAsync(It.IsAny<Expense>()))
                .Callback<Expense>(expense => capturedExpense = expense)
                .ReturnsAsync((Expense expense) => expense);
                
            mapper.Setup(m => m.Map<Expense>(It.IsAny<CreateExpenseCommand>()))
                .Returns((CreateExpenseCommand cmd) => new Expense 
                { 
                    Id = 1,
                    ExpenseNumber = cmd.ExpenseNumber,
                    Date = cmd.Date,
                    Category = cmd.Category,
                    Description = cmd.Description,
                    Amount = cmd.Amount
                });
                
            var createExpenseCommand = new CreateExpenseCommand
            {
                // ExpenseNumber not provided
                Date = DateTime.Now.Date,
                Category = "Maintenance",
                Description = "Plumbing repairs",
                Amount = 350.00m
            };
            
            var handler = new CreateExpenseCommandHandler(
                expenseRepositoryAsync.Object,
                mapper.Object);
                
            // Act
            var result = await handler.Handle(createExpenseCommand, CancellationToken.None);
            
            // Assert
            Assert.NotNull(createExpenseCommand.ExpenseNumber);
            Assert.StartsWith("EXP", createExpenseCommand.ExpenseNumber);
            Assert.Equal(10, createExpenseCommand.ExpenseNumber.Length); // Format: EXPyyMMnnn
        }
        
        [Fact]
        public async Task When_GetDailyExpenseAsyncCalled_ShouldReturnTotalDailyExpense()
        {
            // Arrange
            var date = DateTime.Now.Date;
            var expectedAmount = 750.25m;
            
            expenseRepositoryAsync.Setup(r => r.GetDailyExpenseAsync(date))
                .ReturnsAsync(expectedAmount);
                
            // Act
            var result = await expenseRepositoryAsync.Object.GetDailyExpenseAsync(date);
            
            // Assert
            Assert.Equal(expectedAmount, result);
            expenseRepositoryAsync.Verify(x => x.GetDailyExpenseAsync(date), Times.Once);
        }
        
        [Fact]
        public async Task When_GetExpensesByDateRangeAsyncCalled_ShouldReturnExpensesInRange()
        {
            // Arrange
            var startDate = DateTime.Now.Date.AddDays(-7);
            var endDate = DateTime.Now.Date;
            var expenses = fixture.CreateMany<Expense>(5).ToList();
            
            expenseRepositoryAsync.Setup(r => r.GetExpensesByDateRangeAsync(startDate, endDate))
                .ReturnsAsync(expenses);
                
            // Act
            var result = await expenseRepositoryAsync.Object.GetExpensesByDateRangeAsync(startDate, endDate);
            
            // Assert
            Assert.Equal(5, result.Count);
            expenseRepositoryAsync.Verify(x => x.GetExpensesByDateRangeAsync(startDate, endDate), Times.Once);
        }
        
        [Fact]
        public async Task When_GetExpensesByCategoryAsyncCalled_ShouldReturnCategoryExpenses()
        {
            // Arrange
            var category = "Personnel";
            var expenses = fixture.Build<Expense>()
                .With(e => e.Category, category)
                .CreateMany(3)
                .ToList();
            
            expenseRepositoryAsync.Setup(r => r.GetExpensesByCategoryAsync(category))
                .ReturnsAsync(expenses);
                
            // Act
            var result = await expenseRepositoryAsync.Object.GetExpensesByCategoryAsync(category);
            
            // Assert
            Assert.Equal(3, result.Count);
            Assert.All(result, e => Assert.Equal(category, e.Category));
            expenseRepositoryAsync.Verify(x => x.GetExpensesByCategoryAsync(category), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueExpenseNumberAsyncCalled_WithExistingNumber_ShouldReturnFalse()
        {
            // Arrange
            var existingExpenseNumber = "EXP2207123";
            
            expenseRepositoryAsync.Setup(r => r.IsUniqueExpenseNumberAsync(existingExpenseNumber))
                .ReturnsAsync(false);
                
            // Act
            var result = await expenseRepositoryAsync.Object.IsUniqueExpenseNumberAsync(existingExpenseNumber);
            
            // Assert
            Assert.False(result);
            expenseRepositoryAsync.Verify(x => x.IsUniqueExpenseNumberAsync(existingExpenseNumber), Times.Once);
        }
        
        [Fact]
        public async Task When_IsUniqueExpenseNumberAsyncCalled_WithNewNumber_ShouldReturnTrue()
        {
            // Arrange
            var newExpenseNumber = "EXP2207999";
            
            expenseRepositoryAsync.Setup(r => r.IsUniqueExpenseNumberAsync(newExpenseNumber))
                .ReturnsAsync(true);
                
            // Act
            var result = await expenseRepositoryAsync.Object.IsUniqueExpenseNumberAsync(newExpenseNumber);
            
            // Assert
            Assert.True(result);
            expenseRepositoryAsync.Verify(x => x.IsUniqueExpenseNumberAsync(newExpenseNumber), Times.Once);
        }
    }
} 