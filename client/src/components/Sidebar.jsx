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
import "../styles/sidebar.css";

function Sidebar({ theme, onOpenSearch, isSidebarOpen, setIsSidebarOpen }) {
  const navigate = useNavigate();
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

        <div style={{ padding: isSidebarOpen ? '16px' : '12px 0', borderTop: '1px solid var(--border)', marginTop: 'auto', transition: 'all 0.3s' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isSidebarOpen ? '12px' : '0',
            padding: isSidebarOpen ? '12px' : '0',
            background: isSidebarOpen ? 'var(--surface-hover)' : 'transparent',
            border: isSidebarOpen ? '1px solid var(--border)' : 'none',
            borderRadius: '20px',
            boxShadow: isSidebarOpen ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
            alignItems: 'center',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isSidebarOpen ? '12px' : '0', width: '100%', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
              <div style={{ position: 'relative', width: isSidebarOpen ? '40px' : '48px', height: isSidebarOpen ? '40px' : '48px', flexShrink: 0, transition: 'all 0.3s' }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--text)',
                  color: 'var(--surface)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: isSidebarOpen ? '13px' : '15px'
                }}>VG</div>
                {isSidebarOpen && (
                  <div style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '10px',
                    height: '10px',
                    background: '#10b981',
                    border: '2px solid var(--surface)',
                    borderRadius: '50%'
                  }}></div>
                )}
              </div>
              {isSidebarOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', animation: 'fadeIn 0.3s' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Vinod Gupta</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', opacity: 0.8 }}>Pro Student</span>
                </div>
              )}
            </div>
            
            {isSidebarOpen && (
              <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border)', width: '100%', animation: 'fadeIn 0.3s' }}>
                <NavLink to="/settings" style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderRadius: '12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }} onClick={handleNavLinkClick}>
                  <Settings size={14} />
                  <span>Settings</span>
                </NavLink>
                <button style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderRadius: '12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }} onClick={() => {
                  localStorage.removeItem("isAuthenticated");
                  window.location.reload();
                }}>
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
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