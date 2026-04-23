import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Brain } from "lucide-react"; 
import "../styles/sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2 className="logo">Nova</h2>

      <div className="menu">
        <NavLink to="/" className={({ isActive }) => "item " + (isActive ? "active" : "")}>
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        <NavLink to="/notes" className={({ isActive }) => "item " + (isActive ? "active" : "")}>
          <FileText size={18} />
          <span>Documents</span>
        </NavLink>

        <NavLink to="/ai" className={({ isActive }) => "item " + (isActive ? "active" : "")}>
          <Brain size={18} />
          <span>Ask AI</span>
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;