import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────
   MODE PALETTE  (Stripe-style: time / study mode)
   ───────────────────────────────────────────────────────── */
const MODES = [
  {
    id: "focus",    label: "Focus",    icon: "🎯",
    bg0: "#f2f0ff", bg1: "#e6e0ff",
    line: [105, 85, 210],   // rgb for rays
    dot:  [85,  62, 195],
    desc: "Calm · Reading",
  },
  {
    id: "learning", label: "Learning", icon: "📚",
    bg0: "#eef2ff", bg1: "#dce6ff",
    line: [80, 100, 230],
    dot:  [55,  78, 218],
    desc: "Active · Knowledge",
  },
  {
    id: "ai",       label: "AI Tutor", icon: "🤖",
    bg0: "#eafbff", bg1: "#cdf3ff",
    line: [0,  168, 220],
    dot:  [0,  140, 200],
    desc: "Neural · Connected",
  },
  {
    id: "revision", label: "Revision", icon: "🔁",
    bg0: "#ecfff5", bg1: "#ccf5e4",
    line: [18, 170, 125],
    dot:  [12, 145, 100],
    desc: "Sharp · Recall",
  },
  {
    id: "exam",     label: "Exam",     icon: "⚡",
    bg0: "#fff8ee", bg1: "#ffe8cc",
    line: [220, 110, 30],
    dot:  [200,  80, 15],
    desc: "Urgent · Energy",
  },
  {
    id: "night",    label: "Night",    icon: "🌙",
    bg0: "#0e0d1c", bg1: "#07060f",
    line: [125, 95, 230],
    dot:  [100, 68, 215],
    desc: "Dark · Neon",
  },
];

const TAU  = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─────────────────────────────────────────────────────────
   Build ray descriptors — called once per resize
   ───────────────────────────────────────────────────────── */
function buildRays(W, H) {
  // Ray count: dense in the middle, sparser at edges
  const N = clamp(Math.round(W / 13), 48, 88);

  const rays = [];
  for (let i = 0; i < N; i++) {
    // Distribute evenly across upper semicircle (-π → 0)
    const t     = i / (N - 1);
    const angle = -Math.PI + t * Math.PI;

    // Tiny random spread keeps it natural without messy jitter
    const spread = (Math.random() - 0.5) * 0.09;

    // Longer rays near the vertical (centre of fan)
    const centreWeight = Math.sin(t * Math.PI);  // peaks at t=0.5
    const baseLen = H * 0.38 + centreWeight * H * 0.32;
    const len     = baseLen + (Math.random() - 0.5) * H * 0.06;

    // Depth: used for opacity layering (0 = faint, 1 = bold)
    const depth = 0.25 + Math.random() * 0.75;

    // Very subtle wobble — Stripe-level subtlety
    const wobbleAmp  = 0.004 + Math.random() * 0.010;
    const wobbleFreq = 0.20  + Math.random() * 0.45;
    const wobbleOff  = Math.random() * TAU;

    // Branch fork
    const hasBranch = Math.random() > 0.50;
    const branchT   = 0.48 + Math.random() * 0.38;
    const branchDa  = (Math.random() > 0.5 ? 1 : -1) * (0.10 + Math.random() * 0.24);
    const branchLen = len  * (0.14 + Math.random() * 0.22);

    // Dot at tip
    const hasDot  = Math.random() > 0.18;
    const dotR    = 1.4 + Math.random() * 2.2;
    const dotPulse= Math.random() * TAU; // phase for subtle size pulse

    rays.push({
      base: angle + spread, len, depth,
      wobbleAmp, wobbleFreq, wobbleOff,
      thick: 0.22 + Math.random() * 0.55,
      hasBranch, branchT, branchDa, branchLen,
      hasDot, dotR, dotPulse,
    });
  }

  // Sort by depth so faint rays are drawn first (proper layering)
  rays.sort((a, b) => a.depth - b.depth);
  return rays;
}

/* ─────────────────────────────────────────────────────────
   Hex colour → [r,g,b]
   ───────────────────────────────────────────────────────── */
function hexRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

/* ─────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────── */
export default function BeamsBurst() {
  const canvasRef = useRef(null);
  const sRef      = useRef({
    rays: [], t: 0,
    modeA: 0, modeB: 0, blend: 1,   // blend 0→1 on mode change
    mouse: { x: -9999, y: -9999 },
    raf: null, visible: true,
    W: 0, H: 0,
    // cached CanvasGradient rebuilt on resize / mode change
    bgCache: { key: "", grad: null },
  });

  const [mode, setMode]   = useState(0);
  const [open, setOpen]   = useState(false);

  /* ── animation loop ─────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d", { alpha: false });
    const s     = sRef.current;
    let prevT   = performance.now();

    /* resize */
    const resize = () => {
      s.W = canvas.offsetWidth;
      s.H = canvas.offsetHeight;
      const dpr      = Math.min(devicePixelRatio, 2);
      canvas.width   = Math.round(s.W * dpr);
      canvas.height  = Math.round(s.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.rays         = buildRays(s.W, s.H);
      s.bgCache.key  = "";   // invalidate cached gradient
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);

    /* pause when scrolled out of view */
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; });
    io.observe(canvas);

    /* draw */
    const draw = (now) => {
      s.raf = requestAnimationFrame(draw);
      if (!s.visible) { prevT = now; return; }

      const dt = Math.min((now - prevT) * 0.001, 0.04);
      prevT    = now;
      s.t     += dt;

      if (s.blend < 1) s.blend = Math.min(1, s.blend + dt * 2.2);

      const { W, H, rays, mouse } = s;
      const bl  = s.blend;
      const mA  = MODES[s.modeA];
      const mB  = MODES[s.modeB];

      /* ── background ──────────────────────────────────── */
      const bgKey = `${s.modeA},${s.modeB},${bl.toFixed(2)}`;
      if (s.bgCache.key !== bgKey) {
        const c0A = hexRgb(mA.bg0), c0B = hexRgb(mB.bg0);
        const c1A = hexRgb(mA.bg1), c1B = hexRgb(mB.bg1);
        const t0  = [lerp(c0A[0],c0B[0],bl), lerp(c0A[1],c0B[1],bl), lerp(c0A[2],c0B[2],bl)].map(Math.round);
        const t1  = [lerp(c1A[0],c1B[0],bl), lerp(c1A[1],c1B[1],bl), lerp(c1A[2],c1B[2],bl)].map(Math.round);
        const g   = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgb(${t0})`);
        g.addColorStop(1, `rgb(${t1})`);
        s.bgCache = { key: bgKey, grad: g };
      }
      ctx.fillStyle = s.bgCache.grad;
      ctx.fillRect(0, 0, W, H);

      /* blended ray & dot colour */
      const lr = [
        lerp(mA.line[0], mB.line[0], bl),
        lerp(mA.line[1], mB.line[1], bl),
        lerp(mA.line[2], mB.line[2], bl),
      ].map(Math.round);
      const dr = [
        lerp(mA.dot[0], mB.dot[0], bl),
        lerp(mA.dot[1], mB.dot[1], bl),
        lerp(mA.dot[2], mB.dot[2], bl),
      ].map(Math.round);

      const ox = W / 2, oy = H;   // origin: exact bottom-centre

      /* mouse pull — very gentle deflection toward cursor */
      const mdx   = mouse.x - ox;
      const mdy   = mouse.y - oy;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
      const mi    = clamp(1 - mdist / 380, 0, 1);
      const mPull = mi * (mdx / mdist) * 0.038;

      /* ─────────────────────────────────────────────────
         BATCH DRAW — 5 depth bands → 5 strokeStyle sets
         instead of N individual calls.  This is the key
         performance fix.
         ───────────────────────────────────────────────── */
      const BANDS = 5;

      // Pre-compute live angles (reused for dots)
      const liveAngles = new Float32Array(rays.length);
      for (let i = 0; i < rays.length; i++) {
        const r = rays[i];
        liveAngles[i] = r.base
          + Math.sin(s.t * r.wobbleFreq + r.wobbleOff) * r.wobbleAmp
          + mPull;
      }

      ctx.lineCap = "round";

      for (let band = 0; band < BANDS; band++) {
        const lo = band       / BANDS;
        const hi = (band + 1) / BANDS;

        // Main ray lines for this depth band
        const alpha = lerp(0.08, 0.52, (band + 0.5) / BANDS);
        const thick = lerp(0.20, 0.65, (band + 0.5) / BANDS);

        ctx.beginPath();
        for (let i = 0; i < rays.length; i++) {
          const r = rays[i];
          if (r.depth < lo || r.depth >= hi) continue;
          const a  = liveAngles[i];
          const ex = ox + Math.cos(a) * r.len;
          const ey = oy + Math.sin(a) * r.len;
          ctx.moveTo(ox, oy);
          ctx.lineTo(ex, ey);
        }
        ctx.strokeStyle = `rgba(${lr},${alpha.toFixed(3)})`;
        ctx.lineWidth   = thick;
        ctx.stroke();

        // Branch lines for this depth band
        ctx.beginPath();
        for (let i = 0; i < rays.length; i++) {
          const r = rays[i];
          if (!r.hasBranch || r.depth < lo || r.depth >= hi) continue;
          const a   = liveAngles[i];
          const bx  = ox + Math.cos(a) * r.len * r.branchT;
          const by  = oy + Math.sin(a) * r.len * r.branchT;
          const ba  = a  + r.branchDa;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(ba) * r.branchLen, by + Math.sin(ba) * r.branchLen);
        }
        ctx.strokeStyle = `rgba(${lr},${(alpha * 0.60).toFixed(3)})`;
        ctx.lineWidth   = thick * 0.52;
        ctx.stroke();
      }

      /* ─────────────────────────────────────────────────
         DOTS — two batched passes: glow halos + cores
         ───────────────────────────────────────────────── */
      // Glow halos (slightly larger, low alpha)
      ctx.beginPath();
      for (let i = 0; i < rays.length; i++) {
        const r = rays[i];
        if (!r.hasDot) continue;
        const a   = liveAngles[i];
        const ex  = ox + Math.cos(a) * r.len;
        const ey  = oy + Math.sin(a) * r.len;
        const rad = r.dotR * (2.8 + mi * 1.2);
        ctx.moveTo(ex + rad, ey);
        ctx.arc(ex, ey, rad, 0, TAU);
      }
      ctx.fillStyle = `rgba(${dr},0.12)`;
      ctx.fill();

      // Dot cores
      ctx.beginPath();
      for (let i = 0; i < rays.length; i++) {
        const r    = rays[i];
        if (!r.hasDot) continue;
        const a    = liveAngles[i];
        const ex   = ox + Math.cos(a) * r.len;
        const ey   = oy + Math.sin(a) * r.len;
        const pulse = 0.88 + 0.12 * Math.sin(s.t * 1.2 + r.dotPulse);
        const rad   = r.dotR * pulse * (1 + mi * 0.35) * clamp(r.depth + 0.2, 0, 1);
        ctx.moveTo(ex + rad, ey);
        ctx.arc(ex, ey, rad, 0, TAU);
      }
      ctx.fillStyle = `rgba(${dr},0.82)`;
      ctx.fill();

      // Branch-end dots
      ctx.beginPath();
      for (let i = 0; i < rays.length; i++) {
        const r = rays[i];
        if (!r.hasBranch || !r.hasDot) continue;
        const a   = liveAngles[i];
        const bx  = ox + Math.cos(a) * r.len * r.branchT;
        const by  = oy + Math.sin(a) * r.len * r.branchT;
        const ba  = a + r.branchDa;
        const ex  = bx + Math.cos(ba) * r.branchLen;
        const ey  = by + Math.sin(ba) * r.branchLen;
        const rad = r.dotR * 0.6;
        ctx.moveTo(ex + rad, ey);
        ctx.arc(ex, ey, rad, 0, TAU);
      }
      ctx.fillStyle = `rgba(${dr},0.65)`;
      ctx.fill();

      /* ─────────────────────────────────────────────────
         ORIGIN GLOW — single radial gradient, tiny
         ───────────────────────────────────────────────── */
      const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 36);
      og.addColorStop(0,   `rgba(${dr},0.55)`);
      og.addColorStop(0.45,`rgba(${dr},0.14)`);
      og.addColorStop(1,   `rgba(${dr},0)`);
      ctx.beginPath();
      ctx.arc(ox, oy, 36, 0, TAU);
      ctx.fillStyle = og;
      ctx.fill();

      // Origin dot
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, TAU);
      ctx.fillStyle = `rgba(${dr},0.9)`;
      ctx.fill();
    };

    s.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []); // eslint-disable-line

  /* ── mouse ──────────────────────────────────────────── */
  useEffect(() => {
    const wrap = canvasRef.current?.parentElement;
    if (!wrap) return;
    const s = sRef.current;
    const mv = (e) => {
      const r     = wrap.getBoundingClientRect();
      const src   = e.touches?.[0] ?? e;
      s.mouse.x   = src.clientX - r.left;
      s.mouse.y   = src.clientY - r.top;
    };
    const out = () => { s.mouse.x = s.mouse.y = -9999; };
    wrap.addEventListener("mousemove",  mv,  { passive: true });
    wrap.addEventListener("touchmove",  mv,  { passive: true });
    wrap.addEventListener("mouseleave", out);
    return () => {
      wrap.removeEventListener("mousemove",  mv);
      wrap.removeEventListener("touchmove",  mv);
      wrap.removeEventListener("mouseleave", out);
    };
  }, []);

  /* ── mode switch ──────────────────────────────────── */
  const switchMode = useCallback((i) => {
    const s     = sRef.current;
    s.modeA     = s.modeB;
    s.modeB     = i;
    s.blend     = 0;
    setMode(i);
    setOpen(false);
  }, []);

  const cur = MODES[mode];

  return (
    <div className="bb-root">

      {/* Stats row — identical to Stripe layout above the animation */}
      <div className="bb-stats">
        {[
          { val: "12,000+", sub: "active students on StarNote" },
          { val: "2.4M+",   sub: "notes & PDFs processed by AI" },
          { val: "99.95%",  sub: "historical platform uptime" },
          { val: "4×",      sub: "faster exam preparation" },
        ].map((s, i) => (
          <div key={i} className="bb-stat">
            <span className="bb-stat-val">{s.val}</span>
            <span className="bb-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div className="bb-canvas-wrap">
        <canvas ref={canvasRef} className="bb-canvas" />

        {/* Mode switcher — top-right circle + dropdown (Stripe-identical UI) */}
        <div className="bb-switcher">
          <button
            className="bb-switch-btn"
            onClick={() => setOpen(v => !v)}
            aria-label="Switch study mode"
          >
            <span aria-hidden="true">{cur.icon}</span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                className="bb-menu"
                role="listbox"
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.94 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                {MODES.map((m, i) => (
                  <li
                    key={m.id}
                    className={`bb-menu-item${mode === i ? " is-active" : ""}`}
                    onClick={() => switchMode(i)}
                    role="option"
                    aria-selected={mode === i}
                  >
                    <span className="bb-mi-ico" aria-hidden="true">{m.icon}</span>
                    <span className="bb-mi-lbl">{m.label}</span>
                    {mode === i && <span className="bb-mi-check" aria-hidden="true">✓</span>}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Current mode label — bottom-centre */}
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            className="bb-mode-tag"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <span>{cur.icon}</span>
            <strong>{cur.label}</strong>
            <span className="bb-mode-desc">— {cur.desc}</span>
          </motion.p>
        </AnimatePresence>

        <p className="bb-hint">Move cursor over the burst to interact</p>
      </div>
    </div>
  );
}
