import { useState, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import {
  StickyNote,
  Sparkles,
  Clock3,
  Settings,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Trash2,
  Home,
  LibraryBig,
  Wrench,
  Flame,
  Pin,
  Clock,
  LogOut,
  LockKeyhole,
  School,
  Binary,
  Shapes,
  X,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { notesService } from "../services/index";
import "../styles/sidebar.css";

/* ─── Core navigation items ─── */
const CORE_NAV = [
  { to: "/",           Icon: Home,       label: "Home",       end: true  },
  { to: "/planner",    Icon: Clock3,     label: "Planner"               },
  { to: "/notes",      Icon: StickyNote, label: "Notes"                 },
  { to: "/flashcards", Icon: LibraryBig, label: "Flashcards"            },
  { to: "/ai",         Icon: Sparkles,   label: "AI Tutor"              },
];

function Sidebar({ theme, onOpenSearch, isSidebarOpen, setIsSidebarOpen }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user, firstName, initials, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({
    important: false,
    recent:    false,
    private:   false,
    tools:     false,
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [importantNotes, setImportantNotes] = useState([]);

  useEffect(() => {
    const fetchSidebarNotes = async () => {
      try {
        const res = await notesService.getAll();
        if (res.data && res.data.notes) {
          const allNotes = res.data.notes.filter(n => !n.isTrashed);
          
          // Important: notes marked pinned, or just pick the first 2 as fallback for now
          const pinned = allNotes.filter(n => n.pinned || n.isImportant);
          setImportantNotes(pinned.length > 0 ? pinned : allNotes.slice(0, 2));

          // Recent: sort by updatedAt descending
          const sorted = [...allNotes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setRecentNotes(sorted.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch sidebar notes:", err);
      }
    };
    if (isSidebarOpen || !isMobileMenuOpen) { // Fetch mainly when active
      fetchSidebarNotes();
    }
  }, [location.pathname]); // Re-fetch occasionally when navigating

  const toggle      = (k) => setCollapsed(p => ({ ...p, [k]: !p[k] }));
  const closeMobile = () => setIsMobileMenuOpen(false);

  const handleNav   = () => {
    closeMobile();
    setIsSidebarOpen(false);
  };

  const createQuickNote = async (e, cat) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await notesService.create({
        name: `Untitled ${cat.charAt(0).toUpperCase() + cat.slice(1)} Note`,
        size: "0 KB", icon: "📄", category: cat,
        content: "# New Note\n\nStart typing here...",
      });
      navigate(`/reader/${res.data.note._id}`);
    } catch (err) { console.error(err); }
  };

  const isCollapsed = !isSidebarOpen;

  return (
    <>
      {/* ── SIDEBAR PANEL ── */}
      <aside
        className={[
          "sidebar",
          theme,
          isMobileMenuOpen ? "mobile-open" : "",
          isCollapsed      ? "collapsed"   : "",
        ].join(" ")}
      >
        {/* ─── HEADER ─── */}
        <div className="sb-header">
          <div className="sb-logo" onClick={() => navigate("/")} role="button" tabIndex={0} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <div className="sb-logo-mark">
              <LibraryBig size={16} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <span className="sb-logo-text" style={{ lineHeight: 1 }}>StarNote</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontWeight: 500 }}>Personal Workspace</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </div>

          {/* Search pill */}
          <button className="sb-search" onClick={onOpenSearch} aria-label="Search">
            <Search size={15} />
            <span className="sb-search-label">Search anything...</span>
            <span className="sb-search-kbd">⌘K</span>
          </button>
        </div>

        {/* ─── SCROLL AREA ─── */}
        <div className="sb-scroll">

          {/* CORE NAV */}
          <nav className="sb-section">
            {CORE_NAV.map(({ to, Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={handleNav}
                className={({ isActive }) => `sb-item${isActive ? " active" : ""}`}
              >
                <span className="sb-item-icon"><Icon size={18} /></span>
                <span className="sb-item-label">{label}</span>
                {label === "AI Tutor" && <span className="sb-badge sb-badge-ai">AI</span>}
              </NavLink>
            ))}
          </nav>

          <div className="sb-divider" />

          {/* IMPORTANT */}
          {importantNotes.length > 0 && (
            <div className="sb-section">
              <button className="sb-group-hdr" onClick={() => toggle("important")}>
                <span className="sb-group-icon"><Flame size={13} /></span>
                <span className="sb-group-label">Important</span>
                <ChevronRight
                  size={13}
                  className={`sb-chevron ${collapsed.important ? "" : "rotated"}`}
                />
              </button>
              {!collapsed.important && (
                <div className="sb-group-body">
                  {importantNotes.map(note => (
                    <NavLink key={`imp-${note._id}`} to={`/reader/${note._id}`} onClick={handleNav} className="sb-item sb-item-sm">
                      <span className="sb-item-icon">
                        <Pin size={14} style={{ color: "#f59e0b" }} />
                      </span>
                      <span className="sb-item-label">{note.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RECENT */}
          {recentNotes.length > 0 && (
            <div className="sb-section">
              <button className="sb-group-hdr" onClick={() => toggle("recent")}>
                <span className="sb-group-icon"><Clock size={13} /></span>
                <span className="sb-group-label">Recent</span>
                <ChevronRight
                  size={13}
                  className={`sb-chevron ${collapsed.recent ? "" : "rotated"}`}
                />
              </button>
              {!collapsed.recent && (
                <div className="sb-group-body">
                  {recentNotes.map(note => (
                    <NavLink key={`rec-${note._id}`} to={`/reader/${note._id}`} onClick={handleNav} className="sb-item sb-item-sm">
                      <span className="sb-item-icon">
                        <StickyNote size={14} />
                      </span>
                      <span className="sb-item-label">{note.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRIVATE */}
          <div className="sb-section">
            <div className="sb-group-hdr-row">
              <button
                className="sb-group-hdr sb-group-hdr-flex"
                onClick={() => toggle("private")}
              >
                <span className="sb-group-icon"><LockKeyhole size={13} /></span>
                <span className="sb-group-label">Private</span>
                <ChevronRight
                  size={13}
                  className={`sb-chevron ${collapsed.private ? "" : "rotated"}`}
                />
              </button>
              <button
                className="sb-add-btn"
                onClick={(e) => createQuickNote(e, "private")}
                title="New private note"
                aria-label="New private note"
              >
                <Plus size={13} />
              </button>
            </div>
            {!collapsed.private && (
              <div className="sb-group-body">
                <NavLink to="/notes/university" onClick={handleNav} className="sb-item sb-item-sm sb-item-nested">
                  <span className="sb-item-icon"><School size={14} /></span>
                  <span className="sb-item-label">University</span>
                </NavLink>
                <NavLink to="/notes/research" onClick={handleNav} className="sb-item sb-item-sm sb-item-nested">
                  <span className="sb-item-icon"><Binary size={14} /></span>
                  <span className="sb-item-label">Research</span>
                </NavLink>
              </div>
            )}
          </div>

          <div className="sb-divider" />

          {/* TOOLS */}
          <div className="sb-section">
            <button className="sb-group-hdr" onClick={() => toggle("tools")}>
              <span className="sb-group-icon"><Wrench size={13} /></span>
              <span className="sb-group-label">Tools</span>
              <ChevronRight
                size={13}
                className={`sb-chevron ${collapsed.tools ? "" : "rotated"}`}
              />
            </button>
            {!collapsed.tools && (
              <div className="sb-group-body">
                <NavLink to="/templates" onClick={handleNav} className="sb-item sb-item-sm">
                  <span className="sb-item-icon"><Shapes size={15} /></span>
                  <span className="sb-item-label">Templates</span>
                </NavLink>
                <NavLink to="/trash" onClick={handleNav} className="sb-item sb-item-sm">
                  <span className="sb-item-icon"><Trash2 size={15} /></span>
                  <span className="sb-item-label">Trash</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* UPGRADE BANNER (only when expanded) */}
          {!isCollapsed && user?.plan !== "pro" && (
            <div className="sb-upgrade-banner">
              <div className="sb-upgrade-icon"><Zap size={16} fill="currentColor" /></div>
              <div className="sb-upgrade-text">
                <span className="sb-upgrade-title">Upgrade to Pro</span>
                <span className="sb-upgrade-sub">Unlimited AI, analytics & more</span>
              </div>
              <button
                className="sb-upgrade-btn"
                onClick={() => navigate("/settings", { state: { tab: "billing" } })}
              >
                Upgrade
              </button>
            </div>
          )}
        </div>

        {/* ─── USER DOCK ─── */}
        <div className="sb-user-dock">
          <div className="sb-user-left" onClick={() => navigate("/profile")} role="button" tabIndex={0}>
            <div className="sb-user-avatar">
              {user?.avatar
                ? <img src={user.avatar} alt="Profile" className="sb-avatar-img" />
                : initials
              }
              <span className="sb-online-dot" />
            </div>
            <div className="sb-user-meta">
              <span className="sb-user-name">{firstName}</span>
              <span className="sb-user-plan">
                {user?.plan === "pro" ? "⚡ Pro" : "Free Plan"}
              </span>
            </div>
          </div>
          <div className="sb-user-actions">
            <NavLink
              to="/settings"
              className="sb-icon-btn"
              title="Settings"
              onClick={handleNav}
              aria-label="Settings"
            >
              <Settings size={15} />
            </NavLink>
            <button
              className="sb-icon-btn sb-logout-btn"
              title="Logout"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="sb-overlay" onClick={closeMobile} aria-label="Close menu" />
      )}
    </>
  );
}

export default Sidebar;