/**
 * KnowledgeNetwork.jsx — Smooth 60fps knowledge graph animation.
 * prop: hero (bool) — when true, renders as full-screen hero with text overlay
 *                     when false, renders as standalone section
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Modes ─────────────────────────────────────────────── */
const MODES = [
  { id:"focus",    label:"Focus",    icon:"🎯",
    bg:["#090d1a","#0c1426","#09112e"],
    accent:"#3b82f6", secondary:"#1e40af",
    glow:"rgba(59,130,246,0.14)",  speed:0.28, connAlpha:0.22, desc:"Calm · Reading" },
  { id:"learning", label:"Learning", icon:"📚",
    bg:["#0d0a1e","#130d2a","#0a0e22"],
    accent:"#8b5cf6", secondary:"#3b82f6",
    glow:"rgba(139,92,246,0.17)",  speed:0.55, connAlpha:0.38, desc:"Active · Connecting" },
  { id:"ai",       label:"AI Tutor", icon:"🤖",
    bg:["#050e1a","#091520","#050f1c"],
    accent:"#06b6d4", secondary:"#8b5cf6",
    glow:"rgba(6,182,212,0.19)",   speed:0.75, connAlpha:0.46, desc:"Neural · Network" },
  { id:"revision", label:"Revision", icon:"🔁",
    bg:["#090f0a","#0c1a10","#080f10"],
    accent:"#10b981", secondary:"#6ee7b7",
    glow:"rgba(16,185,129,0.17)",  speed:1.1,  connAlpha:0.42, desc:"Sharp · Recall" },
  { id:"exam",     label:"Exam",     icon:"⚡",
    bg:["#180a0a","#1e0d0a","#1a0808"],
    accent:"#f59e0b", secondary:"#ef4444",
    glow:"rgba(239,68,68,0.19)",   speed:1.9,  connAlpha:0.52, desc:"Urgent · Energy" },
  { id:"night",    label:"Night",    icon:"🌙",
    bg:["#060608","#08080d","#060609"],
    accent:"#a78bfa", secondary:"#818cf8",
    glow:"rgba(167,139,250,0.10)", speed:0.18, connAlpha:0.18, desc:"Dark · Soft glow" },
];

const NODE_TYPES = [
  { type:"notes",     emoji:"📝", label:"Notes",      color:"#60a5fa", size:16 },
  { type:"pdf",       emoji:"📄", label:"PDF",         color:"#34d399", size:18 },
  { type:"flashcard", emoji:"🃏", label:"Flashcard",   color:"#f472b6", size:15 },
  { type:"quiz",      emoji:"❓", label:"Quiz",        color:"#fb923c", size:15 },
  { type:"ai",        emoji:"🤖", label:"AI Tutor",    color:"#22d3ee", size:18 },
  { type:"plan",      emoji:"📅", label:"Study Plan",  color:"#a78bfa", size:16 },
];

const TAU  = Math.PI * 2;
const lerp = (a,b,t) => a+(b-a)*t;
const dist = (x1,y1,x2,y2) => Math.sqrt((x2-x1)**2+(y2-y1)**2);
function hex2rgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
const rgba = (hex,a) => { const [r,g,b]=hex2rgb(hex); return `rgba(${r},${g},${b},${a.toFixed(3)})`; };

function buildNodes(W, H) {
  const count = Math.min(18, Math.max(8, Math.floor((W*H)/40000)));
  const nodes = [];
  for (let i=0; i<count; i++) {
    const t = NODE_TYPES[i%NODE_TYPES.length];
    nodes.push({ ...t, id:i,
      x: 40 + Math.random()*(W-80), 
      y: 40 + Math.random()*(H-80),
      vx:(Math.random()-.5)*0.3, vy:(Math.random()-.5)*0.3,
      sx:0, sy:0, pulseOff:Math.random()*TAU,
      glowI:Math.random(), glowD:Math.random()>.5?1:-1,
      depth:0.4+Math.random()*0.4,
    });
  }
  return nodes;
}

