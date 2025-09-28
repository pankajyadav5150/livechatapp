import axios from "axios";
import Cookies from "js-cookie";
import { HOST } from "./constants";

// Ensure the base URL doesn't have trailing slashes
const getBaseUrl = () => {
  const base = HOST.endsWith('/') ? HOST.slice(0, -1) : HOST;
  return base;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData, let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request interceptor to include token in headers
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access-token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For file uploads, don't set Content-Type header
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    // If there's a token in the response, store it
    if (response.data?.token) {
      localStorage.setItem('access-token', response.data.token);
    }
    return response;
  },
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Please check your internet connection or if the server is running');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection.'));
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear the invalid token
      localStorage.removeItem('access-token');
      // Optionally redirect to login page
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
