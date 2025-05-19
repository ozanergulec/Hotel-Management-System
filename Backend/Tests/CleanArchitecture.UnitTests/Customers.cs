using AutoFixture;
using AutoFixture.Kernel;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Features.Customers.Commands.CreateCustomer;
using CleanArchitecture.Core.Features.Customers.Commands.UpdateCustomer;
using CleanArchitecture.Core.Interfaces.Repositories;
using Moq;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CleanArchitecture.UnitTests
{
    public class Customers
    {
        private readonly Fixture fixture;
        private readonly Mock<ICustomerRepositoryAsync> customerRepositoryAsync;
        private readonly Mock<IMapper> mapper;

        public Customers()
        {
            fixture = new Fixture();
            
            // AutoFixture'ın dairesel referansları işlemesi için yapılandırma
            fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
                .ForEach(b => fixture.Behaviors.Remove(b));
            fixture.Behaviors.Add(new OmitOnRecursionBehavior());
            
            customerRepositoryAsync = new Mock<ICustomerRepositoryAsync>();
            mapper = new Mock<IMapper>();
        }

        [Fact]
        public async Task When_CreateCustomerCommandHandlerInvoked_ShouldReturnCustomerId()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var createCustomerCommand = fixture.Create<CreateCustomerCommand>();
            
            mapper.Setup(m => m.Map<Customer>(It.IsAny<CreateCustomerCommand>()))
                .Returns(customer);
                
            customerRepositoryAsync.Setup(cr => cr.AddAsync(It.IsAny<Customer>()))
                .ReturnsAsync(customer);
            
            var handler = new CreateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            var cancellationToken = fixture.Create<CancellationToken>();
            
            // Act
            var result = await handler.Handle(createCustomerCommand, cancellationToken);
            
            // Assert
            Assert.Equal(customer.Id, result);
            customerRepositoryAsync.Verify(x => x.AddAsync(It.IsAny<Customer>()), Times.Once);
        }
        
        [Fact]
        public async Task When_CreateCustomerCommandHandlerInvoked_ShouldMapCommandToCustomer()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var createCustomerCommand = fixture.Create<CreateCustomerCommand>();
            
            mapper.Setup(m => m.Map<Customer>(It.IsAny<CreateCustomerCommand>()))
                .Returns(customer);
                
            customerRepositoryAsync.Setup(cr => cr.AddAsync(It.IsAny<Customer>()))
                .ReturnsAsync(customer);
            
            var handler = new CreateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            var cancellationToken = fixture.Create<CancellationToken>();
            
            // Act
            await handler.Handle(createCustomerCommand, cancellationToken);
            
            // Assert
            mapper.Verify(x => x.Map<Customer>(createCustomerCommand), Times.Once);
        }

        [Fact]
        public async Task When_UpdateCustomerCommandHandlerInvoked_WithExistingCustomer_ShouldReturnCustomerId()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var updateCustomerCommand = fixture.Build<UpdateCustomerCommand>()
                .With(x => x.Id, customer.Id)
                .With(x => x.Email, customer.Email) // Aynı e-posta
                .With(x => x.Phone, customer.Phone) // Aynı telefon
                .Create();
            
            customerRepositoryAsync.Setup(cr => cr.GetByIdAsync(customer.Id))
                .ReturnsAsync(customer);
                
            var handler = new UpdateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            
            // Act
            var result = await handler.Handle(updateCustomerCommand, CancellationToken.None);
            
            // Assert
            Assert.Equal(customer.Id, result);
            customerRepositoryAsync.Verify(x => x.UpdateAsync(It.IsAny<Customer>()), Times.Once);
        }
        
        [Fact]
        public async Task When_UpdateCustomerCommandHandlerInvoked_WithNonExistingCustomer_ShouldThrowEntityNotFoundException()
        {
            // Arrange
            var updateCustomerCommand = fixture.Create<UpdateCustomerCommand>();
            
            customerRepositoryAsync.Setup(cr => cr.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Customer)null);
                
            var handler = new UpdateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<EntityNotFoundException>(() => 
                handler.Handle(updateCustomerCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_UpdateCustomerCommandHandlerInvoked_WithNonUniqueEmail_ShouldThrowValidationException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var updateCustomerCommand = fixture.Build<UpdateCustomerCommand>()
                .With(x => x.Id, customer.Id)
                .With(x => x.Email, "different@email.com") // Farklı e-posta
                .Create();
            
            customerRepositoryAsync.Setup(cr => cr.GetByIdAsync(customer.Id))
                .ReturnsAsync(customer);
                
            customerRepositoryAsync.Setup(cr => cr.IsUniqueEmailAsync(updateCustomerCommand.Email))
                .ReturnsAsync(false); // E-posta unique değil
                
            var handler = new UpdateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(updateCustomerCommand, CancellationToken.None));
        }
        
        [Fact]
        public async Task When_UpdateCustomerCommandHandlerInvoked_WithNonUniquePhone_ShouldThrowValidationException()
        {
            // Arrange
            var customer = fixture.Create<Customer>();
            var updateCustomerCommand = fixture.Build<UpdateCustomerCommand>()
                .With(x => x.Id, customer.Id)
                .With(x => x.Email, customer.Email) // Aynı e-posta
                .With(x => x.Phone, "123456789") // Farklı telefon
                .Create();
            
            customerRepositoryAsync.Setup(cr => cr.GetByIdAsync(customer.Id))
                .ReturnsAsync(customer);
                
            customerRepositoryAsync.Setup(cr => cr.IsUniquePhoneAsync(updateCustomerCommand.Phone))
                .ReturnsAsync(false); // Telefon unique değil
                
            var handler = new UpdateCustomerCommandHandler(customerRepositoryAsync.Object, mapper.Object);
            
            // Act & Assert
            await Assert.ThrowsAsync<ValidationException>(() => 
                handler.Handle(updateCustomerCommand, CancellationToken.None));
        }
    }
} 