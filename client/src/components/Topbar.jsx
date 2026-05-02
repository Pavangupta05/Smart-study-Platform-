import { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Maximize2, Minimize2, Sun, Moon, Search,
  LayoutGrid, Clock3, StickyNote, LibraryBig, Sparkles,
  Menu, ChevronRight, Bell, Settings
} from "lucide-react";
import StudyTimer from "./StudyTimer";
import ProfileDropdown from "./ProfileDropdown";
import "../styles/topbar.css";

// Route → label map
const PAGE_LABELS = {
  "/":           { label: "Dashboard",  Icon: LayoutGrid },
  "/planner":    { label: "Planner",    Icon: Clock3 },
  "/notes":      { label: "Notes",      Icon: StickyNote },
  "/flashcards": { label: "Flashcards", Icon: LibraryBig },
  "/ai":         { label: "AI Tutor",   Icon: Sparkles },
  "/settings":   { label: "Settings",   Icon: Settings },
};

function Topbar({ theme, setTheme, zenMode, setZenMode, isSidebarOpen, setIsSidebarOpen }) {
  const location = useLocation();
  const topbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [notifCount] = useState(2); // Demo notification count

  // Derive page context from current route
  const currentPage = PAGE_LABELS[location.pathname] || PAGE_LABELS["/"];
  const PageIcon = currentPage.Icon;

  // Elevate topbar on scroll
  useEffect(() => {
    const mainEl = document.querySelector(".page-scroll, .main-content, .dashboard-minimal, .page-content");
    if (!mainEl) return;
    const onScroll = () => setScrolled(mainEl.scrollTop > 10);
    mainEl.addEventListener("scroll", onScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // Instant theme toggle — directly manipulates DOM before React re-render
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    // Apply instantly to DOM (no waiting for re-render)
    document.body.classList.remove("light", "dark");
    document.body.classList.add(next);
    localStorage.setItem("theme", next);
    // Then sync React state
    if (setTheme) {
      setTheme(next);
    }
    // Also dispatch custom event for any other listeners (e.g. Settings.jsx)
    window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme: next } }));
  };

  const isDark = theme === "dark";

  return (
    <header
      ref={topbarRef}
      className={`topbar-v2 ${isDark ? "dark" : "light"} ${scrolled ? "elevated" : ""} ${zenMode ? "zen" : ""}`}
      data-no-transition-init
    >
      {/* ── LEFT: sidebar toggle + breadcrumb ── */}
      <div className="tv2-left">


        {/* Page breadcrumb pill */}
        <div className="tv2-breadcrumb">
          <PageIcon size={15} strokeWidth={2.25} className="bc-icon" />
          <span className="bc-label">{currentPage.label}</span>
        </div>
      </div>

      {/* ── CENTER: study timer ── */}
      <div className="tv2-center">
        <StudyTimer />
      </div>

      {/* ── RIGHT: actions cluster ── */}
      <div className="tv2-right">


        {/* Notification bell */}
        <button className="tv2-icon-btn notif-btn" aria-label="Notifications" title="Notifications">
          <span className="tv2-icon-btn-bg" />
          <Bell size={17} strokeWidth={2.25} />
          {notifCount > 0 && (
            <span className="tv2-badge">{notifCount}</span>
          )}
        </button>

        {/* Zen / focus mode */}
        <button
          className={`tv2-icon-btn zen-btn ${zenMode ? "active" : ""}`}
          onClick={() => setZenMode(!zenMode)}
          aria-label={zenMode ? "Exit focus mode" : "Focus mode"}
          title={zenMode ? "Exit focus mode" : "Enter focus mode"}
        >
          <span className="tv2-icon-btn-bg" />
          {zenMode ? <Minimize2 size={17} strokeWidth={2.25} /> : <Maximize2 size={17} strokeWidth={2.25} />}
        </button>

        {/* Divider */}
        <div className="tv2-divider desktop-only" />

        {/* Profile */}
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default Topbar;