import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Preloader from "./components/Preloader";
import CommandPalette from "./components/CommandPalette";
import MobileDock from "./components/MobileDock";
import StudyTimer from "./components/StudyTimer";

// Lazy-loaded pages — code split for faster initial load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notes = lazy(() => import("./pages/Notes"));
const AI = lazy(() => import("./pages/AI"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Planner = lazy(() => import("./pages/Planner"));
const Templates = lazy(() => import("./pages/Templates"));
const Trash = lazy(() => import("./pages/Trash"));
const Reader = lazy(() => import("./pages/Reader"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));

// Minimal page skeleton shown while lazy chunks load
function PageSkeleton() {
  return (
    <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
      <div className="skeleton skeleton-text" style={{ width: "180px", height: "28px", borderRadius: "8px" }} />
      <div className="skeleton skeleton-text" style={{ width: "280px", height: "16px", borderRadius: "6px" }} />
      <div style={{ display: "grid", gap: "12px", marginTop: "8px" }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "12px", background: "var(--border)" }} />
        ))}
      </div>
    </div>
  );
}


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

  const triggerThemeTransition = (nextTheme, clientX, clientY) => {
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || isReducedMotion) {
      setTheme(nextTheme);
      return;
    }

    const x = clientX ?? window.innerWidth / 2;
    const y = clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Save to localStorage immediately
    localStorage.setItem("theme", nextTheme);

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.add("view-transitioning");
      document.body.classList.remove("light", "dark");
      document.body.classList.add(nextTheme);
      
      const appEl = document.querySelector(".app");
      if (appEl) {
        appEl.classList.remove("light", "dark");
        appEl.classList.add(nextTheme);
      }
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` }
        ],
        {
          duration: 380,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)"
        }
      );
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove("view-transitioning");
      setTheme(nextTheme);
      window.dispatchEvent(new CustomEvent("themeChangeCompleted", { detail: { theme: nextTheme } }));
    });
  };

  useEffect(() => {
    const syncTheme = () => setTheme(localStorage.getItem("theme") || "light");
    const syncThemeCustom = (e) => {
      const nextTheme = e.detail?.theme || localStorage.getItem("theme") || "light";
      triggerThemeTransition(nextTheme, e.detail?.clientX, e.detail?.clientY);
    };
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeChange", syncThemeCustom);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeChange", syncThemeCustom);
    };
  }, []);

  if (loading) return <Preloader />;

  if (!isAuthenticated) {
    return (
      <div className={theme}>
        <div className="global-bg">
          <div className="bg-layer bg-light" />
          <div className="bg-layer bg-dark" />
        </div>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`app ${theme} ${zenMode ? "zen-mode" : ""} ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
      <div className="global-bg">
        <div className="bg-layer bg-light" />
        <div className="bg-layer bg-dark" />
      </div>
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
          setTheme={(nextVal, event) => triggerThemeTransition(nextVal, event?.clientX, event?.clientY)}
          zenMode={zenMode} 
          setZenMode={setZenMode} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <AnimatePresence mode="wait">
          <Suspense fallback={<PageSkeleton />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
              <Route path="/planner" element={<PageTransition><Planner /></PageTransition>} />
              <Route path="/notes" element={<PageTransition><Notes /></PageTransition>} />
              <Route path="/notes/:category" element={<PageTransition><Notes /></PageTransition>} />
              <Route path="/flashcards" element={<PageTransition><Flashcards /></PageTransition>} />
              <Route path="/ai" element={<PageTransition><AI /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
              <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
              <Route path="/templates" element={<PageTransition><Templates /></PageTransition>} />
              <Route path="/trash" element={<PageTransition><Trash /></PageTransition>} />
              <Route path="/reader/:id" element={<PageTransition><Reader zenMode={zenMode} setZenMode={setZenMode} /></PageTransition>} />
              <Route path="*" element={<PageTransition><Dashboard /></PageTransition>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>

      <CommandPalette />
      <MobileDock />
      <StudyTimer />
      
      {/* GlobalAskAI removed — AI page now has its own integrated input */}
    </div>
  );
}

// Reusable transition wrapper
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const isAIPage = pathname === "/ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={isAIPage ? "page-transition page-transition--ai" : "page-transition"}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        width: "100%",
        overflowY: isAIPage ? "hidden" : "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}

export default App;