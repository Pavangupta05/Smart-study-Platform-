import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Users, LogOut, Loader2, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";

function StudyRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, user, firstName, initials } = useUser();
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket || !user) return;

    const userData = {
      id: user.id || user._id,
      firstName,
      initials
    };

    // Join the room
    socket.emit("join_study_room", { roomId, user: userData });
    setIsConnected(true);

    // Listen for user updates
    socket.on("study_room_users", (users) => {
      // Deduplicate by ID just in case
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
      setActiveUsers(uniqueUsers);
    });

    return () => {
      socket.emit("leave_study_room", roomId);
      socket.off("study_room_users");
      setIsConnected(false);
    };
  }, [socket, user, roomId, firstName, initials]);

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", gap: "10px" }}>
        <Loader2 size={32} className="spin" style={{ color: "var(--primary)" }} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="study-room-page fade-in" style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ padding: "4px 10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              LIVE
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>Room: {roomId}</span>
          </div>
          <h1 className="page-title" style={{ fontSize: "32px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={28} color="var(--primary)" /> Focus Room
          </h1>
          <p className="page-subtitle">Study together in real-time. Accountability leads to success.</p>
        </div>
        <button 
          onClick={() => navigate("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--surface-hover)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}
        >
          <LogOut size={16} /> Leave Room
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: "24px", flex: 1 }}>
        {/* Active Users Sidebar */}
        <div style={{ background: "rgba(var(--surface-rgb), 0.5)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <Users size={18} /> Students Present ({activeUsers.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "10px" }}>
            {activeUsers.map(u => (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--surface-hover)", borderRadius: "12px", border: "1px solid var(--border)" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary-weak)", color: "var(--primary)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>
                  {u.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{u.firstName}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Deep Focus</div>
                </div>
                {u.id === (user.id || user._id) && (
                  <span style={{ marginLeft: "auto", fontSize: "10px", padding: "2px 6px", background: "var(--primary)", color: "white", borderRadius: "10px", fontWeight: "bold" }}>YOU</span>
                )}
              </motion.div>
            ))}
            {activeUsers.length === 0 && !isConnected && (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", padding: "20px 0" }}>
                Connecting to server...
              </div>
            )}
          </div>
        </div>

        {/* Main Focus Area */}
        <div style={{ background: "rgba(var(--surface-rgb), 0.5)", border: "1px solid var(--border)", borderRadius: "20px", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "20px", textAlign: "center" }}>
          <Clock size={64} style={{ color: "var(--text-secondary)", opacity: 0.5 }} />
          <div>
            <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Deep Work Session</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
              Start your global Pomodoro timer using the floating widget in the bottom right corner. Other students in this room are currently studying.
            </p>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}} />
        </div>
      </div>
    </div>
  );
}

export default StudyRoom;
