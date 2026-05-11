import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, User, Copy, Check, BookmarkPlus, BrainCircuit,
  Trash2, ArrowUp, Plus, X, AudioLines, Upload, FolderOpen,
  ClipboardPaste, Loader2, PenLine, Globe, Layers, SplitSquareHorizontal,
  MessageSquare, ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { notesService, chatService, aiService } from "../../services/index";
import { detectArtifact } from "./artifactDetector";
import ArtifactRenderer from "./ArtifactRenderer";
import { useAIContext } from "../../context/AIContext";
import "../../styles/ai-split.css";

// ── Typewriter markdown ───────────────────────────────────────────────────────
const TypewriterMarkdown = memo(({ text, delay = 10 }) => {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed(p => p + text[idx]);
        setIdx(p => p + 1);
      }, delay);
      return () => clearTimeout(t);
    }
  }, [idx, delay, text]);
  return <ReactMarkdown>{displayed}</ReactMarkdown>;
});

// ── Voice visualizer ─────────────────────────────────────────────────────────
const VoiceVisualizer = memo(({ volumes }) => (
  <div className="ais-voice-wave">
    {volumes.slice(4, 20).map((vol, i) => (
      <motion.div
        key={i}
        className="ais-voice-bar"
        animate={{ height: vol, opacity: 0.5 + (vol / 56) * 0.5 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
      />
    ))}
  </div>
));

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = memo(({ msg, index, isLast, onCopy, onSave, onQuiz, onArtifact, copiedIdx, savedIdx }) => {
  const isAI = msg.role === "ai";

  return (
    <motion.div
      className={`ais-msg ${isAI ? "ais-msg--ai" : "ais-msg--user"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {isAI && (
        <div className="ais-msg-avatar">
          <Sparkles size={13} strokeWidth={2.5} />
        </div>
      )}
      <div className="ais-msg-body">
        {isAI && (
          <span className="ais-msg-sender">StarNote AI</span>
        )}
        <div className="ais-msg-content">
          {isAI ? (
            isLast ? (
              <TypewriterMarkdown text={msg.text} />
            ) : (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            )
          ) : (
            <p>{msg.text}</p>
          )}
        </div>
        {isAI && (
          <div className="ais-msg-actions">
            <button
              className={`ais-action-btn ${copiedIdx === index ? "active" : ""}`}
              onClick={() => onCopy(msg.text, index)}
              title="Copy"
            >
              {copiedIdx === index ? <Check size={13} /> : <Copy size={13} />}
              {copiedIdx === index ? "Copied" : "Copy"}
            </button>
            <button
              className={`ais-action-btn ${savedIdx === index ? "active" : ""}`}
              onClick={() => onSave(msg.text, index)}
              title="Save as note"
            >
              <BookmarkPlus size={13} />
              {savedIdx === index ? "Saved" : "Save"}
            </button>
            <button
              className="ais-action-btn"
              onClick={() => onQuiz(msg.text)}
              title="Generate quiz"
            >
              <BrainCircuit size={13} />
              Quiz
            </button>
            <button
              className="ais-action-btn"
              onClick={() => onArtifact(msg.text)}
              title="Open in artifact pane"
            >
              <SplitSquareHorizontal size={13} />
              Artifact
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ── Thinking indicator ────────────────────────────────────────────────────────
const ThinkingIndicator = () => (
  <motion.div
    className="ais-msg ais-msg--ai"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="ais-msg-avatar">
      <Sparkles size={13} className="spin" />
    </div>
    <div className="ais-msg-body">
      <span className="ais-msg-sender">StarNote AI</span>
      <div className="ais-thinking">
        <span /><span /><span />
      </div>
    </div>
  </motion.div>
);

// ── Artifact empty pane ───────────────────────────────────────────────────────
const ArtifactEmpty = () => (
  <div className="ais-artifact-empty">
    <div className="ais-artifact-empty-icon">
      <Layers size={36} strokeWidth={1.2} />
    </div>
    <p className="ais-artifact-empty-title">Artifacts appear here</p>
    <p className="ais-artifact-empty-desc">
      When AI generates flashcards, study plans, quizzes, code, or diagrams,
      they will render here automatically.
    </p>
    <div className="ais-artifact-hints">
      <span>Try: "Generate 10 flashcards on Python basics"</span>
      <span>Try: "Create a 7-day study schedule for exams"</span>
      <span>Try: "Write a quiz on Newton's laws"</span>
    </div>
  </div>
);

// ── Welcome screen ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: <Sparkles size={16} />,     label: "Summarize",    prompt: "Summarize the key concepts I should know about this topic in a clear, structured way." },
  { icon: <Layers size={16} />,       label: "Flashcards",   prompt: "Generate 10 flashcards with Q: and A: format on a topic of my choice." },
  { icon: <BrainCircuit size={16} />, label: "Explain",      prompt: "Explain this concept step by step like I am a beginner:" },
  { icon: <PenLine size={16} />,      label: "Study Plan",   prompt: "Create a structured 7-day study plan for my upcoming exam. Include daily topics, goals, and breaks." },
  { icon: <Globe size={16} />,        label: "Quiz me",      prompt: "Generate a 5-question quiz (multiple choice) to test my knowledge on:" },
  { icon: <ChevronRight size={16} />, label: "Outline",      prompt: "Create a detailed study outline for:" },
];

const WelcomeScreen = ({ onSend }) => (
  <div className="ais-welcome">
    <motion.div
      className="ais-welcome-hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ais-welcome-icon">
        <Sparkles size={28} strokeWidth={1.8} />
      </div>
      <h1 className="ais-welcome-title">How can I help you study?</h1>
      <p className="ais-welcome-sub">Ask anything, generate flashcards, create study plans, or get instant explanations.</p>
    </motion.div>

    <motion.div
      className="ais-quick-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      {QUICK_ACTIONS.map((action, i) => (
        <motion.button
          key={i}
          className="ais-quick-card"
          onClick={() => onSend(action.prompt)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <span className="ais-quick-icon">{action.icon}</span>
          <span className="ais-quick-label">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  </div>
);

// ── Main AISplit Component ────────────────────────────────────────────────────
export default function AISplit() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [savedIdx, setSavedIdx] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [artifactSource, setArtifactSource] = useState(null); // message index that produced current artifact
  const [showArtifact, setShowArtifact] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceVolumes, setVoiceVolumes] = useState(new Array(20).fill(6));
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const isListeningRef = useRef(false);
  const chatEndRef = useRef(null);
  const messagesEndRef = useRef(null); // Ref for the messages container
  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);
  const location = useLocation();
  const contextData = useAIContext();

  // Load chat history
  useEffect(() => {
    chatService.getLatest()
      .then(res => {
        if (res.data.session?.messages?.length) {
          setMessages(res.data.session.messages);
          // Auto-detect artifact from last AI message
          const last = [...res.data.session.messages].reverse().find(m => m.role === "ai");
          if (last) {
            const detected = detectArtifact(last.text);
            if (detected) { setArtifact(detected); setShowArtifact(true); }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Handle navigation-initiated messages (from Command Palette)
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-scroll logic: Target the message container specifically to avoid page-level jumps
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current;
      // Use requestAnimationFrame to ensure the DOM has updated before scrolling
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      });
    }
    // Defensively ensure the window hasn't jumped
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }, [messages, loading]);

  // Close plus menu on outside click
  useEffect(() => {
    if (!showPlusMenu) return;
    const h = (e) => { if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setShowPlusMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showPlusMenu]);

  // Voice recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) setInput(p => p + e.results[i][0].transcript + " ");
      }
    };
    rec.onend = () => { if (isListeningRef.current) { try { rec.start(); } catch {} } };
    rec.onerror = (e) => { if (e.error !== "no-speech") { setIsListening(false); stopAudio(); } };
    recognitionRef.current = rec;
  }, []);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      audioCtxRef.current = ctx; analyserRef.current = analyser; sourceRef.current = src;
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        setVoiceVolumes(Array.from({ length: 20 }, (_, i) => 4 + (data[Math.abs(i - 10)] / 255) * 44));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  };

  const stopAudio = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) { sourceRef.current.mediaStream?.getTracks().forEach(t => t.stop()); sourceRef.current.disconnect(); }
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null; analyserRef.current = null; sourceRef.current = null;
    setVoiceVolumes(new Array(20).fill(4));
  };

  const toggleVoice = async () => {
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      stopAudio();
      setIsListening(false);
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      try { recognitionRef.current?.start(); await startAudio(); } catch {}
    }
  };

  // File upload handler
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowPlusMenu(false);
    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        const truncated = content.length > 2000 ? content.slice(0, 2000) + "..." : content;
        setInput(`Here's the content of ${file.name}:\n\n${truncated}\n\nPlease summarize and explain the key points.`);
        textareaRef.current?.focus();
      };
      reader.readAsText(file);
    } else {
      setInput(`I've uploaded a file: ${file.name}. Please help me analyze it.`);
      textareaRef.current?.focus();
    }
    e.target.value = "";
  };

  // Send message
  const handleSend = useCallback(async (customInput) => {
    const text = (customInput || input).trim();
    if (!text || loading) return;

    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    chatService.sendMessage("user", text).catch(() => {});

    try {
      await new Promise(r => setTimeout(r, 300));
      const allMessages = [...messages, userMsg];
      
      const res = await aiService.chat(allMessages, { 
        currentPage: "ai",
        ...contextData
      });
      
      const aiText = res.data.data.text;
      const aiMsg = { role: "ai", text: aiText };
      const msgIndex = allMessages.length; // index of this AI message

      setMessages(prev => [...prev, aiMsg]);
      chatService.sendMessage("ai", aiText).catch(() => {});

      // Auto-detect artifact
      const detected = detectArtifact(aiText);
      if (detected) {
        setArtifact(detected);
        setArtifactSource(msgIndex);
        setShowArtifact(true);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "I had a brief connection issue. Please try again — I'm here to help!",
      }]);
    }

    setLoading(false);
  }, [input, loading, messages, isListening]);

  const handleCopy = async (text, idx) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSave = async (text, idx) => {
    try {
      await notesService.create({
        name: "AI Note — " + new Date().toLocaleDateString(),
        icon: "🧠", category: "general", fileType: "text", content: text,
      });
      setSavedIdx(idx);
      setTimeout(() => setSavedIdx(null), 2000);
      toast.success("Saved to Notes");
    } catch { toast.error("Failed to save note."); }
  };

  const handleQuiz = (text) => handleSend(`Please generate a short quiz (3-5 questions, MCQ + short answer) based on:\n"${text.slice(0, 400)}"`);

  const handleManualArtifact = (text) => {
    const detected = detectArtifact(text) || { type: "markdown", content: text };
    setArtifact(detected);
    setShowArtifact(true);
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const hasMessages = messages.length > 0;
  const showSplit = showArtifact && artifact;

  const plusItems = [
    { icon: <Upload size={16} />, label: "Upload file", action: () => fileInputRef.current?.click() },
    {
      icon: <FolderOpen size={16} />, label: "Browse Notes", action: async () => {
        try {
          const res = await notesService.getAll();
          const names = (res.data.notes || []).map(n => n.name).join(", ");
          if (names) { setInput(`I have these notes: ${names}. Help me study them.`); textareaRef.current?.focus(); }
          else toast.info("No notes found yet.");
        } catch { toast.error("Failed to load notes."); }
        setShowPlusMenu(false);
      }
    },
    {
      icon: <ClipboardPaste size={16} />, label: "Paste text", action: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) setInput(p => p + text);
        } catch { toast.error("Clipboard access denied. Please paste manually."); }
        setShowPlusMenu(false);
      }
    },
  ];

  return (
    <div className={`ais-root ${showSplit ? "ais-root--split" : ""}`}>
      {/* ══ LEFT PANE — Conversation ══════════════════════════════════════ */}
      <div className="ais-chat-pane">
        {/* Minimal Chat Pane (No Header) */}

        {/* Messages */}
        <div className="ais-messages" ref={messagesEndRef}>
          {!hasMessages ? (
            <WelcomeScreen onSend={handleSend} />
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    msg={msg}
                    index={i}
                    isLast={i === messages.length - 1 && msg.role === "ai"}
                    onCopy={handleCopy}
                    onSave={handleSave}
                    onQuiz={handleQuiz}
                    onArtifact={handleManualArtifact}
                    copiedIdx={copiedIdx}
                    savedIdx={savedIdx}
                  />
                ))}
              </AnimatePresence>
              {loading && <ThinkingIndicator />}
              <div ref={chatEndRef} style={{ height: 1 }} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="ais-input-area">
          <input ref={fileInputRef} type="file" className="ais-file-hidden"
            accept=".txt,.md,.pdf,image/*" onChange={handleFile} />

          <div className="ais-input-shell">
            {/* Plus menu */}
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  className="ais-plus-menu"
                  ref={plusMenuRef}
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  {plusItems.map((item, i) => (
                    <button key={i} className="ais-plus-item" onClick={item.action}>
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`ais-input-pill ${isListening ? "listening" : ""}`}>
              {isListening ? (
                <div className="ais-listening-row">
                  <button className="ais-pill-btn dimmed"><Plus size={18} /></button>
                  <VoiceVisualizer volumes={voiceVolumes} />
                  <div className="ais-listening-actions">
                    <button className="ais-pill-btn" onClick={toggleVoice}><X size={17} /></button>
                    <button className="ais-send-btn active" onClick={() => handleSend()}><ArrowUp size={18} strokeWidth={2.5} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    className={`ais-pill-btn ${showPlusMenu ? "active" : ""}`}
                    onClick={() => setShowPlusMenu(v => !v)}
                    title="Attach"
                  >
                    {showPlusMenu ? <X size={18} /> : <Plus size={18} />}
                  </button>

                  <textarea
                    ref={textareaRef}
                    className="ais-input"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    rows={1}
                    spellCheck={false}
                  />

                  <div className="ais-pill-right">
                    {!input.trim() ? (
                      <button className="ais-send-btn idle" onClick={toggleVoice} title="Voice input">
                        <AudioLines size={18} />
                      </button>
                    ) : (
                      <button className="ais-send-btn active" onClick={() => handleSend()} disabled={loading}>
                        {loading ? <Loader2 size={17} className="spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <p className="ais-input-hint">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANE — Artifact ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showSplit && (
          <motion.div
            className="ais-artifact-pane"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "var(--artifact-width, 48%)" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ais-artifact-header">
              <div className="ais-artifact-header-left">
                <MessageSquare size={14} strokeWidth={2} />
                <span>Artifact</span>
              </div>
              <button
                className="ais-header-btn"
                onClick={() => setShowArtifact(false)}
                title="Close artifact"
              >
                <X size={14} />
              </button>
            </div>

            <div className="ais-artifact-scroll">
              <AnimatePresence mode="wait">
                {artifact ? (
                  <ArtifactRenderer key={artifact.type + artifact.content?.slice(0, 20)} artifact={artifact} />
                ) : (
                  <ArtifactEmpty />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
