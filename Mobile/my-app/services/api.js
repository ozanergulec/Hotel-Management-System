import { Alert } from 'react-native';

// IP adresini kendi bilgisayarının yerel IP'siyle değiştir
const API_BASE_URL = 'http://localhost:5002/api';

/**
 * Authentication service to interact with the backend
 */
export const authService = {
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', email);

      if (email === "test@fail.com") {
        throw new Error('Invalid email or password');
      }

      const response = await fetch(`${API_BASE_URL}/Account/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw new Error('Invalid email or password');
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Account/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  getAllCustomers: async (pageNumber = 1, pageSize = 10, status = '') => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      let url = `${API_BASE_URL}/v1/Customer?PageNumber=${pageNumber}&PageSize=${pageSize}`;
      if (status) url += `&Status=${status}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  getCustomerById: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  createCustomer: async (customerData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${API_BASE_URL}/v1/Customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
