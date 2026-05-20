import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Shield, Bell, HelpCircle, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { hasVoiceGuruBadge } from "../utils/studyGamification";
import "../styles/profile-dropdown.css";

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, initials, logout } = useUser();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button className="avatar-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Open profile menu">
        <div className="avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="avatar-img-tiny" />
          ) : (
            initials
          )}
        </div>
        {hasVoiceGuruBadge() && (
          <span className="avatar-voice-guru" title="Voice Guru badge">
            <Award size={12} />
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="profile-dropdown"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="avatar-img-tiny" />
                ) : (
                  initials
                )}
              </div>
              <div className="dropdown-user-info">
                <span className="user-name">{user?.name || "Student"}</span>
                <span className="user-email">{user?.email || ""}</span>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <button className="dropdown-item" onClick={() => { navigate("/profile"); setIsOpen(false); }}>
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => { navigate("/settings", { state: { tab: "general" } }); setIsOpen(false); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button className="dropdown-item" onClick={() => { navigate("/settings", { state: { tab: "notifications" } }); setIsOpen(false); }}>
                <Bell size={16} />
                <span>Notifications</span>
              </button>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <button className="dropdown-item" onClick={() => { navigate("/settings", { state: { tab: "privacy" } }); setIsOpen(false); }}>
                <Shield size={16} />
                <span>Privacy</span>
              </button>
              <button className="dropdown-item" onClick={() => { navigate("/settings", { state: { tab: "integrations" } }); setIsOpen(false); }}>
                <HelpCircle size={16} />
                <span>Integrations</span>
              </button>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-logout" onClick={() => { logout(); setIsOpen(false); }}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileDropdown;
