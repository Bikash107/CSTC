import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cstc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (data) => api.post('/register', data);
export const login = (data) => api.post('/login', data);

// Tickets
export const getTickets = () => api.get('/tickets');
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post('/tickets', data);
export const updateTicket = (id, data) => api.patch(`/tickets/${id}`, data);

// Comments
export const getComments = (ticketId) => api.get(`/tickets/${ticketId}/comments`);
export const addComment = (ticketId, data) => api.post(`/tickets/${ticketId}/comments`, data);

// Attachments
export const getAttachments = (ticketId) => api.get(`/tickets/${ticketId}/attachments`);
export const uploadAttachment = (ticketId, formData) =>
  api.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Admin
export const getStats = () => api.get('/stats');
export const getUsers = () => api.get('/users');
export const updateUserRole = (userId, role) => api.patch(`/users/${userId}/role`, { role });

export default api;
