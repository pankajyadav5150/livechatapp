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

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error: Please check your internet connection or if the server is running');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
