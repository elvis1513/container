import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

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
    requestConfig => {
      // Add CSRF token if available (following JHipster patterns)
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        requestConfig.headers['X-XSRF-TOKEN'] = csrfToken;
      }
      return requestConfig;
    },
    error => Promise.reject(error instanceof Error ? error : new Error(String(error))),
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        const errorObj = new Error(data?.message || data?.error || 'Request failed') as Error & { status?: number; details?: unknown };
        errorObj.status = status;
        errorObj.details = data;
        return Promise.reject(errorObj);
      } else if (error.request) {
        // Request made but no response
        const errorObj = new Error('No response from server') as Error & { details?: unknown };
        errorObj.details = error;
        return Promise.reject(errorObj);
      } else {
        // Request setup error
        const errorObj = new Error(error.message || 'Request setup failed') as Error & { details?: unknown };
        errorObj.details = error;
        return Promise.reject(errorObj);
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
