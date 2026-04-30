import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("starNote_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — but ONLY for protected routes, not for /auth routes
// (login/register return 401 for wrong credentials — we don't want to redirect then)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      // Token expired on a protected route → force logout
      localStorage.removeItem("starNote_token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("starNote_user");
      window.location.href = "/landing";
    }
    return Promise.reject(error);
  }
);

export default api;
