import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data?.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  vendorRegister: (data) => api.post('/auth/vendor/register', data),
  vendorLogin: (data) => api.post('/auth/vendor/login', data),
  verifyEmail: (data) => api.post('/auth/vendor/verify-email', data),
  resendVerification: (data) => api.post('/auth/vendor/resend-verification', data),
  forgotPassword: (data) => api.post('/auth/vendor/forgot-password', data),
  resetPassword: (data) => api.post('/auth/vendor/reset-password', data),
  verify: () => api.get('/auth/verify'),
};

// Vendor API
export const vendorAPI = {
  // Machines
  getMachines: () => api.get('/vendor/machines'),
  getMachine: (id) => api.get(`/vendor/machines/${id}`),
  getMachineQR: (id) => api.get(`/vendor/machines/${id}/qr`),
  createMachine: (data) => api.post('/vendor/machines', data),
  updateMachine: (id, data) => api.put(`/vendor/machines/${id}`, data),
  deleteMachine: (id) => api.delete(`/vendor/machines/${id}`),

  // Products
  getProducts: () => api.get('/vendor/products'),
  getProduct: (id) => api.get(`/vendor/products/${id}`),
  createProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),

  // Inventory (Planogram)
  getMachineInventory: (machineId) => api.get(`/vendor/machines/${machineId}/inventory`),
  addToInventory: (machineId, data) => api.post(`/vendor/machines/${machineId}/inventory`, data),
  updateInventory: (machineId, id, data) => api.put(`/vendor/machines/${machineId}/inventory/${id}`, data),
  removeFromInventory: (machineId, id) => api.delete(`/vendor/machines/${machineId}/inventory/${id}`),

  // Performance tracking
  setPerformance: (machineId, inventoryId, data) =>
    api.put(`/vendor/machines/${machineId}/inventory/${inventoryId}/performance`, data),
  getPerformanceComparison: (productId) =>
    api.get(`/vendor/performance-comparison?productId=${productId}`),

  // Top 50 Products
  getTopProducts: () => api.get('/vendor/top-products'),

  // Swipe Polls
  getMachinePolls: (machineId) => api.get(`/vendor/machines/${machineId}/polls`),
  createPoll: (machineId, data) => api.post(`/vendor/machines/${machineId}/polls`, data),
  getPollResults: (pollId) => api.get(`/vendor/polls/${pollId}/results`),
  getSwipeResults: (machineId) => api.get(`/vendor/machines/${machineId}/swipe-results`),

  // Product Redistribution
  getRedistributionTargets: (machineId, productId) =>
    api.get(`/vendor/machines/${machineId}/redistribution-targets?productId=${productId}`),
  executeRedistribution: (data) => api.post('/vendor/redistribution', data),
  getRedistributionHistory: (machineId, limit = 50) =>
    api.get(`/vendor/redistribution-history?machineId=${machineId}&limit=${limit}`),

  // Route Plan - Global redistribution view
  getRedistributionPlan: () => api.get('/vendor/redistribution-plan'),

  // Machine Notes
  updateMachineNotes: (machineId, notes) =>
    api.put(`/vendor/machines/${machineId}/notes`, { notes }),

  // Product Suggestions
  getSuggestions: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/vendor/suggestions${queryParams ? '?' + queryParams : ''}`);
  },
  updateSuggestion: (id, data) => api.put(`/vendor/suggestions/${id}`, data),

  // Expiration Tracking
  getExpiringProducts: (days = 14) =>
    api.get(`/vendor/expiring-products?days=${days}`),
  updateExpirationDate: (machineId, inventoryId, expirationDate) =>
    api.put(`/vendor/machines/${machineId}/inventory/${inventoryId}/expiration`, { expirationDate }),
};

// Customer API (Anonymous)
export const customerAPI = {
  // Machine session
  setMachine: (data) => api.post('/customer/set-machine', data),
  getMachine: () => api.get('/customer/machine'),

  // Swipe Polls
  getPolls: () => api.get('/customer/polls'),
  votePoll: (pollId, data) => api.post(`/customer/polls/${pollId}/vote`, data),
  getPollResults: (pollId) => api.get(`/customer/polls/${pollId}/results`),

  // Product Suggestions
  submitSuggestion: (suggestion) => api.post('/customer/suggestions', { suggestion }),
};

// Public API (no auth)
export const publicAPI = {
  resolveMachineQR: (qr_token) => api.get(`/auth/public/machines/by-qr/${qr_token}`),
};

export default api;
