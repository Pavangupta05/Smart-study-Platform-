import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { 
  LayoutGrid, 
  StickyNote, 
  Sparkles, 
  Clock3, 
  Settings, 
  Search, 
  Plus, 
  ChevronRight, 
  Bookmark, 
  Trash2, 
  Layout,
  Menu,
  X,
  LibraryBig,
  History,
  Wrench,
  Flame,
  Pin,
  Clock,
  LogOut,
  LockKeyhole,
  School,
  Binary,
  Shapes
} from "lucide-react"; 
import { useUser } from "../context/UserContext";
import { notesService } from "../services/index";
import "../styles/sidebar.css";

function Sidebar({ theme, onOpenSearch, isSidebarOpen, setIsSidebarOpen }) {
  const navigate = useNavigate();
  const { user, firstName, initials, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    important: false,
    recent: false,
    favorites: false,
    private: false,
    tools: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Auto-close handler for both mobile and desktop (mini-mode)
  const handleNavLinkClick = () => {
    closeMobileMenu();
    // Only auto-collapse on desktop if it's currently pinned open
    // If you want it to ALWAYS go back to mini-mode after click:
    setIsSidebarOpen(false);
  };

  const createQuickNote = async (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    const newNote = {
      name: `Untitled ${cat.charAt(0).toUpperCase() + cat.slice(1)} Note`,
      size: "0 KB",
      icon: "📄",
      category: cat,
      content: "# New Note\n\nStart typing here..."
    };
    try {
      const res = await notesService.create(newNote);
      navigate(`/reader/${res.data.note._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* DESKTOP SIDEBAR & MOBILE OVERLAY */}
      <div className={`sidebar ${theme} ${isMobileMenuOpen ? 'mobile-open' : ''} ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <div className="logo-row" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
            <div className="logo-mark">
              <LibraryBig size={18} className="logo-icon-svg" />
            </div>
            <h2 className="logo-text">StarNote</h2>
            <button className="btn-close-menu mobile-only" onClick={closeMobileMenu}>
              <X size={20} />
            </button>
          </div>
          
          <div className="sidebar-search-container">
            <div className="sidebar-search-minimal" onClick={onOpenSearch}>
              <Search size={20} />
              <span>Search...</span>
            </div>
          </div>
        </div>

        <div className="sidebar-scroll">
          {/* CORE NAV */}
          <div className="sidebar-group">
            <NavLink to="/" onClick={handleNavLinkClick} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <LayoutGrid size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/planner" onClick={handleNavLinkClick} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <Clock3 size={20} />
              <span>Planner</span>
            </NavLink>
            <NavLink to="/notes" onClick={handleNavLinkClick} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <StickyNote size={20} />
              <span>Notes</span>
            </NavLink>
            <NavLink to="/flashcards" onClick={handleNavLinkClick} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <LibraryBig size={20} />
              <span>Flashcards</span>
            </NavLink>
            <NavLink to="/ai" onClick={handleNavLinkClick} className={({ isActive }) => "item " + (isActive ? "active" : "")}>
              <Sparkles size={20} />
              <span>AI Tutor</span>
            </NavLink>
          </div>

          {/* IMPORTANT / PINNED */}
          <div className="sidebar-group">
            <div className="group-header" onClick={() => toggleSection('important')}>
              <div className="group-label-row">
                <Flame size={14} className="icon-important" />
                <div className="group-label">Important</div>
              </div>
              <ChevronRight size={14} className={`chevron-toggle ${collapsedSections.important ? '' : 'rotated'}`} />
            </div>
            {!collapsedSections.important && (
              <div className="group-content">
                <NavLink to="/notes" className="item mini-item" onClick={handleNavLinkClick}>
                  <Pin size={16} style={{ color: 'var(--primary)', transform: 'rotate(45deg)' }} />
                  <span>Exam Revision</span>
                  <div className="status-badge-dot pulse-green" title="In Progress"></div>
                </NavLink>
              </div>
            )}
          </div>

          {/* RECENT */}
          <div className="sidebar-group">
            <div className="group-header" onClick={() => toggleSection('recent')}>
              <div className="group-label-row">
                <Clock size={14} />
                <div className="group-label">Recent</div>
              </div>
              <ChevronRight size={14} className={`chevron-toggle ${collapsedSections.recent ? '' : 'rotated'}`} />
            </div>
            {!collapsedSections.recent && (
              <div className="group-content">
                <NavLink to="/notes" className="item mini-item" onClick={handleNavLinkClick}>
                  <StickyNote size={16} />
                  <span>Physics Ch. 4</span>
                  <div className="status-badge-dot pulse-amber" title="Needs Review"></div>
                </NavLink>
                <NavLink to="/notes" className="item mini-item" onClick={handleNavLinkClick}>
                  <StickyNote size={14} />
                  <span>Organic Chem</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* FAVORITES */}
          <div className="sidebar-group">
            <div className="group-header" onClick={() => toggleSection('favorites')}>
              <div className="group-label-row">
                <Bookmark size={14} />
                <div className="group-label">Favorites</div>
              </div>
              <ChevronRight size={14} className={`chevron-toggle ${collapsedSections.favorites ? '' : 'rotated'}`} />
            </div>
            {!collapsedSections.favorites && (
              <div className="group-content">
                <NavLink to="/notes" className="item" onClick={handleNavLinkClick}>
                  <Bookmark size={18} className="icon-fav" />
                  <span>Project Draft</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* PRIVATE PAGES */}
          <div className="sidebar-group">
            <div className="group-header">
              <div className="group-label-row" onClick={() => toggleSection('private')}>
                <LockKeyhole size={14} />
                <div className="group-label">Private</div>
                <ChevronRight size={14} className={`chevron-toggle ${collapsedSections.private ? '' : 'rotated'}`} />
              </div>
              <button className="btn-add-inline" onClick={(e) => createQuickNote(e, 'private')}>
                <Plus size={14} />
              </button>
            </div>
            {!collapsedSections.private && (
              <div className="group-content">
                <NavLink to="/notes/university" className="nested-item" onClick={handleNavLinkClick}>
                  <ChevronRight size={14} className="chevron" />
                  <School size={18} />
                  <span>University</span>
                </NavLink>
                <NavLink to="/notes/research" className="nested-item" onClick={handleNavLinkClick}>
                  <ChevronRight size={14} className="chevron" />
                  <Binary size={18} />
                  <span>Research</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* TOOLS */}
          <div className="sidebar-group">
            <div className="group-header" onClick={() => toggleSection('tools')}>
              <div className="group-label-row">
                <Wrench size={14} />
                <div className="group-label">Tools</div>
              </div>
              <ChevronRight size={14} className={`chevron-toggle ${collapsedSections.tools ? '' : 'rotated'}`} />
            </div>
            {!collapsedSections.tools && (
              <div className="group-content">
                <NavLink to="/templates" onClick={handleNavLinkClick} className="item">
                  <Shapes size={20} />
                  <span>Templates</span>
                </NavLink>
                <NavLink to="/trash" onClick={handleNavLinkClick} className="item">
                  <Trash2 size={20} />
                  <span>Trash</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* ULTRA-MINIMAL USER DOCK */}
        <div className="premium-user-dock">
          <div className="user-dock-avatar">
            {initials}
            <div className="user-dock-status"></div>
          </div>
          <div className="user-dock-info">
            <span className="user-dock-name">{user?.name || firstName}</span>
            <span className="user-dock-plan">{user?.plan === 'pro' ? 'Pro' : 'Free'}</span>
          </div>
          <div className="user-dock-icon-actions">
            <NavLink to="/settings" className="icon-action-btn" title="Settings" onClick={handleNavLinkClick}>
              <Settings size={15} />
            </NavLink>
            <button className="icon-action-btn logout-icon" title="Logout" onClick={() => logout()}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING DOCK */}
      <div className="mobile-dock mobile-only">
        <NavLink to="/" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <LayoutGrid size={20} />
        </NavLink>
        <NavLink to="/planner" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <Clock3 size={20} />
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <StickyNote size={20} />
        </NavLink>
        <NavLink to="/flashcards" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <LibraryBig size={20} />
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => "dock-item " + (isActive ? "active" : "")}>
          <Sparkles size={20} />
        </NavLink>
        <button className="dock-item" onClick={toggleMobileMenu}>
          <Menu size={20} />
        </button>
      </div>

      {/* OVERLAY FOR MOBILE MENU */}
      {isMobileMenuOpen && <div className="menu-overlay" onClick={closeMobileMenu}></div>}
    </>
  );
}

export default Sidebar;