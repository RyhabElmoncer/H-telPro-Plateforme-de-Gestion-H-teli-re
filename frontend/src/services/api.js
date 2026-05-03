import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Request interceptor: attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle auth errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ROOMS
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getAvailable: (params) => api.get('/rooms/available', { params }),
  getOne: (id) => api.get(`/rooms/${id}`),
  getAvailability: (id, params) => api.get(`/rooms/${id}/availability`, { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  archive: (id) => api.patch(`/rooms/${id}/archive`),
  restore: (id) => api.patch(`/rooms/${id}/restore`),
};

// RESERVATIONS
export const reservationsAPI = {
  create: (data) => api.post('/reservations', data),
  getAll: (params) => api.get('/reservations', { params }),
  getMy: (params) => api.get('/reservations/my', { params }),
  getOne: (id) => api.get(`/reservations/${id}`),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  updateStatus: (id, statusOrData) => api.patch(`/reservations/${id}/status`, typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData),
  cancel: (id, data) => api.patch(`/reservations/${id}/cancel`, data),
};

// PAYMENTS
export const paymentsAPI = {
  process: (data) => api.post('/payments', data),
  getMy: () => api.get('/payments/my'),
  getAll: (params) => api.get('/payments', { params }),
  refund: (id, data) => api.patch(`/payments/${id}/refund`, data),
};

// DASHBOARD
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

// USERS
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users/staff', data),
  createStaff: (data) => api.post('/users/staff', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  updatePermissions: (id, data) => api.patch(`/users/${id}/permissions`, data),
};

// NOTIFICATIONS
export const notificationsAPI = {
  sendPromo: (data) => api.post('/notifications/promo', data),
  sendTest: (data) => api.post('/notifications/test', data),
};

export default api;
