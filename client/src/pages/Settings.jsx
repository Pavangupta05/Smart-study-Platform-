import { useState, useEffect } from "react";
import { Moon, Sun, User, Bell, Shield, Palette, Globe, Lock, Sliders, Check } from "lucide-react";
import "../styles/settings.css";

function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  
  // Toggle States
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [autoSave, setAutoSave] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [studyReminders, setStudyReminders] = useState(false);
  const [aiData, setAiData] = useState(false);
  const [publicMap, setPublicMap] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const tabs = [
    { id: "general", label: "General", icon: <Sliders size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "privacy", label: "Privacy & Security", icon: <Lock size={18} /> },
  ];

  const MinimalSwitch = ({ isOn, onToggle }) => (
    <div className="minimal-switch" onClick={onToggle}>
      <div className={`switch-track ${isOn ? 'on' : ''}`}>
        <div className="switch-thumb"></div>
      </div>
    </div>
  );

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
                  <MinimalSwitch isOn={dark} onToggle={() => setDark(!dark)} />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Language</label>
                    <p>Select your preferred language.</p>
                  </div>
                  <select className="minimal-select">
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
                  <MinimalSwitch isOn={autoSave} onToggle={() => setAutoSave(!autoSave)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="settings-content-section slide-up">
              <h2>My Profile</h2>
              <div className="setting-card">
                <div className="profile-edit">
                  <div className="profile-avatar-large">P</div>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" defaultValue="Pavan Gupta" className="minimal-input" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" defaultValue="pavan.gupta@example.com" className="minimal-input" />
                    </div>
                    <button className="btn-primary-sm">Save Profile</button>
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
                  <MinimalSwitch isOn={emailReports} onToggle={() => setEmailReports(!emailReports)} />
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Study Reminders</label>
                    <p>Notify me when it's time for a scheduled session.</p>
                  </div>
                  <MinimalSwitch isOn={studyReminders} onToggle={() => setStudyReminders(!studyReminders)} />
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
                  <MinimalSwitch isOn={aiData} onToggle={() => setAiData(!aiData)} />
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

        </div>
      </div>
    </div>
  );
}

export default Settings;
