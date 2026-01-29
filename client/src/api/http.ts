import axios from "axios";
import { readAuthToken, clearAuthToken } from "../auth/authStorage";

// Get API URL from environment variable
// Vite uses VITE_ prefix for environment variables
// Fallback to production URL if not set
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && typeof envUrl === "string") {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, "");
  }
  
  // Default to production URL
  return "https://proviquiz-2.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with base URL
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor: Add authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = readAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // Clear auth token if present
      clearAuthToken();
      // Redirect to login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (typeof err.message === "string" && err.message);
    return msg || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

