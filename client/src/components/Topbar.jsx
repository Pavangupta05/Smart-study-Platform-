import { Maximize2, Minimize2, Menu } from "lucide-react";
import StudyTimer from "./StudyTimer";
import ProfileDropdown from "./ProfileDropdown";
import "../styles/topbar.css";

function Topbar({ zenMode, setZenMode }) {
  return (
    <div className={`topbar ${zenMode ? "zen" : ""}`}>
      {/* LEFT SECTION: NAVIGATION (EMPTY FOR IOS MINIMALISM) */}
      <div className="topbar-left">
        {/* Removed for cleaner look */}
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