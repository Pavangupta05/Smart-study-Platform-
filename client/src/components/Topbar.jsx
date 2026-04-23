import { Search } from "lucide-react";
import "../styles/topbar.css";

function Topbar() {
  return (
    <div className="topbar">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search documents..." />
      </div>

      <div className="actions">
        <div className="avatar">P</div>
      </div>
    </div>
  );
}

export default Topbar;