import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authService } from "../services/index";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import "../styles/auth.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await authService.resetPassword(token, { password });
      
      const { token: authToken, user } = res.data;
      localStorage.setItem("starNote_token", authToken);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("starNote_user", JSON.stringify(user));
      window.location.href = "/"; // Auto login and redirect
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-container">
        <motion.div className="auth-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="auth-header">
            <div className="auth-logo" onClick={() => navigate("/landing")}>
              <Sparkles size={32} strokeWidth={2.5} />
              <span>STARNOTE AI</span>
            </div>
            <h1>Reset Password</h1>
            <p>Enter your new password below.</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? <div className="auth-loader"></div> : <><span>Save Password</span><ArrowRight size={18} /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default ResetPassword;
