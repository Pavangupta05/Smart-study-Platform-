import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  User, Bell, Palette, Lock, Sliders, Puzzle,
  CreditCard, MonitorSmartphone, Key, Zap,
  Smartphone, Laptop, Copy, Search, Download,
  LifeBuoy, Command, Info, Shield, FileText,
  Gift, Brain, Target, Eye, Database, Share2, UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { settingsService } from "../services/index";
import "../styles/settings.css";

const MinimalSwitch = ({ isOn, onToggle }) => (
  <div className="minimal-switch" onClick={onToggle}>
    <div className={`switch-track ${isOn ? 'on' : ''}`}>
      <div className="switch-thumb"></div>
    </div>
  </div>
);

function Settings() {
  const location = useLocation();
  const { user, setUser, initials } = useUser();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "general");
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Local states initialized from user context
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // Settings States
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || user?.settings?.theme || "light");
  const [language, setLanguage] = useState(user?.settings?.language || "English (US)");
  const [autoSave, setAutoSave] = useState(user?.settings?.autoSave ?? true);
  const [emailReports, setEmailReports] = useState(user?.settings?.emailReports ?? true);
  const [studyReminders, setStudyReminders] = useState(user?.settings?.studyReminders ?? false);
  const [aiData, setAiData] = useState(user?.settings?.aiDataUsage ?? false);
  const [cloudSync, setCloudSync] = useState(user?.settings?.cloudSync ?? true);
  const [publicMap, setPublicMap] = useState(false);

  // Sync name/email when user context changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user?.name && user.name !== name) {
      setName(user.name);
    }
    if (user?.email && user.email !== email) {
      setEmail(user.email);
    }
  }, [user?.name, user?.email, name, email]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleThemeToggle = (nextTheme, e) => {
    window.dispatchEvent(new CustomEvent("themeChange", {
      detail: {
        theme: nextTheme,
        clientX: e?.clientX,
        clientY: e?.clientY
      }
    }));
    updateSetting('theme', nextTheme);
  };

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.theme && e.detail.theme !== theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener("themeChangeCompleted", handleSync);
    return () => window.removeEventListener("themeChangeCompleted", handleSync);
  }, [theme]);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await settingsService.update({ name, email });
      setUser(res.data.user);
      toast.success("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = async (key, value) => {
    // Optimistic UI updates
    if (key === 'theme') setTheme(value);
    else if (key === 'language') setLanguage(value);
    else if (key === 'autoSave') setAutoSave(value);
    else if (key === 'emailReports') setEmailReports(value);
    else if (key === 'studyReminders') setStudyReminders(value);
    else if (key === 'aiDataUsage') setAiData(value);
    else if (key === 'cloudSync') setCloudSync(value);

    try {
      const newSettings = { ...user.settings, [key]: value };
      const res = await settingsService.update({ settings: newSettings });
      setUser(res.data.user);
    } catch (e) {
      console.error("Failed to save setting:", e);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText("sk_test_51Mz...");
    toast.success("API Key copied to clipboard");
  };

  // Nav configuration
  const navGroups = [
    {
      label: "Account",
      items: [
        { id: "general", label: "General", icon: <Sliders size={16} /> },
        { id: "profile", label: "My Profile", icon: <User size={16} /> },
        { id: "billing", label: "Billing & Plans", icon: <CreditCard size={16} /> },
        { id: "referrals", label: "Refer a Friend", icon: <Gift size={16} /> },
      ]
    },
    {
      label: "Study & AI",
      items: [
        { id: "ai-persona", label: "AI Tutor Persona", icon: <Brain size={16} /> },
        { id: "study-goals", label: "Study & Focus Goals", icon: <Target size={16} /> },
      ]
    },
    {
      label: "Preferences",
      items: [
        { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
        { id: "accessibility", label: "Accessibility", icon: <Eye size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
        { id: "integrations", label: "Integrations", icon: <Puzzle size={16} /> },
        { id: "connections", label: "Connected Accounts", icon: <Lock size={16} /> },
      ]
    },
    {
      label: "Data & Security",
      items: [
        { id: "data-management", label: "Import & Export", icon: <Database size={16} /> },
        { id: "privacy", label: "Privacy & Security", icon: <Shield size={16} /> },
        { id: "devices", label: "Active Devices", icon: <MonitorSmartphone size={16} /> },
        { id: "developer", label: "Developer / API", icon: <Key size={16} /> },
      ]
    },
    {
      label: "Support & Legal",
      items: [
        { id: "help", label: "Help & Support", icon: <LifeBuoy size={16} /> },
        { id: "shortcuts", label: "Keyboard Shortcuts", icon: <Command size={16} /> },
        { id: "about", label: "About Us", icon: <Info size={16} /> },
        { id: "privacy-policy", label: "Privacy Policy", icon: <Shield size={16} /> },
        { id: "terms", label: "Terms of Service", icon: <FileText size={16} /> },
      ]
    }
  ];

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account settings and preferences.</p>
      </div>

      <div className="settings-layout">
        {/* SIDEBAR NAVIGATION */}
        <div className="settings-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(120, 120, 120, 0.08)", padding: "8px 12px", borderRadius: "10px", marginBottom: "16px", flexShrink: 0 }}>
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--text)", outline: "none", fontSize: "13px", width: "100%" }}
            />
          </div>
          {navGroups.map((group, idx) => {
            const filteredItems = group.items.filter(tab => tab.label.toLowerCase().includes(searchQuery.toLowerCase()));
            if (filteredItems.length === 0) return null;
            return (
              <div key={idx}>
                <div className="settings-tab-group-lbl">{group.label}</div>
                {filteredItems.map(tab => (
                  <button
                    key={tab.id}
                    className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="settings-main">
          <AnimatePresence mode="wait">

            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>General Settings</h2>
                <p>Configure base application behavior.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Language</label>
                      <p>Select your preferred language.</p>
                    </div>
                    <div className="setting-action">
                      <select className="minimal-select" value={language} onChange={(e) => updateSetting('language', e.target.value)}>
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                      </select>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Auto-Save Notes</label>
                      <p>Automatically save changes every few seconds to prevent data loss.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={autoSave} onToggle={() => updateSetting('autoSave', !autoSave)} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>My Profile</h2>
                <p>Manage your public identity and personal details.</p>

                <div className="setting-card">
                  <div className="profile-edit">
                    <div className="profile-avatar-wrap">
                      <div className="profile-avatar-large">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="Profile" />
                        ) : (
                          initials
                        )}
                        <div className="profile-avatar-overlay">Change</div>
                      </div>
                      <button className="btn-secondary-sm" onClick={() => toast.info("Avatar upload coming soon.")}>Upload New</button>
                    </div>
                    <div className="profile-form">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="minimal-input" placeholder="Your Name" />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="minimal-input" placeholder="you@example.com" />
                      </div>
                      <div style={{ marginTop: "24px" }}>
                        <button className="btn-primary-sm" onClick={saveProfile} disabled={isSaving}>
                          {isSaving ? "Saving Changes..." : "Save Profile"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="setting-card danger-zone">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Delete Account</label>
                      <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-danger-sm" onClick={() => toast.error("Account deletion requires email verification.")}>Delete Account</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BILLING TAB */}
            {activeTab === "billing" && (
              <motion.div key="billing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Billing & Plans</h2>
                <p>Manage your subscription and billing details.</p>

                {user?.plan === 'pro' ? (
                  <div className="plan-card">
                    <div>
                      <h3 style={{ color: "var(--primary)" }}><Zap size={18} fill="currentColor" /> Pro Plan Active</h3>
                      <p>You are on the Pro plan. Renews on June 15, 2026.</p>
                    </div>
                    <button className="btn-secondary-sm">Manage Billing</button>
                  </div>
                ) : (
                  <div className="plan-card">
                    <div>
                      <h3>Free Plan</h3>
                      <p>Upgrade to Pro for unlimited AI and advanced features.</p>
                    </div>
                    <button className="btn-primary-sm">Upgrade Now</button>
                  </div>
                )}

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Payment Methods</label>
                      <p>No payment methods on file.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm">Add Card</button>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Invoices</label>
                      <p>View your past billing statements.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm">View History</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Appearance</h2>
                <p>Customize the look and feel of your workspace.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                  {/* Light Theme Preview */}
                  <div onClick={(e) => handleThemeToggle("light", e)} style={{ padding: "12px", border: theme === "light" ? "2px solid var(--primary)" : "2px solid rgba(120,120,120,0.1)", borderRadius: "12px", cursor: "pointer", background: "#f8fafc" }}>
                    <div style={{ width: "100%", height: "80px", background: "#ffffff", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", overflow: "hidden" }}>
                      <div style={{ width: "25%", background: "#f1f5f9", height: "100%", borderRight: "1px solid #e2e8f0" }}></div>
                      <div style={{ flex: 1, padding: "8px" }}>
                        <div style={{ width: "60%", height: "6px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "8px" }}></div>
                        <div style={{ width: "100%", height: "30px", background: "#f1f5f9", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                    <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>Light Mode</p>
                  </div>
                  {/* Dark Theme Preview */}
                  <div onClick={(e) => handleThemeToggle("dark", e)} style={{ padding: "12px", border: theme === "dark" ? "2px solid var(--primary)" : "2px solid rgba(120,120,120,0.1)", borderRadius: "12px", cursor: "pointer", background: "#0f172a" }}>
                    <div style={{ width: "100%", height: "80px", background: "#1e293b", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", overflow: "hidden" }}>
                      <div style={{ width: "25%", background: "#0f172a", height: "100%", borderRight: "1px solid #334155" }}></div>
                      <div style={{ flex: 1, padding: "8px" }}>
                        <div style={{ width: "60%", height: "6px", background: "#334155", borderRadius: "4px", marginBottom: "8px" }}></div>
                        <div style={{ width: "100%", height: "30px", background: "#334155", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                    <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>Dark Mode</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>App Theme</label>
                      <p>Switch between light and dark modes.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={theme === "dark"} onToggle={(e) => {
                        const next = theme === "dark" ? "light" : "dark";
                        handleThemeToggle(next, e);
                      }} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Compact Mode</label>
                      <p>Reduce padding and margins to fit more content on screen.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={false} onToggle={() => toast.info("Compact mode is in beta.")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Notifications</h2>
                <p>Choose what we notify you about.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Email Reports</label>
                      <p>Get a weekly summary of your study progress and analytics.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={emailReports} onToggle={() => updateSetting('emailReports', !emailReports)} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Study Reminders</label>
                      <p>Receive push notifications when it's time for a scheduled session.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={studyReminders} onToggle={() => updateSetting('studyReminders', !studyReminders)} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Product Updates</label>
                      <p>Receive emails about new features and improvements.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={true} onToggle={() => { }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* INTEGRATIONS TAB */}
            {activeTab === "integrations" && (
              <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Integrations</h2>
                <p>Connect StarNote with your favorite productivity tools.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, background: "#fbbc05", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>G</div>
                      <div>
                        <label>Google Calendar</label>
                        <p style={{ margin: 0 }}>Sync your study planner with Google Calendar.</p>
                      </div>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.info("Integration coming soon!")}>Connect</button>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, background: "#000", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>N</div>
                      <div>
                        <label>Notion</label>
                        <p style={{ margin: 0 }}>Export your notes and flashcards directly to Notion.</p>
                      </div>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.info("Integration coming soon!")}>Connect</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CONNECTIONS TAB */}
            {activeTab === "connections" && (
              <motion.div key="connections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Connected Accounts</h2>
                <p>Manage single sign-on providers linked to your account.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Google Account</label>
                      <p>vinod@example.com (Connected)</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-danger-sm" onClick={() => toast.error("Cannot disconnect your primary login method.")}>Disconnect</button>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>GitHub Account</label>
                      <p>Not connected</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.info("GitHub SSO coming soon.")}>Connect GitHub</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRIVACY & DATA TAB */}
            {activeTab === "privacy" && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Privacy & Data</h2>
                <p>Manage how your data is used and shared.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>AI Data Usage</label>
                      <p>Allow our AI models to learn from your study patterns to improve suggestions. Data is anonymized.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={aiData} onToggle={() => updateSetting('aiDataUsage', !aiData)} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Cloud Sync</label>
                      <p>Sync your tasks and notes to the cloud. If disabled, new items will only be saved locally.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={cloudSync} onToggle={() => updateSetting('cloudSync', !cloudSync)} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Public Knowledge Map</label>
                      <p>Allow others to view your high-level subject connections.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={publicMap} onToggle={() => setPublicMap(!publicMap)} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEVICES TAB (MOCK) */}
            {activeTab === "devices" && (
              <motion.div key="devices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Active Devices</h2>
                <p>Manage the devices currently logged into your account.</p>

                <div className="setting-card">
                  <div className="device-item">
                    <div className="device-icon"><Laptop size={20} /></div>
                    <div className="device-info">
                      <strong>Windows PC — Chrome</strong>
                      <span>New York, US · Active now</span>
                    </div>
                    <span className="device-current">Current Device</span>
                  </div>
                  <div className="device-item">
                    <div className="device-icon"><Smartphone size={20} /></div>
                    <div className="device-info">
                      <strong>iPhone 14 Pro — Safari</strong>
                      <span>New York, US · Last active 2 hours ago</span>
                    </div>
                    <button className="btn-secondary-sm" style={{ padding: "6px 12px", fontSize: "12px" }}>Sign Out</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DEVELOPER / API TAB (MOCK) */}
            {activeTab === "developer" && (
              <motion.div key="developer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Developer & API</h2>
                <p>Manage your API keys for programmatic access.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Production API Key</label>
                      <p>Use this key to access the StarNote API. Do not share it.</p>
                    </div>
                  </div>
                  <div style={{ padding: "0 24px 24px" }}>
                    <div className="api-key-row">
                      <input type="password" value="sk_test_51MzXXXXXXXXXXXXXXXXXXXXXX" readOnly className="minimal-input" style={{ margin: 0, fontFamily: "monospace", flex: 1, minWidth: 0 }} />
                      <button className="btn-secondary-sm" onClick={copyApiKey} style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, justifyContent: "center" }}>
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* HELP & SUPPORT TAB */}
            {activeTab === "help" && (
              <motion.div key="help" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Help & Support</h2>
                <p>Find answers or contact our support team.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Contact Support</label>
                      <p>Email us at support@starnote.ai for priority assistance.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => window.location.href="mailto:support@starnote.ai"}>Email Support</button>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Knowledge Base</label>
                      <p>Browse our detailed documentation and guides.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.info("Knowledge Base is opening in a new tab...")}>View Docs</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* KEYBOARD SHORTCUTS TAB */}
            {activeTab === "shortcuts" && (
              <motion.div key="shortcuts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Keyboard Shortcuts</h2>
                <p>Master these shortcuts to navigate StarNote like a pro.</p>

                <div className="setting-card">
                  {[
                    { label: "Open Command Palette", key: "Ctrl + K" },
                    { label: "Create New Note", key: "C + N" },
                    { label: "Go to Dashboard", key: "G + D" },
                    { label: "Go to Notes", key: "G + N" },
                    { label: "Ask AI", key: "G + A" },
                    { label: "Toggle Dark Mode", key: "Ctrl + Shift + L" }
                  ].map((shortcut, i) => (
                    <div className="setting-item" key={i}>
                      <div className="setting-info">
                        <label>{shortcut.label}</label>
                      </div>
                      <div className="setting-action">
                        <kbd style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", color: "var(--text)" }}>{shortcut.key}</kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ABOUT US TAB */}
            {activeTab === "about" && (
              <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>About StarNote</h2>
                <p>The AI-native workspace for elite students.</p>

                <div className="setting-card" style={{ padding: "32px", textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", background: "var(--primary-weak)", color: "var(--primary)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Info size={32} />
                  </div>
                  <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>StarNote AI</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>Version 2.0.0 (Build 4912)</p>
                  
                  <p style={{ color: "var(--text)", lineHeight: "1.6", maxWidth: "400px", margin: "0 auto 24px" }}>
                    Our mission is to help students learn faster, retain more, and completely eliminate friction from the studying process using cutting-edge AI.
                  </p>

                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <button className="btn-secondary-sm">Check for Updates</button>
                    <button className="btn-secondary-sm">Follow on Twitter</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PRIVACY POLICY TAB */}
            {activeTab === "privacy-policy" && (
              <motion.div key="privacy-policy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Privacy Policy</h2>
                <p>Last updated: June 6, 2026</p>

                <div className="setting-card" style={{ padding: "24px", lineHeight: "1.6", color: "var(--text)" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>1. Information We Collect</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>We collect information you provide directly to us, such as when you create an account, upload documents, or communicate with us. This includes your name, email, and uploaded study materials.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>2. How We Use Your Information</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>We use the information we collect to provide, maintain, and improve our services, including processing your documents through our AI models (which are not trained on your private data) to generate summaries and flashcards.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>3. Data Security</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>We use industry-standard encryption (AES-256) to protect your data at rest and in transit. Your documents remain private and are only accessible by you.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>4. Contact Us</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>If you have any questions about this Privacy Policy, please contact us at privacy@starnote.ai.</p>
                </div>
              </motion.div>
            )}

            {/* TERMS OF SERVICE TAB */}
            {activeTab === "terms" && (
              <motion.div key="terms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Terms of Service</h2>
                <p>Last updated: June 6, 2026</p>

                <div className="setting-card" style={{ padding: "24px", lineHeight: "1.6", color: "var(--text)" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>1. Acceptance of Terms</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>By accessing or using StarNote, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>2. Description of Service</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>StarNote provides an AI-assisted study platform. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>3. User Conduct & Uploads</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>You retain all rights to the content you upload. You agree not to upload any content that is illegal, infringes on intellectual property, or contains malicious software.</p>

                  <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>4. AI Generation Disclaimer</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>Content generated by StarNote's AI is for educational purposes only. We do not guarantee 100% accuracy, and users should verify critical information against primary sources.</p>
                </div>
              </motion.div>
            )}

            {/* REFERRALS TAB */}
            {activeTab === "referrals" && (
              <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Refer a Friend</h2>
                <p>Invite friends and earn free months of StarNote Pro.</p>

                <div className="plan-card" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))", border: "1px solid var(--primary-weak)" }}>
                  <div>
                    <h3 style={{ color: "var(--primary)" }}><Gift size={18} /> Invite & Earn</h3>
                    <p>For every friend who signs up with your link, you both get 1 month of Pro.</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info" style={{ flex: 1 }}>
                      <label>Your Invite Link</label>
                      <div className="api-key-row" style={{ marginTop: "8px" }}>
                        <input type="text" value="https://starnote.ai/invite/vGupta92" readOnly className="minimal-input" style={{ margin: 0, flex: 1 }} />
                        <button className="btn-secondary-sm" onClick={() => { navigator.clipboard.writeText("https://starnote.ai/invite/vGupta92"); toast.success("Invite link copied!"); }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Copy size={14} /> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Share via Social</label>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Share2 size={14} /> Share Link</button>
                    </div>
                  </div>
                </div>

                <div className="setting-card">
                  <div style={{ padding: "16px 20px" }}>
                    <h3 style={{ fontSize: "14px", marginBottom: "16px" }}>Your Referrals (0)</h3>
                    <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                      No friends have joined yet. Share your link to get started!
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI PERSONA TAB */}
            {activeTab === "ai-persona" && (
              <motion.div key="ai-persona" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>AI Tutor Persona</h2>
                <p>Customize how the AI talks to you and generates content.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Tutor Personality</label>
                      <p>Select the tone the AI uses when answering your questions.</p>
                    </div>
                    <div className="setting-action">
                      <select className="minimal-select" defaultValue="socratic">
                        <option value="socratic">Socratic (Guides you)</option>
                        <option value="direct">Direct & Concise</option>
                        <option value="encouraging">Encouraging Coach</option>
                      </select>
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>AI Creativity Level</label>
                      <p>Higher levels make the AI more conversational, lower levels make it more factual.</p>
                    </div>
                    <div className="setting-action" style={{ width: "150px" }}>
                      <input type="range" min="0" max="100" defaultValue="40" style={{ width: "100%", accentColor: "var(--primary)" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STUDY GOALS TAB */}
            {activeTab === "study-goals" && (
              <motion.div key="study-goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Study & Focus Goals</h2>
                <p>Set your baseline targets for the Pomodoro timer and flashcards.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Pomodoro Duration (Minutes)</label>
                      <p>Default length for deep focus sessions.</p>
                    </div>
                    <div className="setting-action">
                      <input type="number" defaultValue={25} min={10} max={120} className="minimal-input" style={{ width: "80px", textAlign: "center" }} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Short Break Duration (Minutes)</label>
                    </div>
                    <div className="setting-action">
                      <input type="number" defaultValue={5} min={1} max={30} className="minimal-input" style={{ width: "80px", textAlign: "center" }} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Daily Flashcard Goal</label>
                      <p>Target number of cards to review per day to maintain your streak.</p>
                    </div>
                    <div className="setting-action">
                      <input type="number" defaultValue={50} min={10} max={500} className="minimal-input" style={{ width: "80px", textAlign: "center" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ACCESSIBILITY TAB */}
            {activeTab === "accessibility" && (
              <motion.div key="accessibility" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Accessibility</h2>
                <p>Make StarNote easier to read and use.</p>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Dyslexia-Friendly Font</label>
                      <p>Use OpenDyslexic font everywhere in the app to improve readability.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={false} onToggle={() => toast.info("Font downloaded and applied.")} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Reduce Motion</label>
                      <p>Disable spring animations, floating orbs, and screen transitions.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={false} onToggle={() => toast.info("Motion reduced.")} />
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>High Contrast UI</label>
                      <p>Increase border thickness and text contrast for better visibility.</p>
                    </div>
                    <div className="setting-action">
                      <MinimalSwitch isOn={false} onToggle={() => toast.info("High contrast enabled.")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DATA MANAGEMENT TAB */}
            {activeTab === "data-management" && (
              <motion.div key="data-management" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="settings-content-section">
                <h2>Import & Export</h2>
                <p>Bring your existing data into StarNote or take it out.</p>

                <div className="setting-card" style={{ marginBottom: "24px" }}>
                  <div className="setting-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: "16px" }}>
                    <div className="setting-info">
                      <label>Import Flashcards</label>
                      <p>Upload Anki (.apkg) or CSV files to instantly create StarNote decks.</p>
                    </div>
                    <div style={{ width: "100%", border: "2px dashed var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }} onClick={() => toast.info("File browser opened.")}>
                      <UploadCloud size={32} style={{ color: "var(--primary)", margin: "0 auto 12px" }} />
                      <h4 style={{ fontSize: "14px", marginBottom: "4px" }}>Click to upload file</h4>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Supports .apkg, .csv, and .txt formats</p>
                    </div>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label style={{ color: "var(--text)" }}>Export All Data</label>
                      <p>Download a JSON copy of all your notes, flashcards, and profile data.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.success("Data export started. You will receive an email shortly.")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Download size={14} /> Export JSON
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Settings;
