import api from './api';

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (fullName, email, password, phone) =>
  api.post('/auth/register', { fullName, email, password, phone });
export const registerShop = (data) => api.post('/auth/register-shop', data);
export const me = () => api.get('/auth/me');
