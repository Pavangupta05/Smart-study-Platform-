/**
 * UserContext — single source of truth for the logged-in user.
 * Fetches user data from the backend once on mount, then exposes it everywhere.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, settingsService } from "../services/index";
import { io } from "socket.io-client";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const SOCKET_URL = isLocalhost 
  ? `http://${window.location.hostname}:5000` 
  : "https://starnote-backend.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Hydrate from localStorage immediately (avoids flash of wrong name)
    const saved = localStorage.getItem("starNote_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authService.me();
      const u = res.data.user;
      setUser(u);
      localStorage.setItem("starNote_user", JSON.stringify(u));
    } catch {
      // Token expired or invalid — clear and let App handle redirect
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("starNote_token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      socket.connect();
      socket.emit("join_room", userId);
    } else {
      socket.disconnect();
    }
    // Only disconnect on full unmount — not on every user state change
    // This prevents repeated connect/disconnect cycles when settings are updated
    return () => {};
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
    <UserContext.Provider value={{ user, setUser: updateUser, loading, firstName, initials, logout, refetch: fetchUser, socket }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
};
