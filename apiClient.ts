import axios from "axios";
import { getApiUrl } from "./lib/apiUrl";

// Create Axios instances
const apiClient = axios.create({
  baseURL: getApiUrl(),
});

// Add request interceptor to include auth token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiFormClient = axios.create({
  baseURL: getApiUrl(),
});

// Add the same interceptor to apiFormClient
apiFormClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
