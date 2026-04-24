import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Shield, Bell, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/profile-dropdown.css";

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    window.location.reload();
  };

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
      <button className="avatar-btn" onClick={() => setIsOpen(!isOpen)}>
        <div className="avatar">P</div>
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
              <div className="dropdown-avatar">P</div>
              <div className="dropdown-user-info">
                <span className="user-name">Pavangupta</span>
                <span className="user-email">pavan@example.com</span>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <button className="dropdown-item" onClick={() => { navigate("/settings"); setIsOpen(false); }}>
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => { navigate("/settings"); setIsOpen(false); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button className="dropdown-item">
                <Bell size={16} />
                <span>Notifications</span>
                <span className="notification-badge">3</span>
              </button>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <button className="dropdown-item">
                <Shield size={16} />
                <span>Privacy</span>
              </button>
              <button className="dropdown-item">
                <HelpCircle size={16} />
                <span>Help Center</span>
              </button>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-logout" onClick={handleLogout}>
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
