import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Info, Flame, Sparkles, CheckCircle2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";
import "../styles/notifications.css";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: "AI Analysis Ready",
    text: "Your 'Physics Ch. 4' summary is ready for review.",
    time: "2m ago",
    type: "ai",
    read: false,
    Icon: Sparkles
  },
  {
    id: 2,
    title: "New Study Streak!",
    text: "You've studied for 5 days in a row. Keep it up!",
    time: "1h ago",
    type: "streak",
    read: false,
    Icon: Flame
  }
];

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef(null);
  const { socket } = useUser();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for LIVE notifications via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      // Create a unified icon mapper
      const icons = {
        ai: Sparkles,
        streak: Flame,
        info: Info,
        success: CheckCircle2
      };
      
      const newNotif = {
        id: Date.now(),
        title: data.title || "New Notification",
        text: data.message || "",
        time: "Just now",
        type: data.type || "info",
        read: false,
        Icon: icons[data.type] || Info
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Trigger a beautiful rich toast
      toast(newNotif.title, {
        description: newNotif.text,
        icon: <newNotif.Icon size={16} className={newNotif.type} />,
        duration: 4000
      });
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="notifications-wrapper" ref={dropdownRef}>
      <button 
        className={`tv2-icon-btn notif-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <div className="tv2-icon-btn-bg" />
        <Bell size={18} strokeWidth={2.0} />
        {unreadCount > 0 && (
          <span className="tv2-badge">{unreadCount}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="notif-dropdown"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="notif-header">
              <div className="notif-header-left">
                <h3>Notifications</h3>
                {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} New</span>}
              </div>
              <div className="notif-header-actions">
                <button onClick={markAllRead} title="Mark all as read">
                  <Check size={14} />
                </button>
                <button onClick={clearAll} title="Clear all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="notif-body">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className={`notif-item ${notif.read ? 'read' : 'unread'}`}>
                    <div className={`notif-icon-circle ${notif.type}`}>
                      <notif.Icon size={16} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-item-header">
                        <h4>{notif.title}</h4>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                      <p>{notif.text}</p>
                    </div>
                    {!notif.read && <div className="unread-dot" />}
                  </div>
                ))
              ) : (
                <div className="notif-empty">
                  <Bell size={40} className="empty-bell" />
                  <p>No new notifications</p>
                  <span>You're all caught up!</span>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notif-footer">
                <button onClick={clearAll}>Clear all activity</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
