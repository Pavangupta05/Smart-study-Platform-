import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────
   MODES  — palette per study mode (mirrors Stripe's time-of-day)
   ──────────────────────────────────────────────────────────── */
const MODES = [
  { id: "focus",    label: "Focus",    icon: "🎯",
    bg0: "#f2efff", bg1: "#e2d9ff",           // background top / bottom
    h: 256, s: 70,                             // hsl hue, saturation for lines
    desc: "Calm · Reading mode" },
  { id: "learning", label: "Learning", icon: "📚",
    bg0: "#eef3ff", bg1: "#d8e4ff",
    h: 230, s: 75,
    desc: "Active · Knowledge flow" },
  { id: "ai",       label: "AI Tutor", icon: "🤖",
    bg0: "#e8f9ff", bg1: "#cef0ff",
    h: 200, s: 80,
    desc: "Neural · Connected" },
  { id: "revision", label: "Revision", icon: "🔁",
    bg0: "#edfff6", bg1: "#ccf5e2",
    h: 158, s: 68,
    desc: "Sharp · Recall mode" },
  { id: "exam",     label: "Exam",     icon: "⚡",
    bg0: "#fff7ed", bg1: "#ffe8cc",
    h: 28,  s: 90,
    desc: "Urgent · High energy" },
  { id: "night",    label: "Night",    icon: "🌙",
    bg0: "#0e0d18", bg1: "#07070f",
    h: 255, s: 55,
    desc: "Dark · Soft neon" },
];

/* ────────────────────────────────────────────────────────────
   Generate ray data ONCE per resize — pure objects, no closures
   ──────────────────────────────────────────────────────────── */
function buildRays(W, H) {
  // Stripe puts origin exactly at bottom-center of section
  const ox = W / 2;
  const oy = H;          // bottom edge

  // How many rays — fewer on small screens for perf
  const N = Math.min(72, Math.max(36, Math.floor(W / 15)));

  const rays = [];
  for (let i = 0; i < N; i++) {
    // Spread: -π  (left) → 0 (right) — upper semicircle
    const t = i / (N - 1);                         // 0..1
    const base = -Math.PI + t * Math.PI;           // -π..0
    const jitter = (Math.random() - 0.5) * 0.12;  // tiny random spread

    // Length: longer rays in the center (straighter up), shorter on edges
    const centerFactor = 1 - Math.abs(t - 0.5) * 0.8;
    const len = (H * 0.55 + Math.random() * H * 0.3) * centerFactor;

    // Thickness varies: most are very thin like Stripe (0.3–0.9)
    const thick = 0.25 + Math.random() * 0.65;

    // Dot at tip?
    const hasDot = Math.random() > 0.2;
    const dotR   = 1.5 + Math.random() * 2.5;

    // Branch (fork off the main ray partway along)
    const hasBranch = Math.random() > 0.52;
    const branchT   = 0.45 + Math.random() * 0.4;    // where along ray
    const branchDa  = (Math.random() > 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.28);
    const branchLen = len * (0.18 + Math.random() * 0.22);
    const branchDot = hasBranch && Math.random() > 0.45;

    // Animation: tiny sine wobble on the angle
    const wobbleAmp  = 0.005 + Math.random() * 0.012; // radians — very subtle
    const wobbleFreq = 0.25 + Math.random() * 0.55;
    const wobbleOff  = Math.random() * Math.PI * 2;

    rays.push({
      ox, oy,
      base: base + jitter,
      len, thick,
      hasDot, dotR,
      hasBranch, branchT, branchDa, branchLen, branchDot,
      wobbleAmp, wobbleFreq, wobbleOff,
      // depth 0..1 for opacity layering
      depth: 0.3 + Math.random() * 0.7,
    });
  }
  return rays;
}

/* ────────────────────────────────────────────────────────────
   Lerp a scalar
   ──────────────────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/* ────────────────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────────────────── */
export default function StarBurstAnimation() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    rays: [],
    t:    0,          // time in seconds
    modeIdx:  0,
    prevIdx:  0,
    blend:    1,      // 0→1 cross-fade between modes
    mouse:    { x: -9999, y: -9999 },
    raf:      null,
    W: 0, H: 0,
    // pre-cached hsla strings per mode pair to avoid string concat in hot loop
    visible: true,   // pause when off-screen
  });
  const [activeMode, setActiveMode] = useState(0);
  const [open,       setOpen]       = useState(false);

  /* ── Canvas init + animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext("2d", { alpha: false });
    const s    = stateRef.current;
    let   then = performance.now();
    let   W    = 0, H = 0;

    // ── Resize (only recalculates rays) ──────────────────────
    const resize = () => {
      W = s.W = canvas.offsetWidth;
      H = s.H = canvas.offsetHeight;
      const dpr = Math.min(devicePixelRatio, 2); // cap at 2× for perf
      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.rays = buildRays(W, H);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    // ── Intersection Observer — pause when off-screen ────────
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; });
    io.observe(canvas);

    // ── Pre-compute line color from hsl ──────────────────────
    // Returns [r,g,b] from hsl (no canvas needed)
    const hsl2rgb = (h, s2, l) => {
      s2 /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s2 * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [Math.round(f(0)*255), Math.round(f(8)*255), Math.round(f(4)*255)];
    };

    // ── Draw one frame ───────────────────────────────────────
    const draw = (now) => {
      s.raf = requestAnimationFrame(draw);
      if (!s.visible) return;                // pause off-screen

      const dt = Math.min((now - then) / 1000, 0.05); // seconds, capped
      then = now;
      s.t += dt;

      // Blend progress
      if (s.blend < 1) s.blend = clamp01(s.blend + dt * 1.8); // ~0.55s transition

      const blA = MODES[s.prevIdx];
      const blB = MODES[s.modeIdx];
      const bl  = s.blend;

      // Lerp hue & saturation
      const H_cur  = lerp(blA.h, blB.h, bl);
      const S_cur  = lerp(blA.s, blB.s, bl);

      // ── Background ──────────────────────────────────────────
      // Lerp background hex — we parse & lerp manually
      const parseBg = (hex) => [
        parseInt(hex.slice(1,3),16),
        parseInt(hex.slice(3,5),16),
        parseInt(hex.slice(5,7),16),
      ];
      const bga0 = parseBg(blA.bg0), bgb0 = parseBg(blB.bg0);
      const bga1 = parseBg(blA.bg1), bgb1 = parseBg(blB.bg1);
      const top = [lerp(bga0[0],bgb0[0],bl), lerp(bga0[1],bgb0[1],bl), lerp(bga0[2],bgb0[2],bl)];
      const bot = [lerp(bga1[0],bgb1[0],bl), lerp(bga1[1],bgb1[1],bl), lerp(bga1[2],bgb1[2],bl)];

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, `rgb(${top.map(Math.round).join(",")})`);
      bgGrad.addColorStop(1, `rgb(${bot.map(Math.round).join(",")})`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Pre-compute line RGB once per frame ─────────────────
      // Two lightness values: near (brighter) and far (dimmer)
      const lineRGB  = hsl2rgb(H_cur, S_cur, 45);
      const lineRGB2 = hsl2rgb(H_cur, S_cur, 62);
      const dotRGB   = hsl2rgb(H_cur, S_cur, 38);

      const isNight = blB.id === "night" && bl > 0.5;

      // Mouse influence on origin area
      const ox = W / 2, oy = H;
      const mdx = s.mouse.x - ox;
      const mdy = s.mouse.y - oy;
      const md  = Math.sqrt(mdx*mdx + mdy*mdy) || 1;
      const mi  = clamp01(1 - md / 350); // 0..1

      // ── Draw rays ───────────────────────────────────────────
      // Batch all main ray lines together with beginPath per style
      // Group by thickness band for fewer state changes
      for (const ray of s.rays) {
        const wobble = Math.sin(s.t * ray.wobbleFreq + ray.wobbleOff) * ray.wobbleAmp;
        // Mouse deflects rays toward cursor slightly
        const mouseDeflect = mi * (mdx / md) * 0.03;
        const angle = ray.base + wobble + mouseDeflect;

        const ex = ox + Math.cos(angle) * ray.len;
        const ey = oy + Math.sin(angle) * ray.len;

        // Opacity based on depth + mode
        const baseAlpha = isNight
          ? ray.depth * 0.55
          : ray.depth * 0.48;

        // ── Main ray line ──────────────────────────────────────
        // Stripe uses a simple gradient: near=bright, far=dim
        // We create gradient only once per ray (unavoidable for Stripe look)
        const lg = ctx.createLinearGradient(ox, oy, ex, ey);
        lg.addColorStop(0,    `rgba(${lineRGB.join(",")},0)`);
        lg.addColorStop(0.08, `rgba(${lineRGB.join(",")},${(baseAlpha * 0.9).toFixed(2)})`);
        lg.addColorStop(0.75, `rgba(${lineRGB2.join(",")},${(baseAlpha * 0.65).toFixed(2)})`);
        lg.addColorStop(1,    `rgba(${lineRGB2.join(",")},${(baseAlpha * 0.1).toFixed(2)})`);

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = lg;
        ctx.lineWidth   = ray.thick;
        ctx.stroke();

        // ── Branch ─────────────────────────────────────────────
        if (ray.hasBranch) {
          const bx  = ox + Math.cos(angle) * ray.len * ray.branchT;
          const by  = oy + Math.sin(angle) * ray.len * ray.branchT;
          const ba  = angle + ray.branchDa;
          const bex = bx + Math.cos(ba) * ray.branchLen;
          const bey = by + Math.sin(ba) * ray.branchLen;

          const blg = ctx.createLinearGradient(bx, by, bex, bey);
          blg.addColorStop(0, `rgba(${lineRGB.join(",")},${(baseAlpha * 0.7).toFixed(2)})`);
          blg.addColorStop(1, `rgba(${lineRGB2.join(",")},0)`);

          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bex, bey);
          ctx.strokeStyle = blg;
          ctx.lineWidth   = ray.thick * 0.55;
          ctx.stroke();

          // Branch tip dot
          if (ray.branchDot) {
            const dAlpha = baseAlpha * 0.75;
            ctx.beginPath();
            ctx.arc(bex, bey, ray.dotR * 0.65, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${dotRGB.join(",")},${dAlpha.toFixed(2)})`;
            ctx.fill();
          }
        }

        // ── Tip dot ────────────────────────────────────────────
        if (ray.hasDot) {
          const pulse = 0.82 + 0.18 * Math.sin(s.t * 1.4 + ray.wobbleOff);
          const r     = ray.dotR * pulse * (1 + mi * 0.4);
          const dAlpha = clamp01(baseAlpha * 1.35) * pulse;

          // Subtle glow halo (cheap: single radial, small)
          const glowR = r * 3.5;
          const radG  = ctx.createRadialGradient(ex, ey, 0, ex, ey, glowR);
          radG.addColorStop(0,   `rgba(${dotRGB.join(",")},${(dAlpha * 0.45).toFixed(2)})`);
          radG.addColorStop(0.5, `rgba(${dotRGB.join(",")},${(dAlpha * 0.12).toFixed(2)})`);
          radG.addColorStop(1,   `rgba(${dotRGB.join(",")},0)`);
          ctx.beginPath();
          ctx.arc(ex, ey, glowR, 0, Math.PI * 2);
          ctx.fillStyle = radG;
          ctx.fill();

          // Solid core
          ctx.beginPath();
          ctx.arc(ex, ey, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${dotRGB.join(",")},${Math.min(dAlpha * 1.8, 1).toFixed(2)})`;
          ctx.fill();
        }
      }

      // ── Origin point ────────────────────────────────────────
      const origGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 40);
      origGlow.addColorStop(0,   `rgba(${dotRGB.join(",")},0.6)`);
      origGlow.addColorStop(0.5, `rgba(${dotRGB.join(",")},0.15)`);
      origGlow.addColorStop(1,   `rgba(${dotRGB.join(",")},0)`);
      ctx.beginPath();
      ctx.arc(ox, oy, 40, 0, Math.PI * 2);
      ctx.fillStyle = origGlow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotRGB.join(",")},0.9)`;
      ctx.fill();
    };

    s.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(s.raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []); // eslint-disable-line

  /* ── Mouse ── */
  useEffect(() => {
    const wrap = canvasRef.current?.parentElement;
    if (!wrap) return;
    const s = stateRef.current;
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      s.mouse.x = (e.touches?.[0] ?? e).clientX - r.left;
      s.mouse.y = (e.touches?.[0] ?? e).clientY - r.top;
    };
    const onLeave = () => { s.mouse.x = -9999; s.mouse.y = -9999; };
    wrap.addEventListener("mousemove", onMove, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: true });
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  /* ── Mode switch ── */
  const switchMode = useCallback((idx) => {
    const s = stateRef.current;
    s.prevIdx = s.modeIdx;
    s.modeIdx = idx;
    s.blend   = 0;
    setActiveMode(idx);
    setOpen(false);
  }, []);

  const mode = MODES[activeMode];

  return (
    <div className="sb-root">
      {/* ── Stats row ── */}
      <div className="sb-stats">
        {[
          { val: "12,000+", sub: "active students on StarNote" },
          { val: "2.4M+",   sub: "notes & PDFs processed by AI" },
          { val: "99.95%",  sub: "historical platform uptime" },
          { val: "4×",      sub: "faster exam preparation" },
        ].map((s, i) => (
          <div key={i} className="sb-stat">
            <span className="sb-stat-val">{s.val}</span>
            <span className="sb-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Canvas wrap ── */}
      <div className="sb-wrap">
        <canvas ref={canvasRef} className="sb-canvas" />

        {/* Mode switcher — Stripe-style circular toggle, top-right */}
        <div className="sb-toggle-wrap">
          <button
            className="sb-toggle-btn"
            onClick={() => setOpen(v => !v)}
            aria-label="Switch study mode"
          >
            <span aria-hidden>{mode.icon}</span>
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                className="sb-menu"
                role="listbox"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                {MODES.map((m, i) => (
                  <li
                    key={m.id}
                    className={`sb-menu-item${activeMode === i ? " active" : ""}`}
                    role="option"
                    aria-selected={activeMode === i}
                    onClick={() => switchMode(i)}
                  >
                    <span className="sb-mi-icon" aria-hidden>{m.icon}</span>
                    <span className="sb-mi-label">{m.label}</span>
                    {activeMode === i && <span className="sb-mi-check" aria-hidden>✓</span>}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Active mode label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            className="sb-cur-mode"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22 }}
          >
            <span>{mode.icon}</span>
            <strong>{mode.label}</strong>
            <span className="sb-cur-desc">— {mode.desc}</span>
          </motion.div>
        </AnimatePresence>

        <p className="sb-cursor-hint">Move your cursor into the burst to interact</p>
      </div>
    </div>
  );
}
