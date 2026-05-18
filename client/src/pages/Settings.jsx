import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Moon, Sun, User, Bell, Shield, Palette, Globe, Lock, Sliders, Check, Puzzle } from "lucide-react";
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
  const [publicMap, setPublicMap] = useState(false); // not in schema yet, keep local

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    localStorage.setItem("theme", theme);
    // Dispatch a custom event so App.jsx can sync its state
    window.dispatchEvent(new CustomEvent("themeChange", { detail: { theme } }));
  }, [theme]);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await settingsService.update({ name, email });
      setUser(res.data.user);
    } catch (e) {
      console.error(e);
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

  const tabs = [
    { id: "general", label: "General", icon: <Sliders size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "privacy", label: "Privacy & Security", icon: <Lock size={18} /> },
    { id: "integrations", label: "Integrations", icon: <Puzzle size={18} /> },
  ];

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your StarNote environment.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map(tab => (
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

        <div className="settings-main">
          
          {activeTab === "general" && (
            <div className="settings-content-section slide-up">
              <h2>General Preferences</h2>
              
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>App Theme</label>
                    <p>Switch between light and dark modes.</p>
                  </div>
                  <MinimalSwitch isOn={theme === "dark"} onToggle={() => setTheme(theme === "dark" ? "light" : "dark")} />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Language</label>
                    <p>Select your preferred language.</p>
                  </div>
                  <select className="minimal-select" value={language} onChange={(e) => updateSetting('language', e.target.value)}>
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                  </select>
                </div>
              </div>

              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Auto-Save Notes</label>
                    <p>Automatically save changes every 5 seconds.</p>
                  </div>
                  <MinimalSwitch isOn={autoSave} onToggle={() => updateSetting('autoSave', !autoSave)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="settings-content-section slide-up">
              <h2>My Profile</h2>
              <div className="setting-card">
                <div className="profile-edit">
                  <div className="profile-avatar-large">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="minimal-input" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="minimal-input" />
                    </div>
                    <button className="btn-primary-sm" onClick={saveProfile} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-content-section slide-up">
              <h2>Notifications</h2>
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email Reports</label>
                    <p>Get a weekly summary of your study progress.</p>
                  </div>
                  <MinimalSwitch isOn={emailReports} onToggle={() => updateSetting('emailReports', !emailReports)} />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Study Reminders</label>
                    <p>Notify me when it's time for a scheduled session.</p>
                  </div>
                  <MinimalSwitch isOn={studyReminders} onToggle={() => updateSetting('studyReminders', !studyReminders)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="settings-content-section slide-up">
              <h2>Privacy & Security</h2>
              <div className="setting-card">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>AI Data Usage</label>
                    <p>Allow AI to learn from your study patterns to improve suggestions.</p>
                  </div>
                  <MinimalSwitch isOn={aiData} onToggle={() => updateSetting('aiDataUsage', !aiData)} />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Public Knowledge Map</label>
                    <p>Allow others to see your high-level subject connections.</p>
                  </div>
                  <MinimalSwitch isOn={publicMap} onToggle={() => setPublicMap(!publicMap)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="settings-content-section slide-up">
              <h2>Integrations</h2>
              <p className="page-subtitle" style={{ marginBottom: "20px" }}>Connect StarNote with your favorite tools.</p>
              <div className="setting-card">
                <div className="setting-item" style={{ alignItems: "center" }}>
                  <div className="setting-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, background: "#fbbc05", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>G</div>
                    <div>
                      <label>Google Calendar</label>
                      <p>Sync your study planner with Google Calendar.</p>
                    </div>
                  </div>
                  <button className="btn-primary-sm" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }} onClick={() => alert("Google Calendar integration coming soon!")}>Connect</button>
                </div>
                
                <div className="setting-item" style={{ alignItems: "center" }}>
                  <div className="setting-info" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, background: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>N</div>
                    <div>
                      <label>Notion</label>
                      <p>Export your notes and flashcards to Notion.</p>
                    </div>
                  </div>
                  <button className="btn-primary-sm" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }} onClick={() => alert("Notion export coming soon!")}>Connect</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Settings;
