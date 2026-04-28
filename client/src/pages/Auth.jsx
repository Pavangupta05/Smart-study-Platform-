import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Code, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate auth
    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/");
      window.location.reload(); // Refresh to update App.jsx state
    }, 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="auth-header">
            <div className="auth-logo" onClick={() => navigate("/landing")}>
              <Sparkles size={32} strokeWidth={2.5} />
              <span>STARNOTE AI</span>
            </div>
            <h1>{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p>{isLogin ? "Sign in to access your workspace" : "Join StarNote to start studying"}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  className="input-group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input type="text" placeholder="John Doe" required />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input type="email" placeholder="name@example.com" required />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>Password</label>
                {isLogin && <button type="button" className="btn-forgot-link">Forgot Password?</button>}
              </div>
              <div className="input-wrapper">
                <Lock size={18} />
                <input type="password" placeholder="••••••••" required />
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  className="terms-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <label className="checkbox-container">
                    <input type="checkbox" required />
                    <span className="checkmark"></span>
                    <span className="terms-text">I agree to the <b>Terms</b> & <b>Privacy</b></span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? (
                <div className="auth-loader"></div>
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Or continue with</span>
          </div>

          <div className="social-auth">
            <button className="social-btn"><Globe size={20} /> Google</button>
            <button className="social-btn"><Code size={20} /> Github</button>
          </div>

          <div className="auth-footer">
            <p>
              {isLogin ? "New to StarNote?" : "Already have an account?"}
              <button className="btn-link-toggle" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Sign Up Free" : "Log In"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
