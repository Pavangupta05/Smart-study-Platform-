import { motion } from "framer-motion";

/**
 * EmptyState — Premium Vercel-style empty state component.
 */
function EmptyState({ icon, title, description, ctaLabel, onCta, secondary }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
        borderRadius: "24px",
        background: "rgba(var(--surface-rgb), 0.3)",
        border: "1px dashed var(--border)",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.02)"
      }}
    >
      {icon && (
        <motion.div 
          className="empty-state-icon"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.1), transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
            marginBottom: "24px",
            boxShadow: "0 0 0 1px rgba(var(--primary-rgb), 0.05)"
          }}
        >
          {icon}
        </motion.div>
      )}
      
      <motion.h3 
        className="empty-state-title"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}
      >
        {title}
      </motion.h3>
      
      {description && (
        <motion.p 
          className="empty-state-desc"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "400px", marginBottom: "32px", lineHeight: 1.5 }}
        >
          {description}
        </motion.p>
      )}
      
      {ctaLabel && onCta && (
        <motion.div 
          className="empty-state-actions"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: "flex", gap: "12px", alignItems: "center" }}
        >
          <button 
            className="empty-state-cta magnetic-btn hover-glow" 
            onClick={onCta}
            style={{
              padding: "12px 24px",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {ctaLabel}
          </button>
          {secondary}
        </motion.div>
      )}
    </motion.div>
  );
}

export default EmptyState;
