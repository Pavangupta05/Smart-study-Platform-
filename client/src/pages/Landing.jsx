import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import {
  Sparkles, ArrowRight, CheckCircle2, BrainCircuit, Pencil,
  Layers, Menu, X, Target, Clock, Zap, Star, Play,
  BookOpen, BarChart2, FileText, MessageSquare, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

/* ─── Reusable fade-in-view ─── */
function FadeInView({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ─── */
function Counter({ end, suffix = "", label }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, end]);

  return (
    <div ref={ref} className="stat-item">
      <span className="stat-number">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ─── Feature Tab Demo ─── */
const FEATURES = [
  {
    id: "ai",
    icon: <BrainCircuit size={20} />,
    label: "AI Summaries",
    title: "Instant Intelligence on Any Document",
    desc: "Paste or upload any PDF, lecture notes, or research paper. StarNote AI extracts the key concepts, themes, and high-yield facts in under 5 seconds — so you can focus on understanding, not reading.",
    preview: (
      <div className="ft-preview-ai">
        <div className="ft-doc">
          <div className="ft-doc-line l-80" />
          <div className="ft-doc-line l-100" />
          <div className="ft-doc-line l-60" />
          <div className="ft-doc-line l-90" />
          <div className="ft-doc-line l-50" />
          <div className="ft-highlight" />
          <div className="ft-doc-line l-100" />
          <div className="ft-doc-line l-70" />
        </div>
        <motion.div
          className="ft-bubble"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 3 }}
        >
          <Sparkles size={14} style={{ color: "var(--accent-blue)" }} />
          <span>Key concepts extracted ✓</span>
        </motion.div>
      </div>
    )
  },
  {
    id: "flashcards",
    icon: <Layers size={20} />,
    label: "Flashcards",
    title: "Active Recall, Auto-Generated",
    desc: "Click once and watch your notes transform into a fully-structured flashcard deck. The AI identifies question-answer pairs, definitions, and formulas — giving you spaced repetition-ready cards instantly.",
    preview: (
      <div className="ft-preview-cards">
        {["What is photosynthesis?", "Define osmosis", "Newton's 2nd Law"].map((q, i) => (
          <motion.div
            key={i}
            className="ft-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            whileHover={{ scale: 1.04, rotateY: 5 }}
          >
            <span className="ft-card-q">{q}</span>
            <span className="ft-card-badge">Card {i + 1}</span>
          </motion.div>
        ))}
      </div>
    )
  },
  {
    id: "canvas",
    icon: <Pencil size={20} />,
    label: "Infinite Canvas",
    title: "Draw & Think Without Limits",
    desc: "Our WebGL-powered canvas lets you highlight, annotate, draw diagrams, and take freehand notes directly on top of any PDF. Switch between pen, highlighter, and shape tools with a single tap.",
    preview: (
      <div className="ft-preview-canvas">
        <div className="ft-canvas-page">
          <div className="ft-canvas-line l-80" />
          <div className="ft-canvas-line l-100" />
          <motion.div
            className="ft-canvas-highlight"
            initial={{ width: 0 }}
            animate={{ width: "70%" }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          />
          <div className="ft-canvas-line l-60" />
        </div>
        <div className="ft-tools">
          {["✏️", "🖊️", "📐", "⬜"].map((t, i) => (
            <motion.div key={i} className={`ft-tool ${i === 0 ? "active" : ""}`}
              whileHover={{ scale: 1.2 }}>{t}</motion.div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "pomodoro",
    icon: <Clock size={20} />,
    label: "Focus Timer",
    title: "Deep Work, Built Right In",
    desc: "The built-in Pomodoro timer keeps you in peak flow. Study for 25 minutes, rest, then repeat. Track your sessions, see your focus streak, and unlock achievements as you master the habit.",
    preview: (
      <div className="ft-preview-pomo">
        <div className="pomo-demo-ring">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="4" />
            <motion.circle
              cx="50" cy="50" r="44"
              fill="none" stroke="var(--text)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={276}
              initial={{ strokeDashoffset: 276 }}
              animate={{ strokeDashoffset: 80 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="pomo-demo-label">25:00</div>
        </div>
        <div className="pomo-demo-modes">
          {["Focus", "Short Break", "Long Break"].map((m, i) => (
            <div key={i} className={`pomo-mode ${i === 0 ? "active" : ""}`}>{m}</div>
          ))}
        </div>
      </div>
    )
  }
];

/* ─── Main Component ─── */
export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });
  const heroY = useTransform(scrollY, [0, 500], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.6]);

  const faqs = [
    { q: "Is StarNote really free?", a: "Yes! Our Zen Free plan includes all core features — notes, reader, and basic flashcards — forever. No credit card required." },
    { q: "Can I use StarNote offline?", a: "Your notes sync to the cloud and can be accessed offline in read mode. Annotation and editing requires a connection." },
    { q: "What file types does StarNote support?", a: "We support PDF, DOCX, images (PNG, JPG), and plain text. AI features work best with text-based PDFs." },
    { q: "How does the AI work?", a: "StarNote uses Google Gemini AI to process and understand your documents. Your data is encrypted and never used for model training." },
  ];

  return (
    <div ref={containerRef} className="lp">
      {/* ─── Navbar ─── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate("/")}>
            <div className="lp-logo-icon"><Sparkles size={18} strokeWidth={2.5} /></div>
            <span>StarNote</span>
          </div>

          <div className="lp-navlinks">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#testimonials">Reviews</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="lp-nav-cta">
            <button className="btn-ghost" onClick={() => navigate("/auth")}>Log in</button>
            <button className="btn-solid-sm" onClick={() => navigate("/auth")}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>

          <button className="lp-hamburger" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lp-drawer"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
          >
            {["#features", "#how", "#pricing", "#faq"].map(h => (
              <a key={h} href={h} onClick={() => setMobileOpen(false)}>
                {h.replace("#", "").charAt(0).toUpperCase() + h.replace("#", "").slice(1)}
              </a>
            ))}
            <button className="btn-solid-sm w-full" onClick={() => navigate("/auth")}>Get Started Free</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Hero ─── */}
      <header className="lp-hero">
        <motion.div className="lp-hero-glow" style={{ y: heroY, opacity: heroOpacity }} />
        <motion.div
          className="lp-hero-content"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="lp-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="lp-badge-dot" />
            <Sparkles size={13} />
            StarNote AI 2.0 is now live — smarter, faster, better
          </motion.div>

          <h1 className="lp-hero-title">
            The AI workspace<br />
            <span className="lp-gradient">built for elite students.</span>
          </h1>

          <p className="lp-hero-sub">
            Upload any PDF, get an AI summary, generate flashcards, annotate with an infinite canvas — all in one beautifully focused environment.
          </p>

          <div className="lp-hero-actions">
            <motion.button
              className="btn-hero-primary"
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
            >
              <Play size={18} fill="currentColor" />
              Start for free — no card needed
            </motion.button>
            <a href="#features" className="btn-hero-ghost">
              See how it works <ChevronDown size={16} />
            </a>
          </div>

          <div className="lp-trust">
            {["14-day Pro trial", "Secure & encrypted", "Works on all devices"].map((t, i) => (
              <span key={i}><CheckCircle2 size={14} /> {t}</span>
            ))}
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          className="lp-mockup"
          initial={{ opacity: 0, y: 80, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mockup-chrome">
            <div className="mockup-dots"><span /><span /><span /></div>
            <div className="mockup-url">starnote.app/dashboard</div>
          </div>
          <div className="mockup-body">
            <div className="mockup-side">
              <div className="ms-logo"><Sparkles size={14} /></div>
              {["Home", "Notes", "Reader", "Flashcards", "AI"].map((m, i) => (
                <div key={i} className={`ms-item ${i === 0 ? "active" : ""}`}>
                  <div className="ms-dot" />{m}
                </div>
              ))}
            </div>
            <div className="mockup-main">
              <div className="mm-header">
                <div className="mm-h-line short" />
                <div className="mm-h-line" />
              </div>
              <div className="mm-stats">
                {["🔥 12 Day Streak", "✅ 8 Tasks", "📄 24 Notes", "⏱ 4.2h Focus"].map((s, i) => (
                  <motion.div
                    key={i}
                    className="mm-stat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >{s}</motion.div>
                ))}
              </div>
              <div className="mm-chart">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    className="mm-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.8 + i * 0.06, duration: 0.5 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      {/* ─── Stats ─── */}
      <section className="lp-stats">
        <FadeInView className="lp-stats-inner">
          <Counter end={12000} suffix="+" label="Active students" />
          <div className="stat-div" />
          <Counter end={2400000} suffix="+" label="Notes created" />
          <div className="stat-div" />
          <Counter end={98} suffix="%" label="Satisfaction rate" />
          <div className="stat-div" />
          <Counter end={4} suffix="x" label="Faster studying" />
        </FadeInView>
      </section>

      {/* ─── Interactive Feature Tabs ─── */}
      <section id="features" className="lp-features">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">Features</p>
          <h2>Everything you need to ace exams.</h2>
          <p className="lp-section-sub">Powerful tools designed to minimize friction and maximize focus.</p>
        </FadeInView>

        <div className="lp-feat-tabs">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              className={`lp-feat-tab ${activeFeature === i ? "active" : ""}`}
              onClick={() => setActiveFeature(i)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            className="lp-feat-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="lp-feat-info">
              <h3>{FEATURES[activeFeature].title}</h3>
              <p>{FEATURES[activeFeature].desc}</p>
              <button className="btn-solid-sm" onClick={() => navigate("/auth")}>
                Try it free <ArrowRight size={14} />
              </button>
            </div>
            <div className="lp-feat-preview">
              {FEATURES[activeFeature].preview}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how" className="lp-how">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">Workflow</p>
          <h2>A seamless study workflow.</h2>
          <p className="lp-section-sub">From blank page to A+ in three simple steps.</p>
        </FadeInView>
        <div className="lp-steps">
          {[
            { num: "01", icon: <FileText size={28} />, title: "Upload & Organize", desc: "Drop your PDFs, syllabi, and lecture notes into your workspace. Organize into smart notebooks and folders." },
            { num: "02", icon: <Zap size={28} />, title: "AI Processes It", desc: "Our AI reads the document and instantly generates summaries, flashcards, and key-concept breakdowns." },
            { num: "03", icon: <Target size={28} />, title: "Focus & Master", desc: "Use active recall flashcards and the Pomodoro timer to deeply embed knowledge before your exam." }
          ].map((s, i) => (
            <FadeInView key={i} delay={i * 0.15} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < 2 && <div className="lp-step-arrow"><ArrowRight size={20} /></div>}
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="lp-testimonials">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">Loved by students</p>
          <h2>Join 12,000+ students thriving with StarNote.</h2>
        </FadeInView>
        <div className="lp-testi-grid">
          {[
            { name: "Sarah J.", uni: "Stanford University", avatar: "SJ", text: "StarNote completely changed how I study for finals. The AI flashcard generation alone saved me 20 hours last semester. I went from B's to straight A's." },
            { name: "Michael T.", uni: "MIT", avatar: "MT", text: "The canvas integration with the Pomodoro timer keeps me in a deep flow state. It's the most polished, distraction-free study app I've ever used." },
            { name: "Elena R.", uni: "Oxford", avatar: "ER", text: "I threw away Notion and GoodNotes. Having AI, PDFs, and a minimalist editor all in one place is an absolute game changer for research students." },
            { name: "Aarav M.", uni: "IIT Bombay", avatar: "AM", text: "The AI Tutor feature is brilliant. I can ask it to explain any concept from my uploaded lecture and it gives me a clear, personalised answer instantly." },
            { name: "Liu Y.", uni: "Tsinghua University", avatar: "LY", text: "The dark mode is gorgeous, and the UI is so fast it feels like a native app. My entire study group has switched to StarNote." },
            { name: "Amira K.", uni: "ETH Zürich", avatar: "AK", text: "No other app can take a 100-page document and give me a clean, accurate, structured summary within 5 seconds. StarNote is in a different league." }
          ].map((t, i) => (
            <FadeInView key={i} delay={i * 0.08} className="lp-testi">
              <div className="lp-testi-stars">
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p>"{t.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">{t.avatar}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.uni}</span>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="lp-pricing">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">Pricing</p>
          <h2>Simple, transparent pricing.</h2>
          <p className="lp-section-sub">Invest in your academic success today.</p>
        </FadeInView>
        <div className="lp-pricing-grid">
          <FadeInView delay={0} className="lp-price-card">
            <h3>Zen Free</h3>
            <div className="lp-price"><span>$</span>0<span className="lp-period">/month</span></div>
            <p>Perfect for casual studying.</p>
            <ul>
              {["Up to 50 notes", "10 AI queries/month", "Basic flashcards", "Pomodoro Timer", "PDF Reader"].map(f => (
                <li key={f}><CheckCircle2 size={16} />{f}</li>
              ))}
            </ul>
            <button className="btn-outline-lg" onClick={() => navigate("/auth")}>Get Started Free</button>
          </FadeInView>

          <FadeInView delay={0.1} className="lp-price-card featured">
            <div className="lp-price-badge">Most Popular</div>
            <h3>StarNote Pro</h3>
            <div className="lp-price"><span>$</span>8<span className="lp-period">/month</span></div>
            <p>For elite students who need it all.</p>
            <ul>
              {["Unlimited notes & storage", "Unlimited AI Summaries", "Auto-flashcard generation", "Advanced analytics", "Priority support", "AI Tutor (Chat)"].map(f => (
                <li key={f}><CheckCircle2 size={16} />{f}</li>
              ))}
            </ul>
            <motion.button
              className="btn-solid-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
            >Upgrade to Pro</motion.button>
          </FadeInView>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="lp-faq">
        <FadeInView className="lp-section-header">
          <p className="lp-eyebrow">FAQ</p>
          <h2>Got questions? We've got answers.</h2>
        </FadeInView>
        <div className="lp-faq-list">
          {faqs.map((f, i) => (
            <FadeInView key={i} delay={i * 0.08} className="lp-faq-item">
              <button
                className="lp-faq-q"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              >
                {f.q}
                <motion.span animate={{ rotate: activeFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={20} />
                </motion.span>
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    className="lp-faq-a"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <FadeInView className="lp-cta-banner">
        <h2>Ready to study smarter?</h2>
        <p>Join 12,000+ students already using StarNote.</p>
        <motion.button
          className="btn-hero-primary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/auth")}
        >
          Start for free today <ArrowRight size={18} />
        </motion.button>
      </FadeInView>

      {/* ─── Footer ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo-icon"><Sparkles size={16} /></div>
            <span>StarNote AI</span>
            <p>The AI-native workspace for elite students.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="lp-footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 StarNote Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
