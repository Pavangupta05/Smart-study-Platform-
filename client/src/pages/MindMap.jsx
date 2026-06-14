import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ArrowLeft, Loader2, Brain, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { notesService, aiService } from "../services/index";
import "../styles/mindmap.css";

// ── Node type config ─────────────────────────────────────────────────────────
const NODE_CONFIG = {
  main:       { color: "#3b82f6", glow: "rgba(59,130,246,0.6)",  size: 56, labelSize: 15 },
  concept:    { color: "#8b5cf6", glow: "rgba(139,92,246,0.5)",  size: 44, labelSize: 13 },
  definition: { color: "#ec4899", glow: "rgba(236,72,153,0.5)",  size: 38, labelSize: 12 },
  example:    { color: "#10b981", glow: "rgba(16,185,129,0.5)",  size: 34, labelSize: 12 },
};

// ── Physics Engine Hook ──────────────────────────────────────────────────────
function usePhysicsLayout(nodes, edges, W, H, draggedNode, mousePos) {
  const [positions, setPositions] = useState({});
  const physicsRef = useRef({ pos: {}, vel: {} });

  // Initialize positions randomly near center
  useEffect(() => {
    const { pos, vel } = physicsRef.current;
    let changed = false;
    nodes.forEach((n) => {
      if (!pos[n.id]) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (Math.min(W, H) * 0.2 || 100);
        pos[n.id] = { x: (W || 800) / 2 + Math.cos(angle) * radius, y: (H || 600) / 2 + Math.sin(angle) * radius };
        vel[n.id] = { x: 0, y: 0 };
        changed = true;
      }
    });
    if (changed) setPositions({ ...pos });
  }, [nodes, W, H]);

  useEffect(() => {
    let raf;
    const { pos, vel } = physicsRef.current;
    
    const tick = () => {
      if (!W || !H || nodes.length === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i].id;
          const n2 = nodes[j].id;
          if (!pos[n1] || !pos[n2]) continue;

          const dx = pos[n1].x - pos[n2].x;
          const dy = pos[n1].y - pos[n2].y;
          let d = Math.sqrt(dx * dx + dy * dy);
          if (d === 0) d = 0.1;
          
          if (d < 350) {
            const force = 4000 / (d * d); // Coulomb-like repulsion
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            vel[n1].x += fx; vel[n1].y += fy;
            vel[n2].x -= fx; vel[n2].y -= fy;
          }
        }
      }
      
      // Attraction (Edges)
      edges.forEach(edge => {
        const n1 = edge.from;
        const n2 = edge.to;
        if (!pos[n1] || !pos[n2]) return;

        const dx = pos[n2].x - pos[n1].x;
        const dy = pos[n2].y - pos[n1].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
        
        const target = 160; 
        const force = (d - target) * 0.04; // Hooke's law
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        
        vel[n1].x += fx; vel[n1].y += fy;
        vel[n2].x -= fx; vel[n2].y -= fy;
      });
      
      // Center Gravity
      nodes.forEach(n => {
        if (!pos[n.id]) return;
        const dx = W / 2 - pos[n.id].x;
        const dy = H / 2 - pos[n.id].y;
        vel[n.id].x += dx * 0.015;
        vel[n.id].y += dy * 0.015;
      });
      
      // Integration
      let moving = false;
      nodes.forEach(n => {
        if (!pos[n.id]) return;
        if (draggedNode === n.id && mousePos) {
          pos[n.id].x = mousePos.x;
          pos[n.id].y = mousePos.y;
          vel[n.id].x = 0;
          vel[n.id].y = 0;
          moving = true;
        } else {
          vel[n.id].x *= 0.82; // Damping
          vel[n.id].y *= 0.82;
          pos[n.id].x += vel[n.id].x;
          pos[n.id].y += vel[n.id].y;
          
          if (Math.abs(vel[n.id].x) > 0.1 || Math.abs(vel[n.id].y) > 0.1) {
            moving = true;
          }
        }
      });
      
      if (moving) {
        setPositions({ ...pos });
      }
      
      raf = requestAnimationFrame(tick);
    };
    
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges, W, H, draggedNode, mousePos]);

  return positions;
}

