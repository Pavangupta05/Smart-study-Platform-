import { motion } from "framer-motion";
import "../styles/preloader.css";

function Preloader() {
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
