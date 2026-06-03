import { motion } from "framer-motion";
import "../styles/preloader.css";
import { useUser } from "../context/UserContext";

function Preloader() {
  let slowStart = false;
  try {
    const userCtx = useUser();
    slowStart = userCtx?.isSlowStart;
  } catch (e) {
    // If used outside UserProvider, fallback to false
  }

  return (
    <div className="preloader-container">
      <div className="preloader-content">
        <motion.div 
          className="preloader-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="logo-pulse"></div>
          <span className="logo-text">STARNOTE</span>
        </motion.div>
        
        {slowStart && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ marginTop: '20px', color: 'var(--primary)', fontSize: '14px', fontWeight: 500 }}
          >
            Our server is waking up (free tier). This takes ~30 seconds...
          </motion.div>
        )}
        
        <div className="preloader-bar-container">
          <motion.div 
            className="preloader-bar"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
      
      <div className="preloader-bg-glow"></div>
    </div>
  );
}

export default Preloader;
