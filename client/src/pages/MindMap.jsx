import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Brain, RefreshCw, Maximize2, BookOpen, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { notesService, aiService } from "../services/index";
import "../styles/mindmap.css";

// ── Node type config ─────────────────────────────────────────────────────────
const NODE_CONFIG = {
  main:       { color: "#6366f1", glow: "rgba(99,102,241,0.5)",  size: 52, labelSize: 14 },
  concept:    { color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", size: 40, labelSize: 12 },
  definition: { color: "#06b6d4", glow: "rgba(6,182,212,0.4)",  size: 36, labelSize: 11 },
  example:    { color: "#10b981", glow: "rgba(16,185,129,0.4)", size: 32, labelSize: 11 },
};

// ── Force-directed layout (simplified) ───────────────────────────────────────
function computeLayout(nodes, edges, W, H) {
  const pos = {};
  const n = nodes.length;
  if (n === 0) return pos;

  // Place main node at center
  const main = nodes.find(nd => nd.type === "main") || nodes[0];
  pos[main.id] = { x: W / 2, y: H / 2 };

  // Radial layout for the rest
  const rest = nodes.filter(nd => nd.id !== main.id);
  const angleStep = (2 * Math.PI) / Math.max(rest.length, 1);
  const radius = Math.min(W, H) * 0.32;

  rest.forEach((nd, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const r = radius + (i % 3) * 30;
    pos[nd.id] = {
      x: W / 2 + Math.cos(angle) * r,
      y: H / 2 + Math.sin(angle) * r,
    };
  });

  return pos;
}

// ── MindMap Canvas ────────────────────────────────────────────────────────────
function MindMapCanvas({ graph, onNodeClick, selectedNodeId }) {
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [positions, setPositions] = useState({});
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDims({ w: rect.width, h: rect.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (graph?.nodes?.length > 0) {
      setPositions(computeLayout(graph.nodes, graph.edges || [], dims.w, dims.h));
    }
  }, [graph, dims]);

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const pos = positions[nodeId] || { x: 0, y: 0 };
    setDragging(nodeId);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.max(40, Math.min(dims.w - 40, e.clientX - rect.left)),
        y: Math.max(40, Math.min(dims.h - 40, e.clientY - rect.top)),
      }
    }));
  }, [dragging, dims]);

  const handleMouseUp = () => setDragging(null);

  if (!graph?.nodes?.length) return null;

  return (
    <svg
      ref={svgRef}
      className="mindmap-svg"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background grid */}
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        {graph.nodes.map(node => {
          const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.concept;
          return (
            <radialGradient key={`grad-${node.id}`} id={`grad-${node.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={cfg.color} stopOpacity="1" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0.7" />
            </radialGradient>
          );
        })}
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Edges */}
      {(graph.edges || []).map((edge, i) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        return (
          <motion.path
            key={i}
            d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 20} ${to.x} ${to.y}`}
            fill="none"
            stroke="rgba(139,92,246,0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: i * 0.05 }}
          />
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((node, i) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.concept;
        const isSelected = selectedNodeId === node.id;
        const isMain = node.type === "main";

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x},${pos.y})`}
            onMouseDown={e => handleMouseDown(e, node.id)}
            onClick={() => onNodeClick(node)}
            style={{ cursor: "pointer" }}
          >
            {/* Glow ring on selected */}
            {isSelected && (
              <circle r={cfg.size + 6} fill="none" stroke={cfg.color} strokeWidth="2" opacity="0.6" />
            )}

            {/* Pulse ring for main */}
            {isMain && (
              <motion.circle
                r={cfg.size + 8}
                fill="none"
                stroke={cfg.color}
                strokeWidth="1"
                animate={{ r: [cfg.size + 6, cfg.size + 18], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
            )}

            <motion.circle
              r={cfg.size}
              fill={`url(#grad-${node.id})`}
              filter="url(#glow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: i * 0.06, type: "spring" }}
              whileHover={{ scale: 1.1 }}
            />

            {/* Label */}
            <motion.text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={cfg.labelSize}
              fontWeight={isMain ? "800" : "600"}
              fontFamily="inherit"
              style={{ pointerEvents: "none", userSelect: "none" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 + 0.3 }}
            >
              {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Node Detail Panel ─────────────────────────────────────────────────────────
function NodePanel({ node, noteContent, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node) return;
    setInfo(null);
    setLoading(true);
    aiService.chat(
      [{ role: "user", text: `In 2-3 sentences, explain "${node.label}" in the context of: ${noteContent?.substring(0, 500)}` }],
      {}
    ).then(res => setInfo(res.data.data.text))
      .catch(() => setInfo("Could not load explanation."))
      .finally(() => setLoading(false));
  }, [node?.id]);

  if (!node) return null;
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.concept;

  return (
    <motion.div
      className="mindmap-node-panel"
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <div className="mnp-header">
        <div className="mnp-badge" style={{ background: cfg.color }}>
          <Brain size={14} />
          <span>{node.type}</span>
        </div>
        <button className="mnp-close" onClick={onClose}><X size={15} /></button>
      </div>
      <h3 className="mnp-title" style={{ color: cfg.color }}>{node.label}</h3>
      <div className="mnp-body">
        {loading ? (
          <div className="mnp-loading"><Loader2 size={16} className="spin" /> Loading...</div>
        ) : (
          <p className="mnp-text">{info}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main MindMap Page ─────────────────────────────────────────────────────────
export default function MindMap() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (noteData) => {
    setLoading(true);
    setError(null);
    try {
      const text = [noteData.content, ...(noteData.pages || [])].filter(Boolean).join("\n");
      if (!text.trim()) {
        setError("This note is empty. Add some content first.");
        return;
      }
      const res = await aiService.generateMindMap(text);
      setGraph(res.data.data);
    } catch (err) {
      setError("Failed to generate mind map. Please try again.");
      toast.error("Mind map generation failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!noteId) return;
    notesService.getById(noteId)
      .then(res => {
        const n = res.data.note;
        setNote(n);
        generate(n);
      })
      .catch(() => {
        setError("Note not found.");
        setLoading(false);
      });
  }, [noteId]);

  return (
    <div className="mindmap-page">
      {/* Header */}
      <div className="mindmap-header">
        <button className="mm-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        <div className="mm-header-info">
          <h1>{note?.name || "Mind Map"}</h1>
          <span>{graph?.nodes?.length || 0} concepts · {graph?.edges?.length || 0} connections</span>
        </div>
        <div className="mm-header-actions">
          <button className="mm-action-btn" onClick={() => note && generate(note)} title="Regenerate">
            <RefreshCw size={14} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="mindmap-canvas-area">
        {/* Stars background */}
        <div className="mindmap-stars" aria-hidden>
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="mm-star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {loading ? (
          <div className="mindmap-loading">
            <Loader2 size={32} className="spin" />
            <p>Analyzing note with AI…</p>
            <span>Extracting concepts and relationships</span>
          </div>
        ) : error ? (
          <div className="mindmap-error">
            <Brain size={40} />
            <p>{error}</p>
            {note && <button className="mm-retry-btn" onClick={() => generate(note)}>Try Again</button>}
          </div>
        ) : (
          <MindMapCanvas
            graph={graph}
            onNodeClick={setSelectedNode}
            selectedNodeId={selectedNode?.id}
          />
        )}

        {/* Legend */}
        {graph && (
          <div className="mindmap-legend">
            {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="mm-legend-item">
                <div className="mm-legend-dot" style={{ background: cfg.color }} />
                <span>{type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Node Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodePanel
              node={selectedNode}
              noteContent={note ? [note.content, ...(note.pages || [])].join(" ") : ""}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
