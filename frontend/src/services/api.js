import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inicialização síncrona do header de autorização a partir do localStorage no carregamento do módulo
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('dictadle_token') : null;
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('dictadle_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('dictadle_token');
  }
};

// Interceptor de requisição: assegura que o token atualizado sempre acompanhe requisições da API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dictadle_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de resposta: captura 401 (sessão expirada/inválida) e purga credenciais do localStorage
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        setAuthToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  login2FA: (tempToken, code) => api.post('/auth/login/2fa', { temp_token: tempToken, code }),
  register: (username, email, password, role = 'student') =>
    api.post('/auth/register', { username, email, password, role }),
  setup2FA: (userId) => api.post('/auth/2fa/setup', { user_id: userId }),
  confirmSetup2FA: (userId, code) => api.post('/auth/2fa/confirm-setup', { user_id: userId, code }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (username, email) => api.put('/auth/profile', { username, email }),
  changePassword: (current_password, new_password) =>
    api.put('/auth/change-password', { current_password, new_password }),
  deleteAccount: (userId, hard = false) =>
    api.delete(`/users/${userId}${hard ? '?hard=true' : ''}`),
  deleteUser: (userId, hard = false) =>
    api.delete(`/users/${userId}${hard ? '?hard=true' : ''}`),
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
};

export const challengeService = {
  getPlayback: (challengeId) => api.get(`/challenges/${challengeId}/playback`),
  getDailyPlayback: () => api.get('/challenges/daily/playback'),
};

export default api;
