﻿using System.ComponentModel.DataAnnotations;

namespace CleanArchitecture.Core.DTOs.Account
{
    public class RegisterRequest
    {
        [Required]
        public string FirstName { get; set; }

        [Required]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        [MinLength(6)]
        public string UserName { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; }
        
        [Required(ErrorMessage = "Role is required.")]
        public string Role { get; set; }
    }
}
