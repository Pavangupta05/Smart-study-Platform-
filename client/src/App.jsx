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
import { useUser } from "./context/UserContext";
import "./styles/simple-ui.css";

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
const MindMap = lazy(() => import("./pages/MindMap"));
const Exam = lazy(() => import("./pages/Exam"));
const ExamHistory = lazy(() => import("./pages/ExamHistory"));
const PublicReader = lazy(() => import("./pages/PublicReader"));
const StudyRoom = lazy(() => import("./pages/StudyRoom"));

function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-header">
        <div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-subtitle" />
        </div>
        <div className="skeleton skeleton-action" />
      </div>

      <div className="page-skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-stat-card" />
        ))}
      </div>

      <div className="page-skeleton-body">
        <div className="skeleton skeleton-panel skeleton-panel-large" />
        <div className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-list-row">
              <div className="skeleton skeleton-avatar" />
              <div className="skeleton-row-copy">
                <div className="skeleton skeleton-line skeleton-line-wide" />
                <div className="skeleton skeleton-line skeleton-line-short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [zenMode, setZenMode] = useState(() => localStorage.getItem("zenMode") === "true");
  const { user, loading: userLoading } = useUser();
  // isAuthenticated is driven ONLY by UserContext (the single source of truth).
  // UserContext hydrates from localStorage on init and clears it on session expiry.
  // Do NOT check localStorage here — it causes race conditions when a bad token is being cleared.
  const isAuthenticated = !!user;
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

  // Global Mouse Tracker for Card Glow Effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Set global coordinates for backgrounds
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);

      // Find if we are hovering over a glow-enabled card
      const targetCard = e.target.closest('.card, .glass-card, .doc-card-mini, .insight-card, .study-card, .ss-card');
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        targetCard.style.setProperty("--local-mouse-x", `${x}px`);
        targetCard.style.setProperty("--local-mouse-y", `${y}px`);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  if (loading || userLoading) return <Preloader />;

  if (!isAuthenticated) {
    return (
      <div className={theme}>
        <div className="global-bg">
          <div className="ambient-orb orb-1" />
          <div className="ambient-orb orb-2" />
          <div className="ambient-orb orb-3" />
          <div className="bg-layer bg-light" />
          <div className="bg-layer bg-dark" />
        </div>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            <Route path="/share/:shareId" element={<PublicReader />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`app ${theme} ${zenMode ? "zen-mode" : ""} ${!isSidebarOpen ? "sidebar-collapsed" : ""}`}>
      <div className="global-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
        <div className="bg-layer bg-light" />
        <div className="bg-layer bg-dark" />
      </div>
      <Toaster position="top-center" richColors closeButton />
      {!zenMode && (
        <Sidebar 
          theme={theme}
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
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
              <Route path="/mindmap/:noteId" element={<PageTransition><MindMap /></PageTransition>} />
              <Route path="/exam" element={<PageTransition><Exam /></PageTransition>} />
              <Route path="/exams" element={<PageTransition><ExamHistory /></PageTransition>} />
              <Route path="/study/:roomId" element={<PageTransition><StudyRoom /></PageTransition>} />
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

// Reusable premium transition wrapper
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const isAIPage = pathname === "/ai";
  const isReaderPage = pathname.startsWith("/reader/");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "page-transition",
        isAIPage ? "page-transition--ai" : "",
        isReaderPage ? "page-transition--reader" : "",
      ].filter(Boolean).join(" ")}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        position: "relative",
        overflowY: isAIPage ? "hidden" : "auto",
        overflowX: "hidden"
      }}
    >
      {children}
    </motion.div>
  );
}

export default App;
