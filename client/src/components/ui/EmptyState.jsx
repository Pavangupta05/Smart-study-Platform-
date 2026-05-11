import { motion } from "framer-motion";

/**
 * EmptyState — Reusable calm empty state component.
 * Inspired by Linear/Notion's intentional, non-intrusive empty screens.
 *
 * @param {React.ReactNode} icon       - Lucide icon element
 * @param {string}          title      - Short, human headline
 * @param {string}          description - Calm, helpful description
 * @param {string}          [ctaLabel]  - Button label (optional)
 * @param {Function}        [onCta]     - Button action (optional)
 * @param {React.ReactNode} [secondary] - Secondary action (optional)
 */
function EmptyState({ icon, title, description, ctaLabel, onCta, secondary }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {ctaLabel && onCta && (
        <div className="empty-state-actions">
          <button className="empty-state-cta" onClick={onCta}>
            {ctaLabel}
          </button>
          {secondary}
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;
