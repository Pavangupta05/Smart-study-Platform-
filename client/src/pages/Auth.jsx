import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle, Shield, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/index";
import { useUser } from "../context/UserContext";
import { toast } from "sonner";
import "../styles/auth.css";

// Password strength calculator
const calcStrength = (pwd) => {
  let score = 0;
  if (!pwd) return { score: 0, label: "", color: "" };
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: "", color: "" },
    { label: "Very Weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
    { label: "Very Strong", color: "#10b981" },
  ];
  return { score, ...levels[Math.min(score, 5)] };
};

const PasswordStrengthBar = ({ password }) => {
  const { score, label, color } = calcStrength(password);
  if (!password) return null;
  return (
    <div className="strength-container">
      <div className="strength-bars">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ backgroundColor: i <= score ? color : "var(--border)", transition: "background-color 0.3s ease" }}
          />
        ))}
      </div>
      {label && <span className="strength-label" style={{ color }}>{label}</span>}
    </div>
  );
};

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const { refetch } = useUser();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccessMsg("");
  };

  const switchMode = useCallback((toLogin) => {
    setIsLogin(toLogin);
    setIsForgot(false);
    setError("");
    setSuccessMsg("");
    setShowPassword(false);
    setFormData({ name: "", email: "", password: "" });
  }, []);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await authService.forgotPassword({ email: formData.email });
      setSuccessMsg(res.data.message || "Reset link sent! Check your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && calcStrength(formData.password).score < 2) {
      setError("Please choose a stronger password (at least 8 characters).");
      return;
    }
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
      // Fix 2: Use context refetch + navigate instead of full page reload
      await refetch();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formTitle = isForgot ? "Reset Password" : isLogin ? "Welcome back" : "Get started free";
  const formSubtitle = isForgot
    ? "Enter your email and we'll send a reset link."
    : isLogin
    ? "Sign in to your StarNote workspace."
    : "Create your account in seconds.";

  return (
    <div className="auth-page">
      {/* Decorative ambient blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card-container">
        {/* Fix 12: Use navigate(-1) or go to landing only if history is empty */}
        <button className="auth-back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Back
        </button>
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="auth-logo" onClick={() => navigate("/landing")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && navigate("/landing")}>
            <div className="auth-logo-icon"><Sparkles size={20} strokeWidth={2.5} /></div>
            <span>StarNote AI</span>
          </div>

          {/* Heading */}
          <div className="auth-header">
            <h1>{formTitle}</h1>
            <p>{formSubtitle}</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={isForgot ? handleForgotSubmit : handleSubmit} noValidate>
            <AnimatePresence mode="popLayout">
              {!isLogin && !isForgot && (
                <motion.div
                  className="input-group"
                  key="name-field"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="auth-name">Full Name</label>
                  <div className="input-wrapper">
                    <User size={17} />
                    <input
                      id="auth-name"
                      type="text"
                      name="name"
                      placeholder="Alex Johnson"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-group">
              <label htmlFor="auth-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={17} />
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {!isForgot && (
                <motion.div
                  className="input-group"
                  key="password-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="label-row">
                    <label htmlFor="auth-password">Password</label>
                    {isLogin && (
                      <button type="button" className="btn-forgot-link" onClick={() => setIsForgot(true)}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="input-wrapper">
                    <Lock size={17} />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required={!isForgot}
                    />
                    <button
                      type="button"
                      className="btn-pw-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!isLogin && <PasswordStrengthBar password={formData.password} />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / success messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-message error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <XCircle size={15} />
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  className="auth-message success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms checkbox for signup */}
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
                    <span className="checkmark" />
                    <span className="terms-text">
                      I agree to the <b>Terms of Service</b> &amp; <b>Privacy Policy</b>
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="btn-auth-submit" disabled={isLoading} type="submit">
              {isLoading ? (
                <div className="auth-loader" />
              ) : (
                <>
                  <span>{isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Social Buttons */}
          <div className="social-auth">
            <button
              type="button"
              className="social-btn google"
              onClick={() => toast.info("Google OAuth - coming soon! We're working on it.")}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.16 44 30 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="social-btn github"
              onClick={() => toast.info("GitHub OAuth - coming soon!")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Security note */}
          <div className="auth-security-note">
            <Shield size={13} />
            <span>Your data is encrypted and secure. We never share your info.</span>
          </div>

          {/* Switch mode link */}
          <div className="auth-footer">
            <p>
              {isForgot ? (
                <button className="btn-link-toggle" onClick={() => { setIsForgot(false); setSuccessMsg(""); }}>
                  ← Back to Sign In
                </button>
              ) : isLogin ? (
                <>
                  New to StarNote?{" "}
                  <button className="btn-link-toggle" onClick={() => switchMode(false)}>
                    Create a free account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button className="btn-link-toggle" onClick={() => switchMode(true)}>
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
