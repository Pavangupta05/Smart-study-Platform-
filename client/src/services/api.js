import axios from "axios";
import { toast } from "sonner";

const isLocalDev = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.");
const BASE_URL = import.meta.env.VITE_API_URL || (isLocalDev ? `http://${window.location.hostname}:5000/api` : "https://starnote-backend.onrender.com/api");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds to allow large base64 file uploads
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("starNote_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/auth/");
    const isMeCheck = error.config?.url?.endsWith("/auth/me");
    const hasResponse = !!error.response;

    if (error.response?.status === 401 && !isAuthRoute) {
      // Global 401: real session expiry from a protected API call
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("starNote_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("starNote_user");
      window.location.href = "/landing";
    } else if (isMeCheck) {
      // Suppress all errors from /auth/me — UserContext handles them silently.
      // This prevents false "network error" toasts on Render cold-start.
    } else if (!hasResponse) {
      // Pure network error (server sleeping, offline, etc.) — suppress toast.
      // The app will work with cached data from localStorage.
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message && error.message !== "Network Error") {
      toast.error(`Error: ${error.message}`);
    } else if (!isAuthRoute) {
      toast.error("Network or unexpected error occurred. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default api;
