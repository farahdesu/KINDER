import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper functions to use sessionStorage (tab-specific) instead of localStorage (shared)
const storage = {
  getToken: () => sessionStorage.getItem('token'),
  getUser: () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setToken: (token) => sessionStorage.setItem('token', token),
  setUser: (user) => sessionStorage.setItem('user', JSON.stringify(user)),
  clear: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }
};

// Export storage helper for use in other components
export { storage };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load (supports page refresh)
    const token = storage.getToken();
    const storedUser = storage.getUser();
    
    if (token && storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      
      // Check if user is rejected (status 200 but rejection message)
      if (response.data.message === 'rejected') {
        return {
          success: false,
          error: 'rejected',
          userData: response.data.data
        };
      }
      
      const { token, user: userData } = response.data;
      
      // Store in sessionStorage (tab-specific)
      storage.setToken(token);
      storage.setUser(userData);
      
      // Update state
      setUser(userData);
      
      return { success: true, data: userData };
    } catch (error) {
      // Check if it's a rejection response
      if (error.response?.data?.message === 'rejected') {
        return {
          success: false,
          error: 'rejected',
          userData: error.response?.data?.data
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      
      const { token, user: newUser } = response.data;
      
      // Store in sessionStorage
      storage.setToken(token);
      storage.setUser(newUser);
      
      // Update state
      setUser(newUser);
      
      return { success: true, data: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    storage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    storage // Export storage for components that need direct access
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};