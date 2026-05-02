import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Code, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/index";
import "../styles/auth.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccessMsg("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await authService.forgotPassword({ email: formData.email });
      setSuccessMsg(res.data.message || "Email sent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = isLogin
        ? await authService.login({ email: formData.email, password: formData.password })
        : await authService.register({ name: formData.name, email: formData.email, password: formData.password });
      
      const { token, user } = res.data;
      localStorage.setItem("starNote_token", token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("starNote_user", JSON.stringify(user));
      window.location.href = "/"; // Full reload so App.jsx picks up the new auth state
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            <h1>{isForgot ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p>{isForgot ? "Enter your email to receive a reset link" : isLogin ? "Sign in to access your workspace" : "Join StarNote to start studying"}</p>
          </div>

          <form className="auth-form" onSubmit={isForgot ? handleForgotSubmit : handleSubmit}>
            <AnimatePresence mode="popLayout">
              {!isLogin && !isForgot && (
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
                    <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {!isForgot && (
                <motion.div 
                  className="input-group"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="label-row">
                    <label>Password</label>
                    {isLogin && <button type="button" className="btn-forgot-link" onClick={() => setIsForgot(true)}>Forgot Password?</button>}
                  </div>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required={!isForgot} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="auth-error">{error}</p>}
            {successMsg && <p className="auth-error" style={{ color: "var(--primary)", background: "rgba(var(--primary-rgb), 0.1)", border: "1px solid var(--primary)" }}>{successMsg}</p>}

            <AnimatePresence>
              {!isLogin && !isForgot && (
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
                  <span>{isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}</span>
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
              {isForgot ? (
                <button className="btn-link-toggle" onClick={() => setIsForgot(false)}>Back to Login</button>
              ) : isLogin ? (
                <>New to StarNote? <button className="btn-link-toggle" onClick={() => setIsLogin(false)}>Sign Up Free</button></>
              ) : (
                <>Already have an account? <button className="btn-link-toggle" onClick={() => setIsLogin(true)}>Log In</button></>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
