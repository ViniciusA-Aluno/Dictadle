import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('dictadle_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('dictadle_token');
  }
};

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  login2FA: (tempToken, code) => api.post('/auth/login/2fa', { temp_token: tempToken, code }),
  register: (username, email, password, role = 'student') =>
    api.post('/auth/register', { username, email, password, role }),
  setup2FA: (userId) => api.post('/auth/2fa/setup', { user_id: userId }),
  confirmSetup2FA: (userId, code) => api.post('/auth/2fa/confirm-setup', { user_id: userId, code }),
  deleteAccount: (userId, hard = false) =>
    api.delete(`/auth/users/${userId}${hard ? '?hard=true' : ''}`),
};

export default api;
