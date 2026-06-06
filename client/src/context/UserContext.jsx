/**
 * UserContext — single source of truth for the logged-in user.
 * Fetches user data from the backend once on mount, then exposes it everywhere.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authService, settingsService } from "../services/index";
import { io } from "socket.io-client";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const SOCKET_URL = isLocalhost 
  ? `http://${window.location.hostname}:5000` 
  : "https://starnote-backend.onrender.com";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Hydrate from localStorage immediately (avoids flash of wrong name)
    const saved = localStorage.getItem("starNote_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isSlowStart, setIsSlowStart] = useState(false);
  
  // Use a ref to store the socket instance per provider instance
  const socketRef = useRef(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authService.me();
      const u = res.data.user;
      setUser(u);
      localStorage.setItem("starNote_user", JSON.stringify(u));
    } catch (err) {
      const status = err?.response?.status;
      // Only clear session on a real 401 Unauthorized (invalid/expired token).
      // Do NOT clear on network errors, timeouts, or 5xx (e.g. Render cold-start)
      // — those are temporary and should not log the user out.
      if (status === 401) {
        localStorage.removeItem("starNote_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("starNote_user");
        setUser(null);
      }
      // For non-401 errors (network/timeout/server down), keep the cached user
      // data from localStorage so the user stays logged in.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("starNote_token");
    if (token) {
      const timer = setTimeout(() => setIsSlowStart(true), 4000);
      fetchUser().then(() => clearTimeout(timer));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL, { autoConnect: false });
      }
      socketRef.current.connect();
      socketRef.current.emit("join_room", userId);
    } else if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user?._id, user?.id]);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem("starNote_user", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save user to localStorage:", err);
      }
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("starNote_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("starNote_user");
    window.location.href = "/landing";
  }, []);

  // Helpers
  const firstName = user?.name?.split(" ")[0] || "Student";
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, loading, firstName, initials, logout, refetch: fetchUser, socket: socketRef.current, isSlowStart }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
};
