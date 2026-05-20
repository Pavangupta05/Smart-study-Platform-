import { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  Maximize2, Minimize2, Sun, Moon, Search,
  Home, Clock3, StickyNote, LibraryBig, Sparkles,
  Menu, ChevronRight, Bell, Settings
} from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import "../styles/topbar.css";

// Route → label map
const PAGE_LABELS = {
  "/":           { label: "Home",  Icon: Home },
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
  const toggleTheme = (e) => {
    const next = theme === "dark" ? "light" : "dark";
    if (setTheme) {
      setTheme(next, e);
    }
    window.dispatchEvent(new CustomEvent("themeChange", { 
      detail: { 
        theme: next,
        clientX: e?.clientX,
        clientY: e?.clientY
      } 
    }));
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

      {/* ── CENTER: empty ── */}
      <div className="tv2-center">
      </div>

      {/* ── RIGHT: actions cluster ── */}
      <div className="tv2-right">


        {/* Functional Notifications Dropdown */}
        <NotificationsDropdown />

        {/* Divider */}
        <div className="tv2-divider desktop-only" />

        {/* Profile */}
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default Topbar;