// ── MindMap Canvas ────────────────────────────────────────────────────────────
function MindMapCanvas({ graph, onNodeClick, selectedNodeId }) {
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  // Parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { damping: 30, stiffness: 100, mass: 0.5 };
  const px = useSpring(useTransform(mouseX, [0, dims.w || 1000], [20, -20]), springCfg);
  const py = useSpring(useTransform(mouseY, [0, dims.h || 1000], [20, -20]), springCfg);

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

  const positions = usePhysicsLayout(graph.nodes, graph.edges || [], dims.w, dims.h, draggedNode, mousePos);

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setDraggedNode(nodeId);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
    if (draggedNode) setMousePos({ x, y });
  }, [draggedNode, mouseX, mouseY]);

  const handleMouseUp = () => setDraggedNode(null);

  if (!graph?.nodes?.length) return null;

  return (
    <svg
      ref={svgRef}
      className="mindmap-svg"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        </pattern>
        {graph.nodes.map(node => {
          const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.concept;
          return (
            <radialGradient key={`grad-${node.id}`} id={`grad-${node.id}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor={cfg.color} stopOpacity="1" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0.6" />
            </radialGradient>
          );
        })}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect width="100%" height="100%" fill="url(#grid)" />

      <motion.g style={{ x: px, y: py }}>
        {/* Edges */}
      {(graph.edges || []).map((edge, i) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        
        // Quadratic bezier curve slightly offset for elegance
        const cpx = (from.x + to.x) / 2 + (from.y - to.y) * 0.1;
        const cpy = (from.y + to.y) / 2 + (to.x - from.x) * 0.1;

        return (
          <motion.path
            key={i}
            d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeDasharray="6 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1,
              strokeDashoffset: [0, -24]
            }}
            transition={{ 
              pathLength: { duration: 1, delay: i * 0.02 },
              opacity: { duration: 1, delay: i * 0.02 },
              strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" }
            }}
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
          <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
            <motion.g
              onMouseDown={e => handleMouseDown(e, node.id)}
              onClick={() => onNodeClick(node)}
              style={{ cursor: draggedNode === node.id ? "grabbing" : "grab" }}
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {/* Selection Glow */}
              {isSelected && (
                <circle r={cfg.size + 10} fill={cfg.glow} filter="url(#glow)" opacity="0.8" />
              )}

              {/* Pulse ring for main */}
              {isMain && (
                <motion.circle
                  r={cfg.size + 12}
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth="2"
                  animate={{ r: [cfg.size + 8, cfg.size + 24], opacity: [0.6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}

              {/* Main Circle */}
              <motion.circle
                r={cfg.size}
                fill={`url(#grad-${node.id})`}
                filter="url(#glow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.03, type: "spring", bounce: 0.4 }}
              />

              {/* Label */}
              <motion.text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={cfg.labelSize}
                fontWeight={isMain ? "800" : "700"}
                fontFamily="-apple-system, 'Inter', sans-serif"
                style={{ pointerEvents: "none", userSelect: "none", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 + 0.3 }}
              >
                {node.label.length > 15 ? node.label.slice(0, 14) + "…" : node.label}
              </motion.text>
            </motion.g>
          </g>
        );
      })}
      </motion.g>
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
  }, [node?.id, noteContent]);

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
          <span style={{ textTransform: "capitalize" }}>{node.type}</span>
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
        {loading ? (
          <div className="mindmap-loading">
            <Loader2 size={32} className="spin" />
            <p>Analyzing note with AI…</p>
            <span>Extracting concepts and constructing neural network</span>
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
                <div className="mm-legend-dot" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                <span style={{ textTransform: "capitalize" }}>{type}</span>
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
