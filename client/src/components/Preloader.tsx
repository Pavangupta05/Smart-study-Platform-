import React from "react";
import "../styles/preloader.css";
import { useUser } from "../context/UserContext";

const Preloader: React.FC = () => {
  let slowStart = false;
  try {
    const userCtx = useUser() as any;
    slowStart = userCtx?.isSlowStart || false;
  } catch (e) {
    // If used outside UserProvider, fallback to false
  }

  return (
    <div className="preloader-container">
      <div className="preloader-content fade-in-up">
        <div className="preloader-logo">
          <div className="logo-pulse"></div>
          <span className="logo-text">STARNOTE</span>
        </div>
        
        {slowStart && (
          <div 
            className="fade-in-up delay-2"
            style={{ marginTop: '20px', color: 'var(--primary)', fontSize: '14px', fontWeight: 500 }}
          >
            Our server is waking up (free tier). This takes ~30 seconds...
          </div>
        )}
        
        <div className="preloader-bar-container">
          <div className="preloader-bar animate-load" />
        </div>
      </div>
      
      <div className="preloader-bg-glow"></div>
    </div>
  );
}

export default Preloader;
