import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Info, Flame, Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";
import { notificationsService } from "../services";
import "../styles/notifications.css";

const ICONS = {
  ai: Sparkles,
  streak: Flame,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const { socket, user } = useUser();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getAll();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

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

    const handleNewNotification = (notifDoc) => {
      setNotifications((prev) => [notifDoc, ...prev]);

      const Icon = ICONS[notifDoc.type] || Info;
      toast(notifDoc.title, {
        description: notifDoc.message,
        icon: <Icon size={16} className={notifDoc.type} />,
        duration: 4000
      });
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await notificationsService.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id, currentReadState) => {
    if (currentReadState) return;
    try {
      await notificationsService.markRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
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
          <span className="tv2-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
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
                notifications.map((notif) => {
                  const Icon = ICONS[notif.type] || Info;
                  // Simple relative time approximation for demo
                  const timeStr = new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  
                  return (
                    <div 
                      key={notif._id} 
                      className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                      onClick={() => markSingleRead(notif._id, notif.read)}
                    >
                      <div className={`notif-icon-circle ${notif.type}`}>
                        <Icon size={16} />
                      </div>
                      <div className="notif-content">
                        <div className="notif-item-header">
                          <h4>{notif.title}</h4>
                          <span className="notif-time">{timeStr}</span>
                        </div>
                        <p>{notif.message}</p>
                      </div>
                      {!notif.read && <div className="unread-dot" />}
                    </div>
                  );
                })
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
