import { useState, useEffect } from "react";
import { 
  User, Mail, Calendar, Award, BookOpen, 
  Layers, Zap, Clock, MessageSquare, Activity,
  Settings, GraduationCap, ChevronRight, Edit3, 
  CreditCard, BarChart3, BookMarked
} from "lucide-react";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const { user, initials, setUser } = useUser();
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed base64
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setPhotoPreview(compressedBase64);
          setUser({ avatar: compressedBase64 });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  // Format date
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Joined recently";

  const stats = [
    { label: "Courses", value: user?.studyStats?.courses || 0, icon: BookOpen, color: "#3b82f6" },
    { label: "Materials", value: user?.studyStats?.materials || 0, icon: Layers, color: "#8b5cf6" },
    { label: "Flashcards", value: user?.studyStats?.cardsMastered || 0, icon: Award, color: "#10b981" },
    { label: "Quizzes", value: user?.studyStats?.quizzes || 0, icon: Zap, color: "#f59e0b" },
    { label: "Study Sessions", value: user?.studyStats?.sessions || 0, icon: Clock, color: "#ef4444" },
    { label: "Study Time", value: `${Math.round((user?.studyStats?.focusTime || 0) / 60)}m`, icon: Activity, color: "#06b6d4" },
    { label: "AI Conversations", value: user?.studyStats?.aiChats || 0, icon: MessageSquare, color: "#ec4899" },
    { label: "Avg Session", value: `${user?.studyStats?.avgSession || 0}m`, icon: Clock, color: "#6366f1" },
  ];

  return (
    <div className="profile-container">
      <motion.div 
        className="profile-content"
        initial="hidden"
        animate="visible"
        variants={containerVars}
      >
        {/* Header Section */}
        <motion.div className="profile-header-card" variants={itemVars}>
          <div className="profile-banner">
            <div className="banner-gradient"></div>
            <div className="profile-avatar-wrapper">
              <label htmlFor="avatar-upload" className="profile-avatar-large clickable">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="avatar-img-full" />
                ) : (
                  initials
                )}
                <div className="avatar-overlay">
                  <Edit3 size={20} />
                </div>
              </label>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                style={{ display: "none" }} 
              />
            </div>
          </div>
          
          <div className="profile-main-info">
            <div className="info-left">
              <h1 className="profile-name">{user?.name || "Student"}</h1>
              <div className="profile-meta-row">
                <span className="meta-item">
                  <Mail size={15} />
                  {user?.email}
                </span>
                <span className="meta-item">
                  <Calendar size={15} />
                  Joined {memberSince}
                </span>
              </div>
            </div>
            <button className="btn-edit-profile" onClick={() => navigate("/settings")}>
              <Edit3 size={18} />
              <span>Edit Profile</span>
            </button>
          </div>
        </motion.div>

        <div className="profile-grid">
          {/* Left Column: Academic & Account */}
          <div className="profile-left-col">
            <motion.section className="profile-section-card" variants={itemVars}>
              <div className="section-header">
                <GraduationCap size={18} className="header-icon academic" />
                <h2>Academic Information</h2>
              </div>
              <div className="section-body">
                <div className="info-field">
                  <span className="field-label">Full Name</span>
                  <span className="field-value">{user?.name || "Not set"}</span>
                </div>
                <div className="info-field">
                  <span className="field-label">University / Institution</span>
                  <span className="field-value">{user?.academicInfo?.institution || "Not set"}</span>
                </div>
                <div className="info-field">
                  <span className="field-label">Major / Field of Study</span>
                  <span className="field-value">{user?.academicInfo?.major || "Not set"}</span>
                </div>
              </div>
            </motion.section>

            <motion.section className="profile-section-card" variants={itemVars}>
              <div className="section-header">
                <User size={18} className="header-icon account" />
                <h2>Account Details</h2>
              </div>
              <div className="section-body">
                <div className="info-field">
                  <span className="field-label">Email Address</span>
                  <span className="field-value">{user?.email}</span>
                </div>
                <div className="info-field">
                  <span className="field-label">Member Since</span>
                  <span className="field-value">{memberSince}</span>
                </div>
                <div className="info-field">
                  <span className="field-label">Subscription</span>
                  <span className="field-value">Free Plan</span>
                </div>
                <button className="btn-upgrade">
                  <Zap size={16} fill="currentColor" />
                  <span>Upgrade to Premium</span>
                </button>
              </div>
            </motion.section>
          </div>

          {/* Right Column: Statistics */}
          <div className="profile-right-col">
            <motion.section className="profile-section-card stats-section" variants={itemVars}>
              <div className="section-header">
                <Activity size={18} className="header-icon statistics" />
                <h2>Study Statistics</h2>
              </div>
              <div className="stats-grid">
                {stats.map((stat, idx) => (
                  <div key={idx} className="stat-pill">
                    <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                      <stat.icon size={18} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{stat.value}</span>
                      <span className="stat-label">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Quick Navigation Cards */}
            <div className="quick-actions-row">
              <motion.div 
                className="action-card" 
                variants={itemVars}
                onClick={() => navigate("/settings")}
              >
                <div className="action-icon settings">
                  <Settings size={20} />
                </div>
                <div className="action-info">
                  <h3>Settings</h3>
                  <p>Preferences & security</p>
                </div>
                <ChevronRight size={16} className="arrow" />
              </motion.div>

              <motion.div 
                className="action-card" 
                variants={itemVars}
                onClick={() => navigate("/notes")}
              >
                <div className="action-icon courses">
                  <BookMarked size={20} />
                </div>
                <div className="action-info">
                  <h3>My Courses</h3>
                  <p>{user?.studyStats?.courses || 0} courses enrolled</p>
                </div>
                <ChevronRight size={16} className="arrow" />
              </motion.div>

              <motion.div 
                className="action-card" 
                variants={itemVars}
                onClick={() => navigate("/")}
              >
                <div className="action-icon analytics">
                  <BarChart3 size={20} />
                </div>
                <div className="action-info">
                  <h3>Analytics</h3>
                  <p>View detailed insights</p>
                </div>
                <ChevronRight size={16} className="arrow" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Profile;