function buildParticles(W, H, count) {
  return Array.from({length:count}, (_,i) => ({
    id:i, x:Math.random()*W, y:Math.random()*H,
    vx:(Math.random()-.5)*0.5, vy:(Math.random()-.5)*0.5,
    r:0.8+Math.random()*1.8, depth:Math.random(),
  }));
}

/* ── Main ── */
export default function KnowledgeNetwork({ hero = false }) {
  const canvasRef = useRef(null);
  const sRef = useRef({
    nodes:[], particles:[], ripples:[],
    mouse:{x:-9999,y:-9999},
    mode:0, time:0, raf:null, visible:true, reduced:false,
  });
  const [activeMode, setActiveMode] = useState(0);
  const [open,       setOpen]       = useState(false);
  const [hoverMode,  setHoverMode]  = useState(null);

  /* ── animation loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s   = sRef.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    let W=0, H=0, prevT=performance.now();

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      const dpr = Math.min(devicePixelRatio,2);
      canvas.width  = Math.round(W*dpr);
      canvas.height = Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      s.nodes     = buildNodes(W,H);
      s.particles = buildParticles(W,H,Math.min(50,Math.floor(W*H/12000)));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    const io = new IntersectionObserver(([e]) => { s.visible=e.isIntersecting; });
    io.observe(canvas);

    const draw = (now) => {
      s.raf = requestAnimationFrame(draw);
      if (!s.visible) { prevT=now; return; }
      const dt = Math.min((now-prevT)*0.001, 0.05);
      prevT = now; s.time += dt;

      const m   = MODES[s.mode];
      const mx  = s.mouse.x, my = s.mouse.y;
      const spd = m.speed;

      // Background
      const bg = ctx.createRadialGradient(W/2,H*.45,0, W/2,H*.45,Math.max(W,H)*.72);
      bg.addColorStop(0,m.bg[0]); bg.addColorStop(.5,m.bg[1]); bg.addColorStop(1,m.bg[2]);
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      if (!s.reduced) {
        const cg = ctx.createRadialGradient(W/2,H*.44,0, W/2,H*.44,W*.48);
        cg.addColorStop(0,m.glow); cg.addColorStop(1,"transparent");
        ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      }

      // Particles — batched
      if (!s.reduced) {
        ctx.beginPath();
        for (const p of s.particles) {
          p.x+=p.vx*spd*dt*60; p.y+=p.vy*spd*dt*60;
          if(p.x<0)p.x=W; if(p.x>W)p.x=0;
          if(p.y<0)p.y=H; if(p.y>H)p.y=0;
          const dx=p.x-mx, dy=p.y-my, d=Math.sqrt(dx*dx+dy*dy)||1;
          if(d<80){p.vx+=dx/d*.12; p.vy+=dy/d*.12;}
          p.vx*=.992; p.vy*=.992;
          const pr=p.r*(.4+p.depth*.6);
          ctx.moveTo(p.x+pr,p.y); ctx.arc(p.x,p.y,pr,0,TAU);
        }
        ctx.fillStyle=rgba(m.accent,m.connAlpha*1.2); ctx.fill();
      }

      // Update nodes
      for (const node of s.nodes) {
        if(s.reduced) continue;
        const dm=dist(node.x,node.y,mx,my);
        if(dm<200&&dm>0){const f=(1-dm/200)*.7; node.sx+=(mx-node.x)/dm*f*.055*dt*60; node.sy+=(my-node.y)/dm*f*.055*dt*60;}
        for (const o of s.nodes) {
          if(o.id===node.id) continue;
          const d=dist(node.x,node.y,o.x,o.y);
          if(d<85&&d>0){const f=(85-d)/85*.14; node.sx-=(o.x-node.x)/d*f; node.sy-=(o.y-node.y)/d*f;}
        }
        node.sx*=.86; node.sy*=.86;
        node.vx+=(Math.random()-.5)*.018*spd; node.vy+=(Math.random()-.5)*.018*spd;
        node.vx*=.97; node.vy*=.97;
        const toCx=(W/2-node.x)*.0004, toCy=(H/2-node.y)*.0004;
        node.x+=(node.vx+node.sx+toCx)*spd*dt*60;
        node.y+=(node.vy+node.sy+toCy)*spd*dt*60;
        if(node.x<56)node.vx+=.12; if(node.x>W-56)node.vx-=.12;
        if(node.y<56)node.vy+=.12; if(node.y>H-56)node.vy-=.12;
        node.glowI+=node.glowD*.007*spd;
        if(node.glowI>1){node.glowI=1;node.glowD=-1;} if(node.glowI<.3){node.glowI=.3;node.glowD=1;}
      }

      // Connections
      const maxD=Math.min(W,H)*.46;
      for(let i=0;i<s.nodes.length;i++) for(let j=i+1;j<s.nodes.length;j++){
        const n1=s.nodes[i],n2=s.nodes[j];
        const d=dist(n1.x,n1.y,n2.x,n2.y); if(d>maxD) continue;
        const fade=1-d/maxD;
        const near=Math.min(dist(n1.x,n1.y,mx,my),dist(n2.x,n2.y,mx,my))<160;
        const str=near?1.75:1, alpha=fade*m.connAlpha*str;
        const cpx=(n1.x+n2.x)/2+(n1.y-n2.y)*.07, cpy=(n1.y+n2.y)/2+(n2.x-n1.x)*.07;
        const lg=ctx.createLinearGradient(n1.x,n1.y,n2.x,n2.y);
        lg.addColorStop(0,rgba(n1.color,alpha)); lg.addColorStop(.5,rgba(m.accent,alpha*1.35)); lg.addColorStop(1,rgba(n2.color,alpha));
        ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.quadraticCurveTo(cpx,cpy,n2.x,n2.y);
        ctx.strokeStyle=lg; ctx.lineWidth=fade*str*1.4; ctx.stroke();
        if(str>1.2&&!s.reduced){
          const t=(s.time*spd*.4)%1;
          const px=lerp(lerp(n1.x,cpx,t),lerp(cpx,n2.x,t),t);
          const py=lerp(lerp(n1.y,cpy,t),lerp(cpy,n2.y,t),t);
          ctx.beginPath(); ctx.arc(px,py,2.5,0,TAU);
          ctx.fillStyle=rgba(m.accent,alpha*2.8); ctx.fill();
        }
      }

      // Ripples
      s.ripples=s.ripples.filter(rip=>{
        const age=(s.time-rip.t)/1; if(age>=1) return false;
        ctx.beginPath(); ctx.arc(rip.x,rip.y,age*210,0,TAU);
        ctx.strokeStyle=rgba(m.accent,(1-age)*.28); ctx.lineWidth=1.5; ctx.stroke();
        return true;
      });

      // Nodes
      for (const node of s.nodes) {
        const dm=dist(node.x,node.y,mx,my), hov=dm<110;
        const pulse=.75+.25*Math.sin(s.time*3.5+node.pulseOff);
        const base=node.size*(hov?1.28:1)*pulse*node.depth;
        const isAI=node.type==="ai"&&s.mode===2;

        const gr=ctx.createRadialGradient(node.x,node.y,0, node.x,node.y,base*(isAI?3.8:2.6));
        gr.addColorStop(0,rgba(node.color,.32*(hov?1.6:1)));
        gr.addColorStop(.5,rgba(m.accent,.10)); gr.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(node.x,node.y,base*(isAI?3.8:2.6),0,TAU); ctx.fillStyle=gr; ctx.fill();

        if(isAI){
          const rr=base*2.1;
          ctx.beginPath(); ctx.arc(node.x,node.y,rr,0,TAU);
          ctx.strokeStyle=rgba(m.accent,.32); ctx.lineWidth=.9; ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
          const oa=s.time*1.2;
          ctx.beginPath(); ctx.arc(node.x+Math.cos(oa)*rr,node.y+Math.sin(oa)*rr,2.5,0,TAU);
          ctx.fillStyle=rgba(m.accent,.85); ctx.fill();
        }

        const ng=ctx.createRadialGradient(node.x-base*.2,node.y-base*.2,0, node.x,node.y,base);
        ng.addColorStop(0,rgba(node.color,.95)); ng.addColorStop(.7,rgba(node.color,.78)); ng.addColorStop(1,rgba(m.accent,.62));
        ctx.beginPath(); ctx.arc(node.x,node.y,base,0,TAU); ctx.fillStyle=ng; ctx.fill();
        ctx.beginPath(); ctx.arc(node.x,node.y,base,0,TAU);
        ctx.strokeStyle=rgba(node.color,hov?.92:.42); ctx.lineWidth=hov?2:.9; ctx.stroke();

        ctx.font=`${Math.round(base*1.08)}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(node.emoji,node.x,node.y);
        if(hov){
          ctx.font="bold 12px -apple-system,'Inter',sans-serif";
          ctx.textBaseline="top"; ctx.fillStyle=rgba(node.color,.92);
          ctx.fillText(node.label,node.x,node.y+base+10);
        }
      }

      // Cursor halo
      if(mx>0&&mx<W&&!s.reduced){
        const h=ctx.createRadialGradient(mx,my,0,mx,my,58);
        h.addColorStop(0,rgba(m.accent,.11)); h.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(mx,my,58,0,TAU); ctx.fillStyle=h; ctx.fill();
      }
    };

    s.raf=requestAnimationFrame(draw);
    return ()=>{ cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect(); };
  }, []); // eslint-disable-line

  /* ── Mouse events ── */
  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const s=sRef.current;
    const onMove=(e)=>{ const r=canvas.getBoundingClientRect(),src=e.touches?.[0]??e; s.mouse.x=src.clientX-r.left; s.mouse.y=src.clientY-r.top; };
    const onClick=(e)=>{ const r=canvas.getBoundingClientRect(); s.ripples.push({x:e.clientX-r.left,y:e.clientY-r.top,t:s.time}); if(s.ripples.length>6)s.ripples.shift(); };
    const onLeave=()=>{ s.mouse.x=s.mouse.y=-9999; };
    canvas.addEventListener("mousemove",onMove,{passive:true});
    canvas.addEventListener("touchmove",onMove,{passive:true});
    canvas.addEventListener("click",onClick);
    canvas.addEventListener("mouseleave",onLeave);
    return ()=>{ canvas.removeEventListener("mousemove",onMove); canvas.removeEventListener("touchmove",onMove); canvas.removeEventListener("click",onClick); canvas.removeEventListener("mouseleave",onLeave); };
  }, []);

  const switchMode = useCallback((i) => { sRef.current.mode=i; setActiveMode(i); setOpen(false); }, []);
  const cur = MODES[activeMode];

  /* ── Shared UI ── */
  const ModeSwitcher = (
    <motion.div className="kn-switcher"
      initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{duration:.8, delay:.3, ease:[.22,1,.36,1]}}
    >
      <motion.button className="kn-switch-btn" onClick={()=>setOpen(v=>!v)}
        whileHover={{scale:1.04}} whileTap={{scale:.96}} style={{"--accent":cur.accent}}>
        <span>{cur.icon}</span>
        <span className="kn-switch-label">{cur.label}</span>
        <motion.span className="kn-switch-caret" animate={{rotate:open?180:0}} transition={{duration:.2}}>▼</motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="kn-panel"
            initial={{opacity:0,y:8,scale:.95}} animate={{opacity:1,y:0,scale:1}}
            exit={{opacity:0,y:8,scale:.95}} transition={{duration:.17,ease:[.22,1,.36,1]}}>
            <p className="kn-panel-title">Study Mode</p>
            {MODES.map((m,i)=>(
              <motion.button key={m.id} className={`kn-mode-item${activeMode===i?" active":""}`}
                onClick={()=>switchMode(i)} onMouseEnter={()=>setHoverMode(i)} onMouseLeave={()=>setHoverMode(null)}
                whileHover={{x:4}} style={{"--accent":m.accent}}>
                <span className="kn-mi-icon">{m.icon}</span>
                <span className="kn-mi-info">
                  <span className="kn-mi-name">{m.label}</span>
                  <span className="kn-mi-desc">{m.desc}</span>
                </span>
                {activeMode===i && <span className="kn-mi-check">✓</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const DotBar = (
    <motion.div className="kn-dots"
      initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.8, delay:0.4, ease:[.22,1,.36,1]}}
    >
      {MODES.map((m,i)=>(
        <motion.button key={m.id} className={`kn-dot${activeMode===i?" active":""}`}
          title={m.label} onClick={()=>switchMode(i)}
          whileHover={{scale:1.4}} whileTap={{scale:.85}} style={{"--acc":m.accent}} />
      ))}
    </motion.div>
  );

  const ModeBadge = (
    <AnimatePresence mode="wait">
      <motion.div key={activeMode} className="kn-mode-badge"
        initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
        exit={{opacity:0,y:-8}} transition={{duration:.2}} style={{"--accent":cur.accent}}>
        <span className="kn-badge-live"/>
        <span>{cur.icon} {cur.label}</span>
        <span className="kn-badge-desc">— {cur.desc}</span>
      </motion.div>
    </AnimatePresence>
  );

  const Legend = (
    <div className="kn-legend">
      {NODE_TYPES.map(t=>(
        <div key={t.type} className="kn-legend-item">
          <span className="kn-legend-dot" style={{background:t.color,boxShadow:`0 0 6px ${t.color}`}}/>
          <span className="kn-legend-emoji">{t.emoji}</span>
          <span className="kn-legend-label">{t.label}</span>
        </div>
      ))}
    </div>
  );

  const Hint = <p className="kn-hint"><span>🖱</span> Move cursor to attract nodes &nbsp;·&nbsp; Click to send ripples</p>;

  /* ─── HERO layout ─── */
  if (hero) {
    return (
      <header className="kn-hero">
        <canvas ref={canvasRef} className="kn-hero-canvas" />

        {/* Centre overlay text */}
        <div className="kn-hero-overlay">
          <motion.div
            initial={{opacity:0,y:36}} animate={{opacity:1,y:0}}
            transition={{duration:.72,ease:[.22,1,.36,1]}}
          >
            <motion.div className="kn-hero-content"
              animate={{y:[0,-6,0]}} transition={{duration:6, repeat:Infinity, ease:"easeInOut"}}
            >

            <motion.div className="kn-hero-badge"
              initial={{opacity:0,scale:.82}} animate={{opacity:1,scale:1}}
              transition={{delay:.18}} style={{"--accent":cur.accent}}>
              <span className="kn-badge-live"/>
              ✦ Live knowledge network &nbsp;—&nbsp; {cur.desc}
            </motion.div>

            <h1 className="kn-hero-title">
              Learn smarter with<br/>
              <span className="kn-hero-gradient" style={{"--a":cur.accent,"--b":cur.secondary}}>
                AI-powered knowledge
              </span>
            </h1>

            <p className="kn-hero-sub">
              Every note, PDF, and flashcard becomes a living node in your personal
              learning universe. Watch it breathe — then start studying.
            </p>

            <div className="kn-hero-actions">
              <motion.a href="/auth" className="kn-cta-primary"
                whileHover={{scale:1.04,boxShadow:"0 20px 48px rgba(0,0,0,.45)"}}
                whileTap={{scale:.97}}>
                ▶ Start for free — no card needed
              </motion.a>
              <a href="#features" className="kn-cta-ghost">See features ↓</a>
            </div>

            <div className="kn-hero-trust">
              {["14-day Pro trial","Encrypted & private","Works on all devices"].map((t,i)=>(
                <span key={i}>✓ {t}</span>
              ))}
            </div>
          </motion.div>
          </motion.div>
        </div>

        {Legend}
        {Hint}
        {ModeSwitcher}
        {DotBar}
        {ModeBadge}
      </header>
    );
  }

  /* ─── Section layout ─── */
  return (
    <div className="kn-root">
      <div className="kn-stats">
        {[
          {val:"12,000+",sub:"active students"},
          {val:"2.4M+",  sub:"notes processed"},
          {val:"99.95%", sub:"platform uptime"},
          {val:"4×",     sub:"faster studying"},
        ].map((s,i)=>(
          <div key={i} className="kn-stat">
            <span className="kn-stat-val">{s.val}</span>
            <span className="kn-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>
      <div className="kn-wrap">
        <canvas ref={canvasRef} className="kn-canvas"/>
        {Legend}
        {Hint}
        {ModeSwitcher}
        {DotBar}
        {ModeBadge}
      </div>
    </div>
  );
}
