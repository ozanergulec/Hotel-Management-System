using AutoFixture;
using AutoFixture.Kernel;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces;
using CleanArchitecture.Infrastructure.Contexts;
using CleanArchitecture.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.Infrastructure.Tests
{
    public class CustomerRepositoryTest
    {
        private readonly Fixture _fixture;
        private readonly Mock<ILogger<ApplicationDbContext>> _logger;
        private readonly Customer _existingCustomer;
        private readonly ApplicationDbContext _context;

        public CustomerRepositoryTest()
        {
            _fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => _fixture.Behaviors.Remove(b));
            _fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            _existingCustomer = _fixture.Create<Customer>();
            _logger = new Mock<ILogger<ApplicationDbContext>>();

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(_fixture.Create<string>());

            _context = new ApplicationDbContext(optionsBuilder.Options, _logger.Object);

            _context.Customers.Add(_existingCustomer);
            _context.SaveChanges();
        }

        [Fact]
        public async Task When_IsUniqueEmailAsyncCalledWithExistingEmail_ShouldReturnFalse()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.IsUniqueEmailAsync(_existingCustomer.Email);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task When_IsUniqueEmailAsyncCalledWithNotExistingEmail_ShouldReturnTrue()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.IsUniqueEmailAsync(_fixture.Create<string>());

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task When_IsUniquePhoneAsyncCalledWithExistingPhone_ShouldReturnFalse()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.IsUniquePhoneAsync(_existingCustomer.Phone);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task When_IsUniquePhoneAsyncCalledWithNotExistingPhone_ShouldReturnTrue()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.IsUniquePhoneAsync(_fixture.Create<string>());

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task When_GetByEmailAsyncCalledWithExistingEmail_ShouldReturnCustomer()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.GetByEmailAsync(_existingCustomer.Email);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(_existingCustomer.Id, result.Id);
        }

        [Fact]
        public async Task When_GetByEmailAsyncCalledWithNotExistingEmail_ShouldReturnNull()
        {
            // Arrange
            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.GetByEmailAsync(_fixture.Create<string>());

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task When_GetCustomersByStatusAsyncCalled_ShouldReturnMatchingCustomers()
        {
            // Arrange
            var status = "VIP";
            var vipCustomer = _fixture.Build<Customer>()
                .With(c => c.Status, status)
                .Create();

            _context.Customers.Add(vipCustomer);
            _context.SaveChanges();

            var repository = new CustomerRepositoryAsync(_context);

            // Act
            var result = await repository.GetCustomersByStatusAsync(status);

            // Assert
            Assert.NotEmpty(result);
            Assert.Contains(result, c => c.Status == status);
        }
    }
} 