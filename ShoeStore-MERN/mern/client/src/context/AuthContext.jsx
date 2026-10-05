import { createContext, useContext, useState, useCallback } from 'react';
import * as authApi from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [shop, setShop] = useState(() => {
    const raw = localStorage.getItem('shop');
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token, u, s) => {
    if (token) localStorage.setItem('token', token);
    if (u) localStorage.setItem('user', JSON.stringify(u));
    if (s) localStorage.setItem('shop', JSON.stringify(s));
    else localStorage.removeItem('shop');
    setUser(u || null);
    setShop(s || null);
  };

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authApi.login(email, password);
      persist(data.token, data.user, data.shop);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid email or password. Please try again.' };
    }
  }, []);

  const register = useCallback(async (fullName, email, password, phone) => {
    try {
      const { data } = await authApi.register(fullName, email, password, phone);
      persist(data.token, data.user, null);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not create account.' };
    }
  }, []);

  const registerShop = useCallback(async (payload) => {
    try {
      const { data } = await authApi.registerShop(payload);
      persist(null, data.user, data.shop);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not create shop.' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shop');
    setUser(null);
    setShop(null);
  }, []);

  const value = {
    currentUser: user,
    currentShop: shop,
    isAuthenticated: !!user,
    hasShop: !!shop,
    login,
    register,
    registerShop,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
