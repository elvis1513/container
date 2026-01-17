import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create a configured axios instance for site modules
// This isolates platform-level HTTP configuration from legacy code
export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL: '/',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  // Request interceptor
  instance.interceptors.request.use(
    config => {
      // Add CSRF token if available (following JHipster patterns)
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
      return config;
    },
    error => Promise.reject(error),
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        return Promise.reject({
          status,
          message: data?.message || data?.error || 'Request failed',
          details: data,
        });
      } else if (error.request) {
        // Request made but no response
        return Promise.reject({
          message: 'No response from server',
          details: error,
        });
      } else {
        // Request setup error
        return Promise.reject({
          message: error.message || 'Request setup failed',
          details: error,
        });
      }
    },
  );

  return instance;
};

// Helper to get CSRF token from meta tag (JHipster pattern)
const getCsrfToken = (): string | null => {
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
};

// Default axios instance for site modules
export const axiosInstance = createAxiosInstance();
