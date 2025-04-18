import { Alert } from 'react-native';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5002/api'; // Using the exposed port from docker-compose

/**
 * Authentication service to interact with the backend
 */
export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Response from the API
   */
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      
      // For testing purposes - simulate a failed login
      if (email === "test@fail.com") {
        console.log('Simulating failed login for testing');
        throw new Error('Invalid email or password');
      }
      
      const response = await fetch(`${API_BASE_URL}/Account/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log('Login response status:', response.status);

      if (!response.ok) {
        console.error('Login failed with status:', response.status);
        throw new Error(data.message || 'Invalid email or password');
      }

      console.log('Login successful');
      return data;
    } catch (error) {
      console.error('Login error details:', error.message);
      // Explicitly throw a user-friendly error
      throw new Error('Invalid email or password');
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Response from the API
   */
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Forgot password request
   * @param {string} email - User's email address
   * @returns {Promise<Object>} - Response from the API
   */
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Forgot password request failed');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },
}; 