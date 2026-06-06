import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  secondary?: React.ReactNode;
}

/**
 * EmptyState — Premium Vercel-style empty state component.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, ctaLabel, onCta, secondary }) => {
  return (
    <div
      className="empty-state fade-in-up"
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
        <div 
          className="empty-state-icon fade-in-up delay-1"
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
        </div>
      )}
      
      <h3 
        className="empty-state-title fade-in-up delay-2"
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--text-main)",
          marginBottom: "12px",
          letterSpacing: "-0.01em"
        }}
      >
        {title}
      </h3>
      
      <p 
        className="empty-state-desc fade-in-up delay-3"
        style={{
          fontSize: "15px",
          color: "var(--text-muted)",
          maxWidth: "400px",
          lineHeight: 1.6,
          marginBottom: "32px"
        }}
      >
        {description}
      </p>
      
      {ctaLabel && onCta && (
        <button 
          className="btn-primary fade-in-up delay-4" 
          onClick={onCta}
          style={{
            padding: "12px 28px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 600
          }}
        >
          {ctaLabel}
        </button>
      )}

      {secondary && (
        <div className="empty-state-secondary fade-in-up delay-4" style={{ marginTop: '24px' }}>
          {secondary}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
