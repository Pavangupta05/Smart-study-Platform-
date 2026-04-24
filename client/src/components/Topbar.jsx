import { Search, Maximize2, Minimize2 } from "lucide-react";
import StudyTimer from "./StudyTimer";
import ProfileDropdown from "./ProfileDropdown";
import "../styles/topbar.css";

function Topbar({ zenMode, setZenMode }) {
  return (
    <div className={`topbar ${zenMode ? "zen" : ""}`}>
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search documents..." />
      </div>

      <div className="actions">
        {/* Zen Mode Toggle */}
        <button 
          className={`zen-toggle ${zenMode ? "active" : ""}`}
          onClick={() => setZenMode(!zenMode)}
          title={zenMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        >
          {zenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* New Integrated Pomodoro Timer */}
        <StudyTimer />
        
        <ProfileDropdown />
      </div>
    </div>
  );
}

export default Topbar;