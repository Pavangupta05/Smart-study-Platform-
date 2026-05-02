import axios from "axios";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    if (error.response?.status === 401 && !isAuthRoute) {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("starNote_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("starNote_user");
      window.location.href = "/landing";
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
