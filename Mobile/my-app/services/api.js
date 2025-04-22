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

  /**
   * Update an existing customer
   * @param {number} id - Customer ID
   * @param {Object} customerData - Customer data to update
   * @returns {Promise<Object>} - Response from the API
   */
  updateCustomer: async (id, customerData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      // Check if the response has content before parsing JSON
      const responseText = await response.text();
      let data = null;
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // Handle cases where response is not JSON but still indicates success (e.g., 204 No Content)
          if (!response.ok) {
            console.error('Error parsing update response:', parseError);
            throw new Error('Failed to parse server response.');
          }
          // If response is OK but not JSON (like 204), return success indicator
          return { success: true }; 
        }
      } else if (!response.ok) {
         // If response is empty and not OK, throw error
         throw new Error('Failed to update customer with status: ' + response.status);
      }


      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update customer');
      }

      // Return the parsed data or a success indicator if no content
      return data || { success: true };
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  /**
   * Delete a customer
   * @param {number} id - Customer ID
   * @returns {Promise<Object>} - Response from the API (likely empty on success)
   */
  deleteCustomer: async (id) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`[customerService.deleteCustomer] Attempting fetch DELETE for ID: ${id}`); // Log: Before fetch

      const response = await fetch(`${API_BASE_URL}/v1/Customer/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // DELETE often returns 204 No Content on success
      if (!response.ok && response.status !== 204) {
         // Try to parse error message if available
         let errorMessage = 'Failed to delete customer';
         try {
           const errorData = await response.json();
           errorMessage = errorData.message || errorMessage;
         } catch (e) {
           // Ignore parsing error if body is empty or not JSON
         }
         throw new Error(errorMessage);
      }

      return { success: true }; // Indicate success
    } catch (error) {
      console.error('Error deleting customer:', error);
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
