
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    // Ensure we don't go into an infinite loop if the refresh endpoint itself fails (check url)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh/')) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          // Update tokens (handle rotation if backend returns new refresh token)
          useAuthStore.getState().setTokens(data.access, data.refresh || refreshToken);
          
          // Update the header for the original request
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          
          // Return the result of the retry
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, logout and redirect
          useAuthStore.getState().logout();
          window.location.href = '/#/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
