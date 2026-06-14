import { useState, useEffect, useRef, memo, useMemo } from "react";
import { motion, AnimatePresence, useInView, useMotionTemplate, useMotionValue, useScroll, useTransform, useSpring } from "framer-motion";
import {
  Sparkles, ArrowRight, CheckCircle2, BrainCircuit, Pencil,
  Layers, Menu, X, Target, Clock, Zap, FileText, BookOpen, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import KnowledgeNetwork from "../components/KnowledgeNetwork";
import "../styles/landing.css";

/* ─── Premium Easing & Transition ─── */
const STRIPE_EASE = [0.22, 1, 0.36, 1]; // Classic smooth spring-like ease
const SPRING = { type: "spring", stiffness: 300, damping: 30 };

/* ─── Advanced AI Demo Scanner ─── */
function AIDemoScanner() {
  return (
    <div className="lp-ai-scanner-container relative w-full h-[400px] flex items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      <div className="relative w-[300px] h-[320px] bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-4 shadow-2xl">
        <div className="w-1/2 h-3 bg-white/20 rounded"></div>
        <div className="w-full h-2 bg-white/10 rounded"></div>
        <div className="w-[90%] h-2 bg-white/10 rounded"></div>
        <div className="w-full h-2 bg-white/10 rounded"></div>
        <div className="w-[85%] h-2 bg-white/10 rounded"></div>
        <div className="w-3/4 h-2 bg-white/10 rounded mt-4"></div>
        <div className="w-full h-2 bg-white/10 rounded"></div>

        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_15px_#3b82f6] z-10"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-0 right-0 h-16 bg-gradient-to-b from-blue-500/20 to-transparent z-0 pointer-events-none"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="absolute right-8 bottom-12 w-[240px] bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">AI Insight</span>
        </div>
        <motion.p
          className="text-sm text-gray-300 leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Extracted 12 key concepts. Creating active recall flashcards...
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ─── Animated Counters ─── */
function AnimatedCounter({ from, to, duration, suffix = "", isFloat = false }) {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (!inView) return;
    const node = nodeRef.current;
    if (!node) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      // Use an easeOutQuad progression
      const t = Math.min((timestamp - start) / (duration * 1000), 1);
      const easeT = t * (2 - t);
      const current = from + (to - from) * easeT;
      node.textContent = (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
      if (t < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [from, to, duration, suffix, isFloat, inView]);
  return <span ref={nodeRef}>{from}{suffix}</span>;
}

/* ─── Animated CSS App Simulation ─── */
function AnimatedAppSimulation() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const springConfig = { stiffness: 100, damping: 30, mass: 1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Depth Layers
  const layer1X = useTransform(smoothMouseX, [-1, 1], [-8, 8]);
  const layer1Y = useTransform(smoothMouseY, [-1, 1], [-8, 8]);
  const layer2X = useTransform(smoothMouseX, [-1, 1], [-16, 16]);
  const layer2Y = useTransform(smoothMouseY, [-1, 1], [-16, 16]);
  const layer3X = useTransform(smoothMouseX, [-1, 1], [-24, 24]);
  const layer3Y = useTransform(smoothMouseY, [-1, 1], [-24, 24]);

  // Knowledge Graph nodes
  const nodes = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2
  })), []);

  return (
    <div 
      className="sim-container" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ambient Lighting Background */}
      <div className="sim-ambient-light" />
      <div className="sim-ambient-light sim-ambient-light-2" />

      {/* Interactive Knowledge Graph Layer */}
      <motion.div 
        className="sim-kg-layer"
        style={{ x: layer1X, y: layer1Y }}
      >
        <svg width="100%" height="100%" className="sim-kg-svg">
          {nodes.map((node, i) => {
            // Draw connections to next 2 nodes
            const next1 = nodes[(i + 1) % nodes.length];
            const next2 = nodes[(i + 2) % nodes.length];
            return (
              <g key={node.id}>
                <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${next1.x}%`} y2={`${next1.y}%`} stroke="rgba(96,165,250,0.15)" strokeWidth="0.5" />
                <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${next2.x}%`} y2={`${next2.y}%`} stroke="rgba(168,85,247,0.1)" strokeWidth="0.5" />
                <motion.circle 
                  cx={`${node.x}%`} 
                  cy={`${node.y}%`} 
                  r={node.size} 
                  fill="#3b82f6" 
                  opacity={0.4}
                  animate={{ 
                    y: ["-10%", "10%", "-10%"],
                    opacity: [0.2, 0.6, 0.2]
                  }}
                  transition={{ duration: 10 + node.delay * 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Sidebar - Middle Layer */}
      <motion.div className="sim-sidebar" style={{ x: layer2X, y: layer2Y }}>
        <div className="sim-brand">
          <div className="sim-brand-icon"><Sparkles size={12} color="#60a5fa" /></div>
          <div className="sim-brand-name">StarNote</div>
        </div>
        {["Dashboard", "Library", "Flashcards", "Analytics", "Settings"].map((label, i) => (
          <motion.div 
            key={i} 
            className={`sim-nav-item ${i === 0 ? "active" : ""}`}
            whileHover={{ background: "rgba(255,255,255,0.08)", scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="sim-nav-icon"></div>
            <span className="sim-nav-label">{label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="sim-main">
        {/* Topbar - Middle Layer */}
        <motion.div className="sim-topbar" style={{ x: layer2X, y: layer2Y }}>
          <div className="sim-search">
            <span>Search notes...</span>
            <motion.div 
              className="sim-cursor"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
          <div className="sim-actions">
            <motion.div className="sim-bell" whileHover={{ rotate: 15, scale: 1.1 }}>🔔</motion.div>
            <motion.div className="sim-avatar" whileHover={{ scale: 1.1 }}>JD</motion.div>
          </div>
        </motion.div>

        {/* Dashboard Content - Front Layer */}
        <motion.div className="sim-content" style={{ x: layer3X, y: layer3Y }}>
          
          {/* Dashboard Header */}
          <div className="sim-header">
            <div>
              <h1>Overview</h1>
              <p>Welcome back, your study metrics are looking great.</p>
            </div>
            <motion.button 
              className="sim-btn-export"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Export Report
            </motion.button>
          </div>

          {/* Metric Cards - Floating animation + Hover tracking */}
          <div className="sim-metrics">
            {[
              { label: "Total Study Hours", value: 124.5, isFloat: true, suffix: "h", trend: "+12%", trendType: "pos", delay: 0.1 },
              { label: "Avg. Focus Score", value: 92, isFloat: false, suffix: "%", trend: "+5%", trendType: "pos", delay: 0.2 },
              { label: "Flashcards Mastered", value: 1204, isFloat: false, suffix: "", trend: "-2%", trendType: "neg", delay: 0.3 }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                className="sim-stat-card glass-panel group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: stat.delay, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ y: -4, borderColor: "rgba(59,130,246,0.4)" }}
              >
                <div className="sim-glow-blob group-hover:opacity-100" />
                <span className="sim-stat-label relative z-10">{stat.label}</span>
                <div className="sim-stat-bottom relative z-10">
                  <span className="sim-stat-val">
                    <AnimatedCounter from={0} to={stat.value} duration={2} suffix={stat.suffix} isFloat={stat.isFloat} />
                  </span>
                  <span className={`sim-stat-trend ${stat.trendType}`}>{stat.trend}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="sim-grid">
          
          {/* Main Chart Card */}
          <motion.div 
            className="sim-chart-card glass-panel group"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            whileHover={{ borderColor: "rgba(168,85,247,0.3)" }}
          >
            <div className="sim-chart-header">
              <div className="sim-chart-title">
                <span>Study Analytics</span>
                <small>Performance over past 30 days</small>
              </div>
              <div className="sim-chart-legend">
                <div><span className="dot blue"></span> Focus</div>
                <div><span className="dot purple"></span> Retention</div>
              </div>
            </div>

            <div className="sim-chart-area">
              <div className="sim-chart-grid"></div>
              
              <svg viewBox="0 0 100 50" className="sim-chart-svg" preserveAspectRatio="none">
                {/* Secondary Purple Line */}
                <motion.path
                  d="M 0 45 Q 20 30 40 35 T 70 20 T 100 5"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 0.8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 2.5, ease: "easeOut" }}
                />

                {/* Primary Blue Line Gradient */}
                <motion.path
                  d="M 0 50 Q 15 40 30 45 T 60 25 T 100 10 L 100 50 L 0 50 Z"
                  fill="url(#sim-gradient)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 1.5 }}
                />

                {/* Primary Blue Line */}
                <motion.path
                  d="M 0 50 Q 15 40 30 45 T 60 25 T 100 10"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0px 0px 8px rgba(59,130,246,0.6))' }}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
                />

                {/* Data Nodes */}
                {[
                  { cx: 30, cy: 45, delay: 1.1 },
                  { cx: 60, cy: 25, delay: 1.6 },
                  { cx: 100, cy: 10, delay: 2.3 }
                ].map((node, i) => (
                  <motion.circle
                    key={i}
                    cx={node.cx} cy={node.cy} r="2.5"
                    fill="#03040b" stroke="#3b82f6" strokeWidth="1.5"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 2, stroke: "#60a5fa", filter: 'drop-shadow(0 0 4px #60a5fa)' }}
                    transition={{ delay: node.delay, type: "spring", stiffness: 300 }}
                    className="sim-node"
                  />
                ))}

                <defs>
                  <linearGradient id="sim-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Floating Tooltip Interaction */}
              <motion.div 
                className="sim-tooltip"
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
              >
                <div className="sim-tt-title">Retention Spike</div>
                <div className="sim-tt-stats">
                  <span className="sim-tt-val">94%</span>
                  <span className="sim-tt-trend">+12%</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <div className="sim-feed">
            <span className="sim-feed-title">Recent Activity</span>
            {["Completed Physics Quiz", "Uploaded Biology.pdf", "Mastered 40 flashcards", "Created Study Plan"].map((msg, i) => (
              <motion.div 
                key={i}
                className="sim-feed-item glass-panel group"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + i * 0.15, ...SPRING }}
                whileHover={{ x: -4, borderColor: "rgba(59,130,246,0.3)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="sim-feed-icon group-hover:bg-blue-500/30 transition-colors">✨</div>
                <div className="sim-feed-info">
                  <span className="sim-feed-msg">{msg}</span>
                  <span className="sim-feed-time">{i + 1} hr ago</span>
                </div>
              </motion.div>
            ))}
          </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── 3D Dashboard Reveal ─── */
function DashboardReveal() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end bottom"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [35, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.4, 1]);

  return (
    <section ref={containerRef} className="lp-dashboard-reveal relative py-20 px-8 flex justify-center perspective-[1200px]">
      <motion.div
        style={{ rotateX, scale, opacity, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[1000px] aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] bg-black/50 backdrop-blur-md"
      >
        <AnimatedAppSimulation />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060814] via-transparent to-transparent pointer-events-none" />
      </motion.div>
    </section>
  );
}

/* ─── Premium Fade-in with Stagger ─── */
const FadeInView = memo(function FadeInView({ children, delay = 0, y = 28, className = "", style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: STRIPE_EASE }}
    >
      {children}
    </motion.div>
  );
});

/* ─── Animated counter ─── */
const Counter = memo(function Counter({ end, suffix = "", label, isFloat = false }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let v = 0;
    const step = end / 60;
    const id = setInterval(() => {
      v += step;
      if (v >= end) { setCount(end); clearInterval(id); }
      else setCount(isFloat ? parseFloat(v.toFixed(1)) : Math.floor(v));
    }, 16);
    return () => clearInterval(id);
  }, [inView, end, isFloat]);

  return (
    <div ref={ref} className="stat-item">
      <span className="stat-number">{isFloat ? count.toFixed(1) : count.toLocaleString()}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
});

/* ─── 3D Glow Card (Stripe-like) ─── */
function GlowCard({ children, className, delay, style = {} }) {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <FadeInView delay={delay} className="w-full">
      <motion.div
        ref={ref}
        className={`glow-card-wrapper ${className}`}
        onMouseMove={handleMouseMove}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={SPRING}
        style={{ position: 'relative', ...style }}
      >
        <motion.div
          className="glow-pointer"
          style={{
            background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.15), transparent 80%)`,
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', zIndex: 0
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
          {children}
        </div>
      </motion.div>
    </FadeInView>
  );
}

/* ─── Feature Data ─── */
const FEATURES = [
  { id: "ai", label: "AI Flashcards", title: "Automated Flashcards", desc: "Upload any document. Our AI instantly extracts key concepts and generates active recall flashcards.", icon: <Zap size={18}/>, preview: <AIDemoScanner /> },
  { id: "docs", label: "Smart Docs", title: "Smart Document Reader", desc: "Read, highlight, and annotate PDFs natively. Ask questions directly to your documents.", icon: <BookOpen size={18}/>, preview: <div className="ft-preview-ai"><div className="ft-doc"><div className="ft-doc-line l-80" /><div className="ft-doc-line l-100" /><div className="ft-highlight" /><div className="ft-doc-line l-60" /></div><div className="ft-bubble">Summarizing... ✨</div></div> },
  { id: "pomo", label: "Focus Timer", title: "Focus & Flow", desc: "Built-in Pomodoro timers with deep integration into your study sessions.", icon: <Target size={18}/>, preview: <div className="ft-preview-pomo"><div className="pomo-demo-ring"><div className="pomo-demo-label">25:00</div></div><div className="pomo-demo-modes"><span className="pomo-mode active">Focus</span><span className="pomo-mode">Break</span></div></div> },
];

/* ─── Bento Grid Data ─── */
const BENTO_FEATURES = [
  { icon: <Zap size={24}/>, title: "Lighting Fast", desc: "Built with React and Framer Motion for buttery smooth 60fps performance." },
  { icon: <CheckCircle2 size={24}/>, title: "Auto-Sync", desc: "Every keystroke saves instantly to the cloud." },
  { icon: <Target size={24}/>, title: "Distraction Free", desc: "Zen mode hides the UI so you can focus entirely on your thoughts." },
  { icon: <Layers size={24}/>, title: "Unlimited Canvas", desc: "Never run out of space. Pan and zoom infinitely across your ideas." },
];

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { title: "Ingest", desc: "Upload PDFs, notes, or web links. We securely store and index your materials.", icon: "📚" },
    { title: "Process", desc: "Our AI brain extracts concepts and connects dots to create a knowledge graph.", icon: "🧠" },
    { title: "Master", desc: "Study generated flashcards and quizzes tailored to your weaknesses.", icon: "🏆" }
  ];
  return (
    <section id="how" style={{ padding: '100px 28px', background: 'var(--bg)', position: 'relative' }}>
      <FadeInView className="lp-section-header" style={{ marginBottom: '60px' }}>
        <p className="lp-eyebrow" style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}>Workflow</p>
        <h2 style={{ color: '#fff' }}>From messy notes to mastery.</h2>
        <p className="lp-section-sub">Three simple steps to unlock your potential.</p>
      </FadeInView>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {steps.map((step, i) => (
          <FadeInView key={step.title} delay={0.2 * i}>
            <div style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: '40px', marginBottom: '24px' }}>{step.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Step {i+1}: {step.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontSize: '15px' }}>{step.desc}</p>
            </div>
          </FadeInView>
        ))}
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function Testimonials() {
  const reviews = [
    { name: "Sarah L.", uni: "Stanford University", text: "StarNote cut my reading time in half. The active recall flashcards it generates from my PDFs are a lifesaver for finals." },
    { name: "David M.", uni: "MIT", text: "The knowledge graph helps me see connections in Physics that I missed in lectures. Unbelievably powerful UI." },
    { name: "Emma R.", uni: "Oxford", text: "I've tried Notion and Obsidian. StarNote is the first app that actually feels like it's studying WITH me." },
    { name: "James K.", uni: "Harvard", text: "Premium design, insanely fast performance. The AI tutor doesn't just give answers, it guides me to them." }
  ];
  return (
    <section style={{ padding: '100px 28px', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <FadeInView className="lp-section-header" style={{ marginBottom: '60px' }}>
        <h2 style={{ color: '#fff' }}>Wall of Love</h2>
        <p className="lp-section-sub">Don't just take our word for it.</p>
      </FadeInView>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', position: 'relative', zIndex: 10 }}>
        {reviews.map((r, i) => (
          <FadeInView key={i} delay={i * 0.1}>
            <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{r.name.charAt(0)}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{r.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.uni}</div>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6 }}>"{r.text}"</p>
            </div>
          </FadeInView>
        ))}
      </div>
    </section>
  );
}

/* ─── Main Landing ─── */
export default function Landing() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Navbar scroll animation
  const { scrollY } = useScroll();
  const [navVisible, setNavVisible] = useState(true);
  const [navBackground, setNavBackground] = useState(false);
  
  useEffect(() => {
    let lastScrollY = 0;
    return scrollY.onChange((latest) => {
      if (latest > 50) {
        setNavBackground(true);
      } else {
        setNavBackground(false);
      }
      
      if (latest > lastScrollY && latest > 150) {
        setNavVisible(false); // hide on scroll down
      } else {
        setNavVisible(true); // show on scroll up
      }
      lastScrollY = latest;
    });
  }, [scrollY]);

  const faqs = [
    { q: "Is StarNote really free?", a: "Yes! Our Zen Free plan includes all core features — notes, reader, and basic flashcards — forever. No credit card required." },
    { q: "Can I use StarNote offline?", a: "Your notes sync to the cloud and can be accessed offline in read mode. Annotation and editing requires a connection." },
    { q: "What file types does StarNote support?", a: "We support PDF, DOCX, images (PNG, JPG), and plain text. AI features work best with text-based PDFs." },
    { q: "How does the AI work?", a: "StarNote uses Google Gemini AI. Your data is encrypted and never used for model training." },
  ];

  return (
    <div className="lp dark" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Navbar ── */}
      <motion.nav 
        className="lp-nav"
        initial={{ y: 0 }}
        animate={{ 
          y: navVisible ? 0 : -100,
          background: navBackground ? "rgba(6, 8, 20, 0.8)" : "rgba(6, 8, 20, 0)",
          backdropFilter: navBackground ? "blur(24px)" : "blur(0px)",
          borderBottom: navBackground ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="lp-nav-inner">
          <motion.div className="lp-logo" onClick={() => navigate("/")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ color: '#fff' }}>
            <div className="lp-logo-icon" style={{ background: '#fff', color: '#000' }}><Sparkles size={18} strokeWidth={2.5} /></div>
            <span style={{ fontWeight: 800 }}>StarNote</span>
          </motion.div>
          <div className="lp-navlinks" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <motion.a href="#features" whileHover={{ y: -2, color: '#fff' }}>Features</motion.a>
            <motion.a href="#how"      whileHover={{ y: -2, color: '#fff' }}>How it works</motion.a>
            <motion.a href="#pricing"  whileHover={{ y: -2, color: '#fff' }}>Pricing</motion.a>
            <motion.a href="#faq"      whileHover={{ y: -2, color: '#fff' }}>FAQ</motion.a>
          </div>
          <div className="lp-nav-cta">
            <motion.button className="btn-ghost" onClick={() => navigate("/auth")} whileHover={{ y: -2 }} style={{ color: '#fff' }}>Log in</motion.button>
            <motion.button className="btn-solid-sm" onClick={() => navigate("/auth")}
              style={{ background: '#fff', color: '#000', padding: '10px 20px', borderRadius: '10px' }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}>
              Get Started <ArrowRight size={14} />
            </motion.button>
          </div>
          <button className="lp-hamburger" onClick={() => setMobileOpen(v => !v)} style={{ color: '#fff' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="lp-drawer shadow-2xl border-b border-white/10" style={{ background: 'var(--surface)' }}
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.2, ease: STRIPE_EASE }}>
            {["#features","#how","#pricing","#faq"].map(h => (
              <a key={h} href={h} onClick={() => setMobileOpen(false)} style={{ color: '#fff' }}>
                {h.replace("#","").charAt(0).toUpperCase() + h.replace("#","").slice(1)}
              </a>
            ))}
            <button className="btn-solid-sm w-full" onClick={() => navigate("/auth")} style={{ background: '#fff', color: '#000' }}>Get Started Free</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <KnowledgeNetwork hero />

      {/* ── Stats ── */}
      <section className="lp-stats">
        <FadeInView className="lp-stats-inner py-8" style={{ color: '#fff' }}>
          <Counter end={12}   suffix="K+" label="Active students" />
          <div className="stat-div" />
          <Counter end={2.4}  suffix="M+" label="Notes created" isFloat={true} />
          <div className="stat-div" />
          <Counter end={98}   suffix="%" label="Satisfaction rate" />
          <div className="stat-div" />
          <Counter end={4}    suffix="x" label="Faster studying" />
        </FadeInView>
      </section>

      {/* ── Integrations Marquee ── */}
      <section className="lp-integrations">
        <p>Trusted by students at top universities worldwide</p>
        <div className="lp-marquee-track">
          {[...Array(2)].map((_, j) => (
            <div key={j} style={{ display: 'flex', gap: '60px' }}>
              {["Stanford", "MIT", "Harvard", "Oxford", "Cambridge", "Berkeley", "Princeton", "Yale"].map((t, i) => (
                <div key={`${j}-${i}`} className="lp-marquee-item" style={{ fontSize: '18px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(59,130,246,0.6)' }} />
                  {t}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── 3D Dashboard Reveal ── */}
      <DashboardReveal />

      {/* ── How It Works ── */}
      <HowItWorks />

      {/* ── Features ── */}
      <section id="features" className="lp-features">
        <FadeInView className="lp-section-header">
          <motion.p className="lp-eyebrow" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>Features</motion.p>
          <h2>Everything you need to ace exams.</h2>
          <p className="lp-section-sub">Powerful tools designed to minimize friction and maximize focus.</p>
        </FadeInView>

        <FadeInView delay={0.2} className="lp-feat-tabs">
          {FEATURES.map((f, i) => (
            <button key={f.id}
              className={`lp-feat-tab ${activeFeature === i ? "active" : ""}`}
              onClick={() => setActiveFeature(i)}
            >
              {activeFeature === i && (
                <motion.div layoutId="activeTab" className="active-tab-bg" transition={SPRING} />
              )}
              {f.icon} {f.label}
            </button>
          ))}
        </FadeInView>

        <AnimatePresence mode="wait">
          <motion.div key={activeFeature} className="lp-feat-panel shadow-xl border border-white/5"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: STRIPE_EASE }}>
            
            <div className="lp-feat-info">
              <motion.h3 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, ...SPRING }}>{FEATURES[activeFeature].title}</motion.h3>
              <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, ...SPRING }}>{FEATURES[activeFeature].desc}</motion.p>
              <motion.button className="btn-solid-sm btn-feature-cta"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/auth")}>
                Try it free <ArrowRight size={14} />
              </motion.button>
            </div>
            <div className="lp-feat-preview">
              {FEATURES[activeFeature].preview}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── Bento Grid Showcase ── */}
      <section className="lp-bento">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">The details matter</p>
          <h2>Every interaction, perfected.</h2>
          <p className="lp-section-sub">We obsessed over the micro-interactions so you can obsess over your studies.</p>
        </FadeInView>
        <div className="bento-grid">
          {BENTO_FEATURES.map((f, i) => (
            <GlowCard key={i} delay={i * 0.15} className="bento-card">
              <div>
                <div className="bento-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>


      <section id="pricing" className="lp-pricing">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>Pricing</p>
          <h2 style={{ color: '#fff' }}>Simple, transparent pricing.</h2>
        </FadeInView>
        <div className="lp-billing-toggle">
          <span className={!isAnnual ? "active" : ""}>Monthly</span>
          <div className="lp-toggle-switch" onClick={() => setIsAnnual(!isAnnual)}>
            <motion.div className="lp-toggle-knob" animate={{ x: isAnnual ? 24 : 4 }} transition={SPRING} />
          </div>
          <span className={isAnnual ? "active" : ""}>Annually <span className="lp-discount">Save 20%</span></span>
        </div>
        <div className="lp-pricing-grid" style={{ maxWidth: '1000px', margin: '40px auto 0' }}>
          <GlowCard delay={0.1} className="lp-price-card featured" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3>Zen Free</h3>
            <div className="lp-price">
              <span>$</span>0
              <span className="lp-period">/forever</span>
            </div>
            <p className="lp-price-note">Perfect for getting started.</p>
            <p className="lp-price-desc">Everything you need to study.</p>
            <ul>
              {["Unlimited Notes","Advanced Reader","Basic Flashcards","Device Sync","Dark Mode"].map(f => (
                <li key={f}><CheckCircle2 size={18} color="#60a5fa" />{f}</li>
              ))}
            </ul>
            <motion.button className="btn-solid-lg" style={{ background: '#fff', color: '#000' }}
              onClick={() => navigate("/auth")} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Get Started Free</motion.button>
          </GlowCard>

          <GlowCard delay={0.15} className="lp-price-card featured">
            <motion.div className="lp-price-badge" initial={{ y: -20, opacity: 0 }} animate={{ y: -14, opacity: 1 }} transition={{ delay: 0.5, ...SPRING }}>Most Popular</motion.div>
            <h3>StarNote Pro</h3>
            <div className="lp-price">
              <span>$</span>
              <AnimatePresence mode="wait">
                <motion.span key={isAnnual ? "a" : "m"} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{isAnnual ? "6.40" : "8"}</motion.span>
              </AnimatePresence>
              <span className="lp-period">/month</span>
            </div>
            <p className="lp-price-note">{isAnnual ? "Billed $76.80 annually" : "Billed monthly"}</p>
            <p className="lp-price-desc">For elite students who need it all.</p>
            <ul>
              {["Unlimited notes & storage","Unlimited AI Summaries","Auto-flashcard generation","Advanced analytics","Priority support","AI Tutor (Chat)"].map(f => (
                <li key={f}><CheckCircle2 size={18} color="#10b981" />{f}</li>
              ))}
            </ul>
            <motion.button className="btn-solid-lg"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}>Upgrade to Pro</motion.button>
          </GlowCard>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── FAQ ── */}
      <section id="faq" className="lp-faq" style={{ background: 'var(--surface)', padding: '100px 0' }}>
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow" style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)' }}>FAQ</p>
          <h2 style={{ color: '#fff' }}>Got questions? We've got answers.</h2>
        </FadeInView>
        <div className="lp-faq-list" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((f, i) => (
            <FadeInView key={i} delay={i * 0.08} className="lp-faq-item" style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              <button className="lp-faq-q" style={{ width: '100%', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                {f.q}
                <motion.span animate={{ rotate: activeFaq === i ? 180 : 0 }} transition={{ duration: 0.3, ease: STRIPE_EASE }}>
                  <ChevronDown size={20} color="rgba(255,255,255,0.5)" />
                </motion.span>
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div className="lp-faq-a"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: STRIPE_EASE }}>
                    <p style={{ padding: '0 24px 24px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <FadeInView className="lp-cta-banner">
        <motion.h2 initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, ...SPRING }}>Ready to study smarter?</motion.h2>
        <motion.p initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, ...SPRING }}>Join 12,000+ students already using StarNote.</motion.p>
        <motion.button className="btn-hero-primary lp-cta-btn"
          style={{ background: '#fff', color: '#000', padding: '18px 40px', fontSize: '16px', fontWeight: 800, borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255,255,255,0.15)" }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/auth")}>
          Start for free today <ArrowRight size={18} />
        </motion.button>
      </FadeInView>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <div className="lp-logo-icon"><Sparkles size={16} /></div>
              StarNote AI
            </div>
            <p>The AI-native workspace for elite students.</p>
          </div>
          <div className="lp-footer-links">
            {[
              { h:"Product",  links:[["#features","Features"],["#pricing","Pricing"],["#faq","FAQ"]] },
              { h:"Company",  links:[["#","About"],["#","Blog"],["#","Contact"]] },
              { h:"Legal",    links:[["#","Privacy"],["#","Terms"]] },
            ].map(col => (
              <div key={col.h} className="lp-footer-col">
                <h4>{col.h}</h4>
                {col.links.map(([href, label]) => <motion.a key={label} href={href} whileHover={{ x: 5, color: '#fff' }}>{label}</motion.a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 StarNote Inc. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
