import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Mode Definitions ──────────────────────────────────────────────────────────
const MODES = [
  {
    id: "focus",
    label: "Focus",
    icon: "🎯",
    bg: ["#0a0e1a", "#0d1628", "#0a1535"],
    accent: "#3b82f6",
    secondary: "#1e40af",
    glow: "rgba(59,130,246,0.15)",
    speed: 0.3,
    connectionOpacity: 0.25,
    particleScale: 0.8,
    description: "Calm, reading-oriented"
  },
  {
    id: "learning",
    label: "Learning",
    icon: "📚",
    bg: ["#0d0a1e", "#130d2a", "#0a0e22"],
    accent: "#8b5cf6",
    secondary: "#3b82f6",
    glow: "rgba(139,92,246,0.18)",
    speed: 0.6,
    connectionOpacity: 0.4,
    particleScale: 1.0,
    description: "Active knowledge connections"
  },
  {
    id: "ai",
    label: "AI Tutor",
    icon: "🤖",
    bg: ["#050e1a", "#091522", "#050f1c"],
    accent: "#06b6d4",
    secondary: "#8b5cf6",
    glow: "rgba(6,182,212,0.2)",
    speed: 0.8,
    connectionOpacity: 0.5,
    particleScale: 1.1,
    description: "Neural network effect"
  },
  {
    id: "revision",
    label: "Revision",
    icon: "🔁",
    bg: ["#0a0f0a", "#0d1a14", "#080f10"],
    accent: "#10b981",
    secondary: "#6ee7b7",
    glow: "rgba(16,185,129,0.18)",
    speed: 1.2,
    connectionOpacity: 0.45,
    particleScale: 1.05,
    description: "Flashcard visualization"
  },
  {
    id: "exam",
    label: "Exam",
    icon: "⚡",
    bg: ["#1a0a0a", "#1e0d0a", "#1a0808"],
    accent: "#f59e0b",
    secondary: "#ef4444",
    glow: "rgba(239,68,68,0.2)",
    speed: 2.0,
    connectionOpacity: 0.55,
    particleScale: 1.15,
    description: "High urgency, fast movement"
  },
  {
    id: "night",
    label: "Night",
    icon: "🌙",
    bg: ["#060608", "#08080d", "#060609"],
    accent: "#a78bfa",
    secondary: "#818cf8",
    glow: "rgba(167,139,250,0.1)",
    speed: 0.2,
    connectionOpacity: 0.2,
    particleScale: 0.85,
    description: "Soft neon, dark mode"
  }
];

// ── Node type definitions ─────────────────────────────────────────────────────
const NODE_TYPES = [
  { type: "notes", emoji: "📝", label: "Notes", color: "#60a5fa", size: 28 },
  { type: "pdf", emoji: "📄", label: "PDF", color: "#34d399", size: 30 },
  { type: "flashcard", emoji: "🃏", label: "Flashcard", color: "#f472b6", size: 26 },
  { type: "quiz", emoji: "❓", label: "Quiz", color: "#fb923c", size: 27 },
  { type: "ai", emoji: "🤖", label: "AI", color: "#22d3ee", size: 32 },
  { type: "plan", emoji: "📅", label: "Study Plan", color: "#a78bfa", size: 28 },
];

