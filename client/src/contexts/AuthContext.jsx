import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Setup Axios Interceptor for Auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token');
  // Only attach token to our own API, not external ones like OSRM maps
  if (token && config.url.startsWith(API)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ss_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await axios.get(`${API}/auth/me`);
        setUser(data);
      } catch {
        localStorage.removeItem('ss_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('ss_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/auth/register`, payload);
    localStorage.setItem('ss_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
    return data;
  }, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    const { data } = await axios.post(`${API}/auth/reset-password`, { email, code, newPassword });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ss_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, requestPasswordReset, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
