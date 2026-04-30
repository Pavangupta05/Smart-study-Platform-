import { useRef, useEffect } from "react";
import { Maximize2, Minimize2, Menu, PanelLeftOpen } from "lucide-react";
import StudyTimer from "./StudyTimer";
import ProfileDropdown from "./ProfileDropdown";
import "../styles/topbar.css";

function Topbar({ theme, zenMode, setZenMode, isSidebarOpen, setIsSidebarOpen }) {
  const topbarRef = useRef(null);

  // Force an instant GPU repaint when theme changes
  // backdrop-filter compositing layers don't repaint on CSS variable changes without this
  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    el.style.transform = "translateZ(1px)";
    requestAnimationFrame(() => {
      el.style.transform = "";
    });
  }, [theme]);

  return (
    <div ref={topbarRef} className={`topbar ${zenMode ? "zen" : ""}`}>
      {/* LEFT SECTION: NAVIGATION */}
      <div className="topbar-left">
      </div>

      {/* CENTER SECTION: CONTEXT / TIMER */}
      <div className="topbar-center">
        <div className="topbar-context">
          <StudyTimer />
        </div>
      </div>

      {/* RIGHT SECTION: ACTIONS */}
      <div className="topbar-right">
        <div className="action-group">
          <button 
            className={`topbar-btn zen-toggle ${zenMode ? "active" : ""}`}
            onClick={() => setZenMode(!zenMode)}
            title={zenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <div className="btn-icon-container">
              {zenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </div>
          </button>
          
          <div className="divider-v"></div>
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}

export default Topbar;