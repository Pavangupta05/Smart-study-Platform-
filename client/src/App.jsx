import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Preloader from "./components/Preloader";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import AI from "./pages/AI";
import Settings from "./pages/Settings";
import Planner from "./pages/Planner";
import Templates from "./pages/Templates";
import Trash from "./pages/Trash";
import Reader from "./pages/Reader";
import Flashcards from "./pages/Flashcards";
import SearchModal from "./components/SearchModal";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [zenMode, setZenMode] = useState(() => localStorage.getItem("zenMode") === "true");
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("isAuthenticated") === "true");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("zenMode", zenMode);
  }, [zenMode]);

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem("theme") || "light");
    const syncThemeCustom = (e) => setTheme(e.detail?.theme || localStorage.getItem("theme") || "light");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeChange", syncThemeCustom);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeChange", syncThemeCustom);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) return <Preloader />;

  if (!isAuthenticated) {
    return (
      <div className={theme}>
        <Routes>
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/resetpassword/:token" element={<ResetPassword />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`app ${theme} ${zenMode ? "zen-mode" : ""} ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
      <Toaster position="top-center" richColors closeButton />
      {!zenMode && (
        <Sidebar 
          theme={theme}
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
          onOpenSearch={() => setIsSearchOpen(true)} 
        />
      )}

      <div className="main">
        <Topbar 
          theme={theme}
          setTheme={setTheme}
          zenMode={zenMode} 
          setZenMode={setZenMode} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/planner" element={<PageTransition><Planner /></PageTransition>} />
            <Route path="/notes" element={<PageTransition><Notes /></PageTransition>} />
            <Route path="/notes/:category" element={<PageTransition><Notes /></PageTransition>} />
            <Route path="/flashcards" element={<PageTransition><Flashcards /></PageTransition>} />
            <Route path="/ai" element={<PageTransition><AI /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
            <Route path="/templates" element={<PageTransition><Templates /></PageTransition>} />
            <Route path="/trash" element={<PageTransition><Trash /></PageTransition>} />
            <Route path="/reader/:id" element={<PageTransition><Reader zenMode={zenMode} setZenMode={setZenMode} /></PageTransition>} />
            <Route path="*" element={<PageTransition><Dashboard /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* GlobalAskAI removed — AI page now has its own integrated input */}
    </div>
  );
}

// Reusable transition wrapper
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", width: "100%", overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

export default App;