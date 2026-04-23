import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  CalendarClock, 
  Settings, 
  Search, 
  Plus, 
  ChevronRight, 
  Star, 
  Trash2, 
  LayoutTemplate,
  Menu,
  X
} from "lucide-react"; 
import "../styles/sidebar.css";

function Sidebar({ onOpenSearch }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const createQuickNote = (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    const currentFiles = JSON.parse(localStorage.getItem("starNote_files") || "[]");
    const newNote = {
      id: Date.now(),
      name: `Untitled ${cat.charAt(0).toUpperCase() + cat.slice(1)} Note`,
      size: "0 KB",
      date: "Just now",
      icon: "📄",
      cat: cat,
      content: "# New Note\n\nStart typing here..."
    };
    const updated = [newNote, ...currentFiles];
    localStorage.setItem("starNote_files", JSON.stringify(updated));
    navigate(`/notes/${newNote.id}`);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR & MOBILE OVERLAY */}
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-top">
          <div className="logo-row">
            <h2 className="logo">StarNote</h2>
            <button className="btn-close-menu mobile-only" onClick={closeMobileMenu}>
              <X size={20} />
            </button>
          </div>
          <div className="sidebar-search" onClick={onOpenSearch}>
            <Search size={14} />
            <span>Quick Find</span>
            <kbd>Ctrl+K</kbd>
          </div>
        </div>

        <div className="sidebar-scroll">
          {/* CORE NAV */}
          <div className="sidebar-group">
            <NavLink to="/" onClick={closeMobileMenu} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/planner" onClick={closeMobileMenu} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <CalendarClock size={18} />
              <span>Planner</span>
            </NavLink>
            <NavLink to="/notes" onClick={closeMobileMenu} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <FileText size={18} />
              <span>Notes</span>
            </NavLink>
            <NavLink to="/ai" onClick={closeMobileMenu} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <Sparkles size={18} />
              <span>AI Tutor</span>
            </NavLink>
          </div>

          {/* FAVORITES */}
          <div className="sidebar-group">
            <div className="group-label">Favorites</div>
            <NavLink to="/notes" className="item" onClick={closeMobileMenu}>
              <Star size={16} className="icon-fav" />
              <span>Thesis Draft</span>
            </NavLink>
          </div>

          {/* PRIVATE PAGES */}
          <div className="sidebar-group">
            <div className="group-header">
              <div className="group-label">Private</div>
              <button className="btn-add-inline" onClick={(e) => createQuickNote(e, 'private')}>
                <Plus size={14} />
              </button>
            </div>
            <NavLink to="/notes/university" className="nested-item" onClick={closeMobileMenu}>
              <ChevronRight size={14} className="chevron" />
              <FileText size={16} />
              <span>University</span>
            </NavLink>
            <NavLink to="/notes/research" className="nested-item" onClick={closeMobileMenu}>
              <ChevronRight size={14} className="chevron" />
              <FileText size={16} />
              <span>Research</span>
            </NavLink>
          </div>

          {/* TOOLS */}
          <div className="sidebar-group">
            <div className="group-label">Tools</div>
            <NavLink to="/templates" onClick={closeMobileMenu} className="item">
              <LayoutTemplate size={18} />
              <span>Templates</span>
            </NavLink>
            <NavLink to="/trash" onClick={closeMobileMenu} className="item">
              <Trash2 size={18} />
              <span>Trash</span>
            </NavLink>
          </div>
        </div>

        <div className="sidebar-footer">
          <NavLink to="/settings" onClick={closeMobileMenu} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* MOBILE FLOATING DOCK */}
      <div className="mobile-dock mobile-only">
        <NavLink to="/" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <LayoutDashboard size={22} />
        </NavLink>
        <NavLink to="/planner" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <CalendarClock size={22} />
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <FileText size={22} />
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <Sparkles size={22} />
        </NavLink>
        <button className="dock-item" onClick={toggleMobileMenu}>
          <Menu size={22} />
        </button>
      </div>

      {/* OVERLAY FOR MOBILE MENU */}
      {isMobileMenuOpen && <div className="menu-overlay" onClick={closeMobileMenu}></div>}
    </>
  );
}

export default Sidebar;