import { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { notesService } from "../services/index";
import "../styles/trash.css";

function Trash() {
  const [trashItems, setTrashItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  useEffect(() => {
    notesService.getTrash()
      .then(res => setTrashItems(res.data.notes || []))
      .catch(err => {
        console.error(err);
        toast.error("Failed to load trashed items.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const restoreFile = async (id) => {
    try {
      await notesService.restore(id);
      setTrashItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to restore file.");
    }
  };

  const deletePermanently = async (id) => {
    try {
      await notesService.deletePermanent(id);
      setTrashItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete item permanently.");
    }
  };

  const emptyTrash = () => {
    setShowConfirmModal(true);
  };

  const handleEmptyTrashConfirm = async () => {
    setIsEmptying(true);
    try {
      // Delete all items in parallel for speed
      await Promise.all(trashItems.map(item => notesService.deletePermanent(item._id)));
      setTrashItems([]);
      setShowConfirmModal(false);
      toast.success("Trash emptied successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to empty trash.");
    } finally {
      setIsEmptying(false);
    }
  };

  return (
    <div className="trash-page fade-in">
      {/* CONFIRM EMPTY TRASH MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            className="gen-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="gen-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ maxWidth: "400px" }}
            >
              <div className="gen-modal-header">
                <div className="gen-modal-title" style={{ color: "var(--danger)" }}>
                  <AlertCircle size={18} />
                  <h3>Empty Trash?</h3>
                </div>
                <button className="gen-close" onClick={() => setShowConfirmModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="gen-modal-body">
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
                  This will permanently delete all {trashItems.length} items in the trash. This action cannot be undone.
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button 
                  className="empty-state-cta"
                  style={{ 
                    flex: 1, 
                    background: "var(--surface-hover)", 
                    color: "var(--text-secondary)", 
                    border: "1px solid var(--border)",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{ 
                    flex: 1, 
                    background: "#ef4444", 
                    color: "#fff", 
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  onClick={handleEmptyTrashConfirm}
                  disabled={isEmptying}
                >
                  {isEmptying ? "Emptying..." : "Empty Trash"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="trash-header">
        <div className="header-info">
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted items stay here for 30 days.</p>
        </div>
        {trashItems.length > 0 && (
          <button className="btn-empty-all" onClick={emptyTrash}>
            <Trash2 size={16} />
            <span>Empty Trash</span>
          </button>
        )}
      </div>

      <div className="trash-warning-banner">
        <AlertCircle size={18} />
        <span>Items deleted permanently cannot be recovered.</span>
      </div>

      {isLoading ? (
        <div className="trash-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="trash-item skeleton" style={{ padding: "16px", minHeight: "80px", borderRadius: "16px" }}>
              <div className="item-left">
                <div className="skeleton-icon" style={{ width: 48, height: 48, borderRadius: "50%", marginBottom: 0 }}></div>
                <div style={{ marginLeft: "16px", flex: 1 }}>
                  <div className="skeleton-text short" style={{ height: "14px" }}></div>
                  <div className="skeleton-text long" style={{ height: "10px", marginTop: "8px" }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : trashItems.length > 0 ? (
        <div className="trash-list">
          {trashItems.map((item) => (
            <div key={item._id} className="trash-item">
              <div className="item-left">
                <div className="item-icon-circle">{item.icon || "📄"}</div>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Original folder: {item.cat || "general"} • {item.size}</p>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-restore" onClick={() => restoreFile(item._id)} title="Restore">
                  <RotateCcw size={18} />
                  <span>Restore</span>
                </button>
                <button className="btn-delete-perm" onClick={() => deletePermanently(item._id)} title="Delete Permanently">
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trash-empty">
          <div className="empty-illustration">
            <Trash2 size={64} />
          </div>
          <h3>Your trash is clear</h3>
          <p>When you delete notes, they'll appear here for 30 days.</p>
        </div>
      )}
    </div>
  );
}

export default Trash;
