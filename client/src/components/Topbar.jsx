import { useState, useEffect, useRef } from "react";
import { useTimer } from "../context/TimerContext";
import { useLocation } from "react-router-dom";

import {
  Home, Clock3, StickyNote, LibraryBig, Sparkles, Settings, Eye, EyeOff
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

function Topbar({ theme, zenMode }) {
  const location = useLocation();
  const topbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const { isVisible, setIsVisible } = useTimer(); // timer visibility
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
        {/* Timer visibility toggle */}
        <button className="timer-toggle-btn" onClick={() => setIsVisible(!isVisible)} title={isVisible ? "Hide Timer" : "Show Timer"} style={{marginRight:"8px", background:"none", border:"none", cursor:"pointer"}}>
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
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