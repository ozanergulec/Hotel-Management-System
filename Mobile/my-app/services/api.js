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

/**
 * Customer service to interact with the backend
 */
export const customerService = {
  /**
   * Get all customers with pagination
   * @param {number} pageNumber - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @param {string} status - Optional filter by status
   * @returns {Promise<Object>} - Response from the API with paged customer data
   */
  getAllCustomers: async (pageNumber = 1, pageSize = 10, status = '') => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      let url = `${API_BASE_URL}/v1/Customer?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      if (status) {
        url += `&Status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:8080',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  /**
   * Get customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} - Customer data
   */
  getCustomerById: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:8080',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customer');
      }

      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data to create
   * @returns {Promise<Object>} - Response from the API
   */
  createCustomer: async (customerData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/v1/Customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:8080',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }

      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },
};

/**
 * Helper function to get the auth token from AsyncStorage
 * @returns {Promise<string|null>} - The auth token or null if not found
 */
const getAuthToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}; 