// ── Utility ───────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbStr(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KnowledgeNetworkHero() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    nodes: [],
    particles: [],
    mouse: { x: -9999, y: -9999, pressed: false },
    mode: 0,
    targetMode: 0,
    modeProgress: 1,
    animFrame: null,
    time: 0,
    ripples: [],
    reduced: false,
  });
  const [activeMode, setActiveMode] = useState(0);
  const [hoverMode, setHoverMode] = useState(null);
  const [showModes, setShowModes] = useState(false);

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    stateRef.current.reduced = mq.matches;
  }, []);

  // Init nodes
  const initNodes = useCallback((w, h) => {
    const s = stateRef.current;
    s.nodes = [];
    const count = Math.min(18, Math.floor((w * h) / 40000));
    const types = [...NODE_TYPES];

    // Ensure at least one of each type
    const guaranteed = types.map((t, i) => {
      const angle = (i / types.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.28;
      return {
        ...t,
        x: w / 2 + Math.cos(angle) * r * (0.7 + Math.random() * 0.3),
        y: h / 2 + Math.sin(angle) * r * (0.6 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        ox: 0, oy: 0,
        springX: 0, springY: 0,
        id: i,
        glowIntensity: Math.random(),
        glowDir: Math.random() > 0.5 ? 1 : -1,
        pulsePhase: Math.random() * Math.PI * 2,
        depth: 0.5 + Math.random() * 0.5,
      };
    });
    s.nodes = guaranteed;

    // Extra random nodes
    for (let i = types.length; i < count; i++) {
      const t = types[Math.floor(Math.random() * types.length)];
      s.nodes.push({
        ...t,
        x: 80 + Math.random() * (w - 160),
        y: 80 + Math.random() * (h - 160),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        ox: 0, oy: 0,
        springX: 0, springY: 0,
        id: i,
        glowIntensity: Math.random(),
        glowDir: Math.random() > 0.5 ? 1 : -1,
        pulsePhase: Math.random() * Math.PI * 2,
        depth: 0.5 + Math.random() * 0.5,
      });
    }

    // Micro particles
    s.particles = Array.from({ length: Math.min(60, Math.floor(count * 4)) }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: 1 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.5,
      depth: Math.random(),
      id: i,
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    let W, H;
    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      initNodes(W, H);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Draw functions ──
    const drawBackground = (mode, progress) => {
      const m0 = MODES[mode];
      const bg = m0.bg;
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      grad.addColorStop(0, bg[0]);
      grad.addColorStop(0.5, bg[1]);
      grad.addColorStop(1, bg[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    };

    const drawGlowBackground = (mode) => {
      const m = MODES[mode];
      const centerGrad = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W * 0.5);
      centerGrad.addColorStop(0, m.glow);
      centerGrad.addColorStop(1, "transparent");
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, W, H);
    };

    const drawRipple = (ripple, mode) => {
      const m = MODES[mode];
      const age = (s.time - ripple.birth) / 60;
      if (age > 1) return false;
      const r = age * 200;
      const alpha = (1 - age) * 0.25;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = rgbStr(m.accent, alpha);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return true;
    };

    const drawConnection = (n1, n2, mode, strength = 1) => {
      const m = MODES[mode];
      const d = dist(n1.x, n1.y, n2.x, n2.y);
      const maxDist = Math.min(W, H) * 0.45;
      if (d > maxDist) return;

      const fade = 1 - d / maxDist;
      const alpha = fade * m.connectionOpacity * strength;

      // Gradient line
      const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
      grad.addColorStop(0, rgbStr(n1.color || m.accent, alpha));
      grad.addColorStop(0.5, rgbStr(m.accent, alpha * 1.4));
      grad.addColorStop(1, rgbStr(n2.color || m.secondary, alpha));

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);

      // Slight curve
      const cx = (n1.x + n2.x) / 2 + (n1.y - n2.y) * 0.08;
      const cy = (n1.y + n2.y) / 2 + (n2.x - n1.x) * 0.08;
      ctx.quadraticCurveTo(cx, cy, n2.x, n2.y);

      ctx.strokeStyle = grad;
      ctx.lineWidth = fade * strength * 1.5;
      ctx.stroke();

      // Animated data dot flowing along connection
      if (strength > 0.5 && Math.random() < 0.005) {
        const t = (s.time * 0.01 * MODES[mode].speed) % 1;
        const px = lerp(lerp(n1.x, cx, t), lerp(cx, n2.x, t), t);
        const py = lerp(lerp(n1.y, cy, t), lerp(cy, n2.y, t), t);
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = rgbStr(m.accent, alpha * 3);
        ctx.fill();
      }
    };

    const drawNode = (node, mode, mouseX, mouseY) => {
      const m = MODES[mode];
      const dMouse = dist(node.x, node.y, mouseX, mouseY);
      const hovered = dMouse < 120;
      const glowPulse = 0.7 + 0.3 * Math.sin(s.time * 0.04 + node.pulsePhase);
      const scale = (m.particleScale * (hovered ? 1.3 : 1) * glowPulse * node.depth);

      const isAI = node.type === "ai";
      const isExam = mode === 4;
      const extraGlow = (isAI && mode === 2) ? 2.5 : 1;

      const baseSize = node.size * scale;

      // Outer glow
      const glowSize = baseSize * (isAI ? 3.5 : 2.5) * extraGlow;
      const glowGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
      glowGrad.addColorStop(0, rgbStr(node.color, 0.35 * extraGlow * (hovered ? 1.5 : 1)));
      glowGrad.addColorStop(0.4, rgbStr(m.accent, 0.1));
      glowGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Orbital ring for AI nodes in AI mode
      if (isAI && mode === 2) {
        const ringR = baseSize * 2.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = rgbStr(m.accent, 0.35);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbital dot
        const orbitAngle = s.time * 0.05;
        ctx.beginPath();
        ctx.arc(node.x + Math.cos(orbitAngle) * ringR, node.y + Math.sin(orbitAngle) * ringR, 3, 0, Math.PI * 2);
        ctx.fillStyle = rgbStr(m.accent, 0.8);
        ctx.fill();
      }

      // Exam mode: extra urgency rings
      if (isExam) {
        const pulse = 0.5 + 0.5 * Math.sin(s.time * 0.1 + node.pulsePhase * 3);
        ctx.beginPath();
        ctx.arc(node.x, node.y, baseSize * (1.8 + pulse * 0.8), 0, Math.PI * 2);
        ctx.strokeStyle = rgbStr(m.secondary, 0.2 * pulse);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Node circle
      const nodeGrad = ctx.createRadialGradient(
        node.x - baseSize * 0.2, node.y - baseSize * 0.2, 0,
        node.x, node.y, baseSize
      );
      nodeGrad.addColorStop(0, rgbStr(node.color, 0.95));
      nodeGrad.addColorStop(0.7, rgbStr(node.color, 0.75));
      nodeGrad.addColorStop(1, rgbStr(m.accent, 0.6));

      ctx.beginPath();
      ctx.arc(node.x, node.y, baseSize, 0, Math.PI * 2);
      ctx.fillStyle = nodeGrad;
      ctx.fill();

      // Border glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseSize, 0, Math.PI * 2);
      ctx.strokeStyle = rgbStr(node.color, hovered ? 0.9 : 0.4);
      ctx.lineWidth = hovered ? 2 : 1;
      ctx.stroke();

      // Emoji icon
      ctx.font = `${baseSize * 1.1}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.emoji, node.x, node.y);

      // Label on hover
      if (hovered) {
        const labelY = node.y + baseSize + 16;
        ctx.font = "bold 12px -apple-system, 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = rgbStr(node.color, 0.9);
        ctx.fillText(node.label, node.x, labelY);
      }
    };

    const drawParticle = (p, mode) => {
      const m = MODES[mode];
      const alpha = p.alpha * m.connectionOpacity * 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * m.particleScale * (0.5 + p.depth * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = rgbStr(m.accent, alpha);
      ctx.fill();
    };

    const drawModeTransition = () => {
      // Neural network pulse in AI mode
      if (s.mode === 2) {
        const pulseR = 100 + 80 * Math.sin(s.time * 0.03);
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, pulseR);
        grad.addColorStop(0, "rgba(6,182,212,0.08)");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    };

    // ── Physics update ──
    const updateNode = (node, W, H, mode) => {
      const m = MODES[mode];
      const spd = m.speed;
      const mx = s.mouse.x, my = s.mouse.y;

      // Spring toward mouse attraction
      const dMouse = dist(node.x, node.y, mx, my);
      if (dMouse < 200 && dMouse > 0) {
        const force = (1 - dMouse / 200) * 0.8;
        node.springX += (mx - node.x) / dMouse * force * 0.06;
        node.springY += (my - node.y) / dMouse * force * 0.06;
      }

      // Repulsion from other nodes
      for (const other of s.nodes) {
        if (other.id === node.id) continue;
        const d = dist(node.x, node.y, other.x, other.y);
        const minDist = 80;
        if (d < minDist && d > 0) {
          const force = (minDist - d) / minDist * 0.15;
          node.springX -= (other.x - node.x) / d * force;
          node.springY -= (other.y - node.y) / d * force;
        }
      }

      // Damped spring
      node.springX *= 0.88;
      node.springY *= 0.88;

      // Gentle drift
      node.vx += (Math.random() - 0.5) * 0.02 * spd;
      node.vy += (Math.random() - 0.5) * 0.02 * spd;
      node.vx *= 0.97;
      node.vy *= 0.97;

      // Orbit center attraction
      const cx = W / 2, cy = H / 2;
      const toCenterX = (cx - node.x) * 0.0005;
      const toCenterY = (cy - node.y) * 0.0005;

      node.x += (node.vx + node.springX + toCenterX) * spd;
      node.y += (node.vy + node.springY + toCenterY) * spd;

      // Bounds
      const pad = 60;
      if (node.x < pad) node.vx += 0.1;
      if (node.x > W - pad) node.vx -= 0.1;
      if (node.y < pad) node.vy += 0.1;
      if (node.y > H - pad) node.vy -= 0.1;

      // Pulse glow
      node.glowIntensity += node.glowDir * 0.008 * spd;
      if (node.glowIntensity > 1) { node.glowIntensity = 1; node.glowDir = -1; }
      if (node.glowIntensity < 0.3) { node.glowIntensity = 0.3; node.glowDir = 1; }
    };

    const updateParticle = (p, W, H, mode) => {
      const m = MODES[mode];
      p.x += p.vx * m.speed;
      p.y += p.vy * m.speed;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      // Mouse repulsion
      const dx = p.x - s.mouse.x;
      const dy = p.y - s.mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 80) {
        p.vx += dx / d * 0.15;
        p.vy += dy / d * 0.15;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
    };

    // ── Main loop ──
    const draw = () => {
      if (!canvas.isConnected) return;
      s.time++;
      const mode = s.mode;
      const mx = s.mouse.x, my = s.mouse.y;

      ctx.clearRect(0, 0, W, H);

      if (!s.reduced) {
        drawBackground(mode, 1);
        drawGlowBackground(mode);
      } else {
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, W, H);
      }

      // Connections
      for (let i = 0; i < s.nodes.length; i++) {
        for (let j = i + 1; j < s.nodes.length; j++) {
          const n1 = s.nodes[i], n2 = s.nodes[j];
          const dMouse1 = dist(n1.x, n1.y, mx, my);
          const dMouse2 = dist(n2.x, n2.y, mx, my);
          const nearMouse = Math.min(dMouse1, dMouse2) < 160;
          drawConnection(n1, n2, mode, nearMouse ? 1.8 : 1);
        }
      }

      // Particles
      if (!s.reduced) {
        for (const p of s.particles) {
          updateParticle(p, W, H, mode);
          drawParticle(p, mode);
        }
      }

      // Mode transition effects
      drawModeTransition();

      // Ripples
      s.ripples = s.ripples.filter(r => {
        const alive = (s.time - r.birth) / 60 < 1;
        if (alive) drawRipple(r, mode);
        return alive;
      });

      // Nodes
      for (const node of s.nodes) {
        if (!s.reduced) updateNode(node, W, H, mode);
        drawNode(node, mode, mx, my);
      }

      // Cursor halo
      if (mx > 0 && mx < W && !s.reduced) {
        const m = MODES[mode];
        const haloGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 60);
        haloGrad.addColorStop(0, rgbStr(m.accent, 0.12));
        haloGrad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(mx, my, 60, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();
      }

      s.animFrame = requestAnimationFrame(draw);
    };

    s.animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(s.animFrame);
      ro.disconnect();
    };
  }, [initNodes]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      s.mouse.x = clientX - rect.left;
      s.mouse.y = clientY - rect.top;
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      s.ripples.push({ x, y, birth: s.time });
      if (s.ripples.length > 6) s.ripples.shift();
    };

    const onLeave = () => { s.mouse.x = -9999; s.mouse.y = -9999; };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Mode switching
  const switchMode = useCallback((idx) => {
    stateRef.current.mode = idx;
    setActiveMode(idx);
    setShowModes(false);
  }, []);

  const mode = MODES[activeMode];
  const displayMode = hoverMode !== null ? MODES[hoverMode] : mode;

  return (
    <div className="knh-wrapper">
      {/* Canvas */}
      <canvas ref={canvasRef} className="knh-canvas" />

      {/* Hero Content Overlay */}
      <div className="knh-overlay">
        <motion.div
          className="knh-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="knh-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="knh-badge-live" />
            <span>✦</span>
            Live knowledge network — {mode.description}
          </motion.div>

          <h1 className="knh-title">
            Learn smarter with<br />
            <span className="knh-gradient" style={{ "--accent": mode.accent, "--secondary": mode.secondary }}>
              AI-powered knowledge
            </span>
          </h1>

          <p className="knh-subtitle">
            Watch your knowledge come alive. Every note, PDF, and flashcard becomes a
            node in your personal learning universe.
          </p>

          <div className="knh-hint">
            <span>🖱</span>
            <span>Move cursor to attract nodes · Click to send ripples</span>
          </div>
        </motion.div>

        {/* Node Legend */}
        <motion.div
          className="knh-legend"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {NODE_TYPES.map((t) => (
            <div key={t.type} className="knh-legend-item">
              <span className="knh-legend-dot" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
              <span className="knh-legend-emoji">{t.emoji}</span>
              <span className="knh-legend-label">{t.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Mode Switcher */}
      <div className="knh-mode-switcher">
        <motion.button
          className="knh-mode-toggle"
          onClick={() => setShowModes(v => !v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ "--accent": mode.accent }}
        >
          <span className="knh-mode-icon">{mode.icon}</span>
          <span className="knh-mode-label">{mode.label}</span>
          <motion.span
            animate={{ rotate: showModes ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 10, opacity: 0.6 }}
          >▼</motion.span>
        </motion.button>

        <AnimatePresence>
          {showModes && (
            <motion.div
              className="knh-mode-panel"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <p className="knh-mode-panel-title">Study Mode</p>
              {MODES.map((m, i) => (
                <motion.button
                  key={m.id}
                  className={`knh-mode-option ${activeMode === i ? "active" : ""}`}
                  onClick={() => switchMode(i)}
                  onMouseEnter={() => setHoverMode(i)}
                  onMouseLeave={() => setHoverMode(null)}
                  whileHover={{ x: 4 }}
                  style={{ "--accent": m.accent }}
                >
                  <span className="knh-opt-icon">{m.icon}</span>
                  <div className="knh-opt-info">
                    <span className="knh-opt-name">{m.label}</span>
                    <span className="knh-opt-desc">{m.description}</span>
                  </div>
                  {activeMode === i && <span className="knh-opt-check">✓</span>}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode indicator bar */}
      <div className="knh-mode-bar">
        {MODES.map((m, i) => (
          <motion.button
            key={m.id}
            className={`knh-dot-btn ${activeMode === i ? "active" : ""}`}
            onClick={() => switchMode(i)}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            style={{ "--accent": m.accent }}
            title={m.label}
          />
        ))}
      </div>
    </div>
  );
}
