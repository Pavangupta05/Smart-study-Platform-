import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
  User, Bell, Palette, Lock, Sliders, Puzzle, 
  CreditCard, MonitorSmartphone, Key, Zap, 
  Smartphone, Laptop, Copy, Search, Download
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
      ]
    },
    {
      label: "Preferences",
      items: [
        { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
        { id: "integrations", label: "Integrations", icon: <Puzzle size={16} /> },
        { id: "connections", label: "Connected Accounts", icon: <Lock size={16} /> },
      ]
    },
    {
      label: "Security",
      items: [
        { id: "privacy", label: "Privacy & Data", icon: <Lock size={16} /> },
        { id: "devices", label: "Active Devices", icon: <MonitorSmartphone size={16} /> },
        { id: "developer", label: "Developer / API", icon: <Key size={16} /> },
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
                      <label style={{ color: "var(--text)" }}>Export Data</label>
                      <p>Download a JSON copy of all your notes, flashcards, and profile data.</p>
                    </div>
                    <div className="setting-action">
                      <button className="btn-secondary-sm" onClick={() => toast.success("Data export started. You will receive an email shortly.")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Download size={14} /> Export Data
                      </button>
                    </div>
                  </div>
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
                      <MinimalSwitch isOn={true} onToggle={() => {}} />
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

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Settings;
