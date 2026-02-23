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

// Track whether a token refresh is in progress to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Cross-tab token refresh sync via BroadcastChannel
const tokenChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('token-refresh')
  : null;

if (tokenChannel) {
  tokenChannel.onmessage = (event) => {
    const { type, accessToken, refreshToken } = event.data;
    if (type === 'TOKEN_REFRESHED' && accessToken) {
      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      // Resolve any queued requests in this tab
      processQueue(null, accessToken);
      isRefreshing = false;
    } else if (type === 'TOKEN_REFRESH_FAILED') {
      processQueue(new Error('Token refresh failed in another tab'), null);
      isRefreshing = false;
    }
  };
}

// Response interceptor for error handling and automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (no response)
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.userMessage = 'Unable to connect to server. Please check your internet connection.';
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';

    // Attempt token refresh on 401, but not for auth endpoints or already-retried requests
    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          // Notify other tabs about the new token
          if (tokenChannel) {
            tokenChannel.postMessage({ type: 'TOKEN_REFRESHED', accessToken, refreshToken: newRefreshToken });
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          if (tokenChannel) {
            tokenChannel.postMessage({ type: 'TOKEN_REFRESH_FAILED' });
          }
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/verify-email') && !currentPath.includes('/reset-password')) {
            window.location.href = '/vendor/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Handle 429 Too Many Requests - auto-retry after delay
    if (status === 429 && !originalRequest._rateLimitRetry) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
      const waitMs = retryAfter * 1000;
      error.userMessage = `Too many requests. Retrying in ${retryAfter} seconds...`;
      originalRequest._rateLimitRetry = true;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return api(originalRequest);
    }
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after'] || '60';
      error.userMessage = `Rate limited. Please wait ${retryAfter} seconds before trying again.`;
      return Promise.reject(error);
    }

    console.error('API Error:', status, message);

    // Handle 401 Unauthorized - clear auth and redirect to login
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      error.userMessage = 'Session expired. Please log in again.';

      // Only redirect if not already on login/auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/verify-email') && !currentPath.includes('/reset-password')) {
        window.location.href = '/vendor/login';
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      error.userMessage = 'You do not have permission to perform this action.';
    }

    // Handle 404 Not Found
    if (status === 404) {
      error.userMessage = message || 'The requested resource was not found.';
    }

    // Handle 500 Server Error
    if (status >= 500) {
      error.userMessage = 'Server error. Please try again later.';
    }

    // Use server message if available, otherwise use our custom message
    error.userMessage = error.userMessage || message;

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  vendorRegister: (data) => api.post('/auth/vendor/register', data),
  vendorLogin: (data) => api.post('/auth/vendor/login', data),
  vendorGoogleLogin: (data) => api.post('/auth/vendor/google', data),
  vendorGoogleCodeExchange: (data) => api.post('/auth/vendor/google/callback', data),
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
  commitPerformance: (machineId, data) =>
    api.post(`/vendor/machines/${machineId}/performance-commit`, data),
  getPerformanceComparison: (productId) =>
    api.get(`/vendor/performance-comparison?productId=${productId}`),

  // Top 50 Products
  getTopProducts: () => api.get('/vendor/top-products'),

  // Swipe Polls
  getMachinePolls: (machineId) => api.get(`/vendor/machines/${machineId}/polls`),
  createPoll: (machineId, data) => api.post(`/vendor/machines/${machineId}/polls`, data),
  getPollResults: (pollId) => api.get(`/vendor/polls/${pollId}/results`),
  getSwipeResults: (machineId) => api.get(`/vendor/machines/${machineId}/swipe-results`),
  getPollSummary: () => api.get('/vendor/poll-summary'),
  getShoppingList: () => api.get('/vendor/shopping-list'),

  // Product Redistribution
  getRedistributionTargets: (machineId, productId) =>
    api.get(`/vendor/machines/${machineId}/redistribution-targets?productId=${productId}`),
  executeRedistribution: (data) => api.post('/vendor/redistribution', data),
  executeBatchRedistribution: (data) => api.post('/vendor/redistribution/batch', data),
  getAutoDistribute: (machineId) => api.get(`/vendor/machines/${machineId}/auto-distribute`),
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

  // Visit History / Memory
  getChangesSinceVisit: (machineId) =>
    api.get(`/vendor/machines/${machineId}/changes-since-visit`),
  getMachineHistory: (machineId, limit = 50, offset = 0) =>
    api.get(`/vendor/machines/${machineId}/history?limit=${limit}&offset=${offset}`),

  // Central Inventory
  getInventory: () => api.get('/vendor/inventory'),
  logPurchase: (data) => api.post('/vendor/inventory/purchase', data),
  adjustInventory: (data) => api.post('/vendor/inventory/adjust', data),
  updateReorderThreshold: (productId, threshold) =>
    api.put(`/vendor/inventory/${productId}/threshold`, { threshold }),
  getInventoryTransactions: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/vendor/inventory/transactions${queryParams ? '?' + queryParams : ''}`);
  },
  getInventoryAlerts: () => api.get('/vendor/inventory/alerts'),

  // Analytics
  getAnalyticsOverview: () => api.get('/analytics/overview'),
  getMachineAnalytics: (machineId) => api.get(`/analytics/machines/${machineId}`),
  getMachineRealtimeStats: (machineId) => api.get(`/analytics/machines/${machineId}/realtime`),
  getEngagementRankings: () => api.get('/analytics/engagement'),
  getDailyAnalytics: (days = 30) => api.get(`/analytics/daily?days=${days}`),
};

// Customer API (Anonymous)
export const customerAPI = {
  // Combined init: resolve QR + create session + check completion + load polls (1 round trip)
  initSession: (qr_token) => {
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return api.post('/customer/init-session', { qr_token, screenResolution, timezone });
  },

  // Machine session (legacy)
  setMachine: (data) => {
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return api.post('/customer/set-machine', { ...data, screenResolution, timezone });
  },
  getMachine: () => api.get('/customer/machine'),

  // Swipe Polls
  getPolls: () => api.get('/customer/polls'),
  votePoll: (pollId, data) => api.post(`/customer/polls/${pollId}/vote`, data),
  getPollResults: (pollId) => api.get(`/customer/polls/${pollId}/results`),
  checkPollCompletion: () => api.get('/customer/polls/check-completion'),

  // Product Suggestions
  submitSuggestion: (suggestion) => api.post('/customer/suggestions', { suggestion }),
};

// Public API (no auth)
export const publicAPI = {
  resolveMachineQR: (qr_token) => api.get(`/auth/public/machines/by-qr/${qr_token}`),
};

// Wake up backend on app init (Render cold start mitigation)
export const wakeBackend = () => {
  api.get('/health').catch(() => {});
};

// Fire immediately on module load
wakeBackend();

export default api;
