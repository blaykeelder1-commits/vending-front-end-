import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  vendorRegister: (data) => api.post('/auth/vendor/register', data),
  vendorLogin: (data) => api.post('/auth/vendor/login', data),
  customerQRLogin: (data) => api.post('/auth/customer/qr-login', data),
  verify: () => api.get('/auth/verify'),
};

// Vendor API
export const vendorAPI = {
  // Machines
  getMachines: () => api.get('/vendor/machines'),
  getMachine: (id) => api.get(`/vendor/machines/${id}`),
  createMachine: (data) => api.post('/vendor/machines', data),
  updateMachine: (id, data) => api.put(`/vendor/machines/${id}`, data),
  deleteMachine: (id) => api.delete(`/vendor/machines/${id}`),

  // Products
  getProducts: () => api.get('/vendor/products'),
  getProduct: (id) => api.get(`/vendor/products/${id}`),
  createProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),

  // Inventory
  getMachineInventory: (machineId) => api.get(`/vendor/machines/${machineId}/inventory`),
  addToInventory: (machineId, data) => api.post(`/vendor/machines/${machineId}/inventory`, data),
  updateInventory: (machineId, id, data) => api.put(`/vendor/machines/${machineId}/inventory/${id}`, data),
  removeFromInventory: (machineId, id) => api.delete(`/vendor/machines/${machineId}/inventory/${id}`),
};

// Customer API
export const customerAPI = {
  // Machine & Products
  getMachine: () => api.get('/customer/machine'),

  // Polls
  getPolls: () => api.get('/customer/polls'),
  votePoll: (pollId, data) => api.post(`/customer/polls/${pollId}/vote`, data),

  // Rebates
  getRebates: () => api.get('/customer/rebates'),
  submitRebate: (data) => api.post('/customer/rebates', data),

  // Loyalty
  getLoyalty: () => api.get('/customer/loyalty'),
  getMachineLoyalty: (machineId) => api.get(`/customer/loyalty/${machineId}`),

  // Profile
  getProfile: () => api.get('/customer/profile'),
};

export default api;
