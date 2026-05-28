import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Copy, Check, BookmarkPlus, BrainCircuit,
  Trash2, ArrowUp, Plus, X, FolderOpen,
  PenLine, Globe, Layers, SplitSquareHorizontal,
  MessageSquare, ChevronRight, MessageSquarePlus, PanelLeft,
  ChevronDown, Search, Square, Mic, Paperclip, FileText, Image as ImageIcon,
  Volume2, VolumeX, Maximize, Minimize, Link2, FileStack, ListChecks,
  Loader2, Languages, LayoutTemplate, History, Flame, Award,
  MoreHorizontal, GripVertical
} from "lucide-react";

const MODEL_OPTIONS = [
  { id: "gemini", name: "Gemini 1.5 Pro", short: "Gemini", desc: "Fast & reliable for general tasks" },
  { id: "claude", name: "Claude 3.5 Sonnet", short: "Claude", desc: "Advanced reasoning & coding" },
  { id: "groq", name: "Llama 3.3 (Groq)", short: "Groq", desc: "Lightning fast responses" },
  { id: "openrouter", name: "Llama 3.3 (OpenRouter)", short: "OpenRouter", desc: "High quality instruct model" },
];

const IconSlot = ({ children, size = 14 }) => (
  <span className="ais-icon-slot" style={{ width: size, height: size }} aria-hidden>
    {children}
  </span>
);
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useLocation, useSearchParams } from "react-router-dom";
import { notesService, chatService, aiService, flashcardsService } from "../../services/index";
import { detectArtifact, parseFlashcards } from "./artifactDetector";
import ArtifactRenderer from "./ArtifactRenderer";
import ContextNotePicker from "../../components/ContextNotePicker";
import { useAIContext } from "../../context/AIContext";
import StreamingText from "../../components/StreamingText";
import { useHotkeys } from "../../hooks/useHotkeys";
import { AI_PROMPT_TEMPLATES, AI_LANGUAGES } from "../../constants/promptTemplates";
import {
  getStreak, getXP, recordAIStudySession, recordChatQuestion,
  recordTTSListen, hasVoiceGuruBadge
} from "../../utils/studyGamification";
import "../../styles/ai-split.css";

const LANG_STORAGE_KEY = "starNote_aiLanguage";


// ── Premium Siri-Style Voice Visualizer ──────────────────────────────────────────
const VoiceVisualizer = memo(({ volumes }) => {
  // Average the recent volumes for a smooth orb scale
  const recentVols = volumes.slice(0, 10);
  const avgVol = recentVols.length ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length : 0;
  // Map volume (0-60 approx) to a scale factor (1 to 1.6)
  const scale = 1 + Math.min(avgVol / 60, 0.6);

  return (
    <div className="siri-orb-container">
      <motion.div 
        className="siri-orb-core"
        animate={{ scale }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <div className="orb-blur orb-red" />
        <div className="orb-blur orb-blue" />
        <div className="orb-blur orb-purple" />
      </motion.div>
    </div>
  );
});

function displayText(msg, summarizeMap) {
  const sum = summarizeMap?.[msg._idx];
  if (sum?.showSummary && sum.summary) return sum.summary;
  return msg.text;
}

function hasListOrFlashcards(text) {
  if (!text || text.length < 80) return false;
  return parseFlashcards(text).length > 0 || /^[\s]*[-*•]\s/m.test(text) || /^\d+[\.\)]\s/m.test(text);
}

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = memo(({
  msg, index, isLast, isStreaming, onCopy, onSave, onQuiz, onArtifact, onSpeak,
  onSummarize, onFlashcards, onRestoreVersion, copiedIdx, savedIdx, speakingIdx,
  summarizingIdx, summarizeMap, showHistoryFor, setShowHistoryFor,
  moreMenuIdx, setMoreMenuIdx,
}) => {
  const isAI = msg.role === "ai";
  const text = displayText({ ...msg, _idx: index }, summarizeMap);
  const sum = summarizeMap?.[index];
  const versions = msg.versions || [];
  const showHistory = showHistoryFor === index;

  return (
    <motion.div
      className={`ais-msg ${isAI ? "ais-msg--ai" : "ais-msg--user"} ${speakingIdx === index ? "ais-msg--speaking" : ""}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      tabIndex={0}
      role="article"
      aria-label={isAI ? "AI message" : "Your message"}
    >
      {/* AI avatar — only rendered for AI messages on the LEFT */}
      {isAI && (
        <div className={`ais-msg-avatar ${speakingIdx === index ? "speaking" : ""}`}>
          <IconSlot size={14}>
            <Sparkles size={14} strokeWidth={2.5} />
          </IconSlot>
        </div>
      )}

      <div className="ais-msg-body">
        {/* AI label */}
        {isAI && <span className="ais-msg-sender">StarNote AI</span>}
        {!isAI && <span className="ais-msg-sender ais-msg-sender--user">You</span>}

        {/* Message content */}
        <div className={`ais-msg-content ${isStreaming && isLast ? "ais-msg-content--streaming" : ""}`}>
          {isAI ? (
            isStreaming && isLast ? (
              <StreamingText text={msg.text} isStreaming />
            ) : (
              <ReactMarkdown>{text}</ReactMarkdown>
            )
          ) : (
            <p>{msg.text}</p>
          )}
        </div>

        {/* AI action toolbar */}
        {isAI && msg.text && !isStreaming && (
          <div className="ais-msg-actions" role="toolbar" aria-label="Message actions">
            <button
              className={`ais-action-btn ${copiedIdx === index ? "active" : ""}`}
              onClick={() => onCopy(text, index)}
              aria-label={copiedIdx === index ? "Copied" : "Copy message"}
            >
              <IconSlot>{copiedIdx === index ? <Check size={14} /> : <Copy size={14} />}</IconSlot>
              <span className="ais-action-label">{copiedIdx === index ? "Copied" : "Copy"}</span>
            </button>
            <button
              className={`ais-action-btn ${speakingIdx === index ? "active" : ""}`}
              onClick={() => onSpeak(text, index)}
              aria-label={speakingIdx === index ? "Stop reading aloud" : "Read aloud"}
            >
              <IconSlot>{speakingIdx === index ? <VolumeX size={14} /> : <Volume2 size={14} />}</IconSlot>
              <span className="ais-action-label">{speakingIdx === index ? "Stop" : "Listen"}</span>
            </button>
            <button className="ais-action-btn" onClick={() => onArtifact(msg.text)} aria-label="Open in artifact pane">
              <IconSlot><SplitSquareHorizontal size={14} /></IconSlot>
              <span className="ais-action-label">Artifact</span>
            </button>
            <div className="ais-more-wrap">
              <button
                type="button"
                className={`ais-action-btn ${moreMenuIdx === index ? "active" : ""}`}
                onClick={() => setMoreMenuIdx(moreMenuIdx === index ? null : index)}
                aria-expanded={moreMenuIdx === index}
                aria-haspopup="menu"
                aria-label="More actions"
              >
                <IconSlot><MoreHorizontal size={14} /></IconSlot>
                <span className="ais-action-label">More</span>
              </button>
              {moreMenuIdx === index && (
                <div className="ais-more-menu" role="menu">
                  <button type="button" role="menuitem" className="ais-more-item" onClick={() => { onSave(text, index); setMoreMenuIdx(null); }}>
                    <BookmarkPlus size={14} /> {savedIdx === index ? "Saved" : "Save note"}
                  </button>
                  {msg.text.length > 200 && (
                    <button type="button" role="menuitem" className="ais-more-item" disabled={summarizingIdx === index} onClick={() => { onSummarize(index, msg.text); setMoreMenuIdx(null); }}>
                      <FileStack size={14} /> {sum?.showSummary ? "Show full" : "Summarize"}
                    </button>
                  )}
                  {hasListOrFlashcards(msg.text) && (
                    <button type="button" role="menuitem" className="ais-more-item" onClick={() => { onFlashcards(msg.text); setMoreMenuIdx(null); }}>
                      <ListChecks size={14} /> Flashcards
                    </button>
                  )}
                  <button type="button" role="menuitem" className="ais-more-item" onClick={() => { onQuiz(msg.text); setMoreMenuIdx(null); }}>
                    <BrainCircuit size={14} /> Quiz
                  </button>
                  {versions.length > 1 && (
                    <button type="button" role="menuitem" className="ais-more-item" onClick={() => { setShowHistoryFor(showHistory ? null : index); setMoreMenuIdx(null); }}>
                      <History size={14} /> History
                    </button>
                  )}
                </div>
              )}
            </div>
            {showHistory && versions.length > 1 && (
              <div className="ais-history-menu ais-history-menu--inline" role="menu">
                {versions.map((v, vi) => (
                  <button
                    key={vi}
                    type="button"
                    role="menuitem"
                    className={vi === (msg.versionIndex ?? versions.length - 1) ? "active" : ""}
                    onClick={() => onRestoreVersion(index, vi)}
                  >
                    {new Date(v.at).toLocaleString()} — {v.text.slice(0, 40)}…
                  </button>
                ))}
              </div>
            )}
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
    <div className="ais-msg-avatar ais-msg-avatar--thinking">
      <IconSlot size={14}>
        <Sparkles size={14} strokeWidth={2.5} className="ais-spin" />
      </IconSlot>
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
  { icon: <Sparkles size={16} />, label: "Summarize", prompt: "Summarize the key concepts I should know about this topic in a clear, structured way." },
  { icon: <Layers size={16} />, label: "Flashcards", prompt: "Generate 10 flashcards with Q: and A: format on a topic of my choice." },
  { icon: <BrainCircuit size={16} />, label: "Explain", prompt: "Explain this concept step by step like I am a beginner:" },
  { icon: <PenLine size={16} />, label: "Study Plan", prompt: "Create a structured 7-day study plan for my upcoming exam. Include daily topics, goals, and breaks." },
  { icon: <Globe size={16} />, label: "Quiz me", prompt: "Generate a 5-question quiz (multiple choice) to test my knowledge on:" },
  { icon: <ChevronRight size={16} />, label: "Outline", prompt: "Create a detailed study outline for:" },
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
          className="ais-quick-card ais-quick-card--glass"
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
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth > 768 : true);
  const [selectedModel, setSelectedModel] = useState("openrouter");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);

  const modelMenuRef = useRef(null);
  const abortControllerRef = useRef(null);

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
  const { currentNote, selection: ctxSelection, currentPage } = useAIContext() || {};
  const contextData = { currentNote, selection: ctxSelection, currentPage };

  const [contextNoteIds, setContextNoteIds] = useState([]);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [webSearch, setWebSearch] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [mentionNotes, setMentionNotes] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [summarizeMap, setSummarizeMap] = useState({});
  const [summarizingIdx, setSummarizingIdx] = useState(null);
  const [showHistoryFor, setShowHistoryFor] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [aiLanguage, setAiLanguage] = useState(() => {
    try {
      return localStorage.getItem(LANG_STORAGE_KEY) || "en";
    } catch {
      return "en";
    }
  });
  const [streak, setStreak] = useState(() => getStreak());
  const [xp, setXp] = useState(() => getXP());
  const [streamingMsgIndex, setStreamingMsgIndex] = useState(null);
  const [moreMenuIdx, setMoreMenuIdx] = useState(null);
  const [showHeaderMore, setShowHeaderMore] = useState(false);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [ttsStatus, setTtsStatus] = useState("");
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  const [artifactWidthPct, setArtifactWidthPct] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem("starNote_artifactWidth"), 10);
      return Number.isFinite(v) && v >= 32 && v <= 62 ? v : 48;
    } catch {
      return 48;
    }
  });
  const templatesRef = useRef(null);
  const langMenuRef = useRef(null);
  const headerMoreRef = useRef(null);
  const liveRegionRef = useRef(null);
  const resizingRef = useRef(false);

  const languageInstruction = AI_LANGUAGES.find((l) => l.id === aiLanguage)?.instruction || "";
  const selectedModelMeta = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[3];

  const closeAllMenus = useCallback(() => {
    setShowModelMenu(false);
    setShowLangMenu(false);
    setShowTemplates(false);
    setShowHeaderMore(false);
    setShowPlusMenu(false);
    setMoreMenuIdx(null);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await chatService.getAll();
      if (res.data.sessions) {
        setSessions(res.data.sessions);
      }
    } catch { }
  };

  const loadSession = async (id) => {
    try {
      const res = await chatService.getById(id);
      if (res.data.session) {
        setActiveSessionId(res.data.session._id || "new");
        const msgs = normalizeMessages(res.data.session.messages || []);
        setMessages(msgs);
        setSummarizeMap({});

        const last = [...msgs].reverse().find(m => m.role === "ai");
        if (last) {
          const detected = detectArtifact(last.text);
          if (detected) { setArtifact(detected); setShowArtifact(true); }
          else { setShowArtifact(false); setArtifact(null); }
        } else {
          setShowArtifact(false); setArtifact(null);
        }

        if (window.innerWidth <= 768) {
          setIsSidebarOpen(false);
        }
      }
    } catch { }
  };

  const normalizeMessages = (msgs) =>
    (msgs || []).map((m) => ({
      ...m,
      versions: m.versions?.length ? m.versions : [{ text: m.text, at: m.at || Date.now() }],
      versionIndex: m.versionIndex ?? 0,
    }));

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
    } catch { }
  };

  const stopAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) { sourceRef.current.mediaStream?.getTracks().forEach(t => t.stop()); sourceRef.current.disconnect(); }
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null; analyserRef.current = null; sourceRef.current = null;
    setVoiceVolumes(new Array(20).fill(4));
  }, []);

  const toggleVoice = async () => {
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      stopAudio();
      setIsListening(false);
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      try { recognitionRef.current?.start(); await startAudio(); } catch { }
    }
  };

  useHotkeys([
    { key: " ", ctrl: true, handler: () => toggleVoice() },
    { key: "m", ctrl: true, handler: () => setShowModelMenu((v) => !v) },
    { key: "f", ctrl: true, handler: () => setFocusMode((v) => !v) },
  ], [isListening, stopAudio]);

  // File upload handler
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowPlusMenu(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedFile({
        name: file.name,
        type: file.type || "application/octet-stream",
        data: ev.target.result.split(',')[1] // Get base64 string
      });
      textareaRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const handleSend = useCallback(async (customInput) => {
    let text = (customInput || input).trim();
    if ((!text && !attachedFile) || loading) return;

    if (webSearch) {
      text = `[SYSTEM: User requested to search the live web for this query if needed.]\n` + text;
    }

    if (attachedFile) {
      // Don't append raw base64 to text, just a visual indicator for history
      text = `[Attached File: ${attachedFile.name}]\n` + text;
    }

    const userMsg = { role: "user", text };
    const currentAttachedFile = attachedFile; // capture for closure

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    let currentSessionId = activeSessionId || "new";

    // Setup AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // First, send user message and create/update session
      const userRes = await chatService.sendMessage(currentSessionId, "user", text);
      if (userRes.data.session) {
        currentSessionId = userRes.data.session._id;
        setActiveSessionId(currentSessionId);
        fetchSessions(); // update sidebar title
      }

      await new Promise(r => setTimeout(r, 300));
      const allMessages = [...messages, userMsg];

      recordChatQuestion();

      const response = await aiService.streamChat(allMessages, {
        currentPage: "ai",
        language: languageInstruction,
        contextNoteIds,
        ...contextData
      }, selectedModel, currentAttachedFile, { signal: abortController.signal });

      if (!response.ok) throw new Error("Failed to stream response");

      // Add empty AI message placeholder
      setMessages(prev => [...prev, { role: "ai", text: "", versions: [], versionIndex: 0 }]);
      const msgIndex = allMessages.length;
      setStreamingMsgIndex(msgIndex);
      let aiText = "";

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                aiText += data.text;
                // Incrementally update the UI
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[msgIndex] = { role: "ai", text: aiText };
                  return newMsgs;
                });
              } else if (data.error) {
                console.error("Stream Error:", data.error);
              }
            } catch (e) { }
          }
        }
      }

      const versionEntry = { text: aiText, at: Date.now() };
      setMessages((prev) => {
        const next = [...prev];
        const cur = next[msgIndex];
        if (cur?.role === "ai") {
          const versions = [...(cur.versions || []), versionEntry];
          next[msgIndex] = { ...cur, text: aiText, versions, versionIndex: versions.length - 1 };
        }
        return next;
      });
      await chatService.sendMessage(currentSessionId, "ai", aiText);

      recordAIStudySession();
      setStreak(getStreak());
      setXp(getXP());

      // Auto-detect artifact
      const detected = detectArtifact(aiText);
      if (detected) {
        setArtifact(detected);
        setArtifactSource(msgIndex);
        setShowArtifact(true);
        toast.success(`${detected.type.charAt(0).toUpperCase() + detected.type.slice(1)} artifact ready`, {
          description: "Open the side panel to study or save it.",
          action: {
            label: "Open",
            onClick: () => setShowArtifact(true),
          },
        });
      }
    } catch (err) {
      if (err.name === "AbortError" || err.message.includes("abort")) {
        setMessages(prev => [...prev, {
          role: "ai",
          text: "Generation stopped by user.",
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "ai",
          text: "I had a brief connection issue. Please try again — I'm here to help!",
        }]);
      }
    } finally {
      setLoading(false);
      setStreamingMsgIndex(null);
      abortControllerRef.current = null;
    }
  }, [input, loading, messages, isListening, activeSessionId, selectedModel, languageInstruction, contextData, attachedFile, webSearch]);

  // Load chat history + shared session link
  useEffect(() => {
    fetchSessions();
    const shared = searchParams.get("session");
    if (shared) loadSession(shared);
    else loadSession("latest");
  }, []);

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, aiLanguage);
  }, [aiLanguage]);

  useEffect(() => {
    localStorage.setItem("starNote_artifactWidth", String(artifactWidthPct));
  }, [artifactWidthPct]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAllMenus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAllMenus]);

  // Handle navigation-initiated messages (from Command Palette)
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleSend]);

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

  // Close menus on outside click
  useEffect(() => {
    const h = (e) => {
      if (showPlusMenu && plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setShowPlusMenu(false);
      if (showModelMenu && modelMenuRef.current && !modelMenuRef.current.contains(e.target)) setShowModelMenu(false);
      if (showTemplates && templatesRef.current && !templatesRef.current.contains(e.target)) setShowTemplates(false);
      if (showLangMenu && langMenuRef.current && !langMenuRef.current.contains(e.target)) setShowLangMenu(false);
      if (showHeaderMore && headerMoreRef.current && !headerMoreRef.current.contains(e.target)) setShowHeaderMore(false);
      if (moreMenuIdx !== null) setMoreMenuIdx(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showPlusMenu, showModelMenu, showTemplates, showLangMenu, showHeaderMore, moreMenuIdx]);

  // Voice recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = aiLanguage === "en" ? "en-US" : aiLanguage === "es" ? "es-ES" : `${aiLanguage}-${aiLanguage.toUpperCase()}`;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) setInput(p => p + e.results[i][0].transcript + " ");
      }
    };
    rec.onend = () => { if (isListeningRef.current) { try { rec.start(); } catch { } } };
    rec.onerror = (e) => { if (e.error !== "no-speech") { setIsListening(false); stopAudio(); } };
    recognitionRef.current = rec;
  }, [aiLanguage, stopAudio]);

  const handleCopy = useCallback(async (text, idx) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const handleSave = useCallback(async (text, idx) => {
    try {
      await notesService.create({
        name: "AI Note — " + new Date().toLocaleDateString(),
        icon: "🧠",
        category: "general",
        fileType: "text",
        content: text,
      });
      setSavedIdx(idx);
      setTimeout(() => setSavedIdx(null), 2000);
      toast.success("Saved to Notes");
    } catch {
      toast.error("Failed to save note.");
    }
  }, []);

  const handleQuiz = (text) => handleSend(`Please generate a short quiz (3-5 questions, MCQ + short answer) based on:\n"${text.slice(0, 400)}"`);

  const handleManualArtifact = (text) => {
    const detected = detectArtifact(text) || { type: "markdown", content: text };
    setArtifact(detected);
    setShowArtifact(true);
  };

  const getAvailableVoices = () => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      if (voices.length) {
        resolve(voices);
      } else {
        synth.onvoiceschanged = () => {
          resolve(synth.getVoices());
        };
      }
    });
  };

  const pickVoice = (voices, langId) => {
    const langPrefix = langId === "en" ? "en" : langId;
    const preferred = voices.find(
      (v) =>
        (v.name.includes("Google") || v.name.includes("Premium")) &&
        v.lang.toLowerCase().startsWith(langPrefix)
    );
    if (preferred) return preferred;
    const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (langMatch) return langMatch;
    const enFallback = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    return enFallback || voices[0] || null;
  };

  const handleSpeak = useCallback(async (text, idx) => {
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      setTtsStatus("Speech stopped");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_`#]/g, ""));
    const voices = await getAvailableVoices();
    const voice = pickVoice(voices, aiLanguage);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 1.05;
    utterance.onend = () => { setSpeakingIdx(null); setTtsStatus("Finished reading"); };
    utterance.onerror = () => { setSpeakingIdx(null); setTtsStatus("Speech stopped"); };
    setSpeakingIdx(idx);
    setTtsStatus("Reading aloud");
    window.speechSynthesis.speak(utterance);
    const tts = recordTTSListen();
    if (tts.voiceGuru) setXp(getXP());
  }, [speakingIdx, aiLanguage]);

  const handleSummarize = async (index, fullText) => {
    const existing = summarizeMap[index];
    if (existing?.showSummary && existing.summary) {
      setSummarizeMap((m) => ({ ...m, [index]: { ...existing, showSummary: false } }));
      return;
    }
    if (existing?.summary) {
      setSummarizeMap((m) => ({ ...m, [index]: { ...existing, showSummary: true } }));
      return;
    }
    setSummarizingIdx(index);
    try {
      const res = await aiService.completeWithPrompt(
        [{ role: "user", text: fullText }],
        "Summarize the following AI response in 3–6 concise bullet points. Preserve key facts. Do not add preamble.",
        { currentPage: "ai", language: languageInstruction },
        selectedModel
      );
      const summary = res.data?.data?.text || res.data?.text || "";
      setSummarizeMap((m) => ({
        ...m,
        [index]: { original: fullText, summary, showSummary: true },
      }));
    } catch {
      toast.error("Could not summarize. Try again.");
    } finally {
      setSummarizingIdx(null);
    }
  };

  const handleCreateFlashcards = async (text) => {
    const cards = parseFlashcards(text);
    if (!cards.length) {
      toast.info("No Q/A pairs detected. Try asking for flashcards in Q: A: format.");
      return;
    }
    const deckName = `AI Chat — ${new Date().toLocaleDateString()}`;
    try {
      await flashcardsService.bulkCreate(
        cards.map((c) => ({ front: c.question, back: c.answer })),
        deckName
      );
      toast.success(`Added ${cards.length} cards to "${deckName}"`);
    } catch {
      toast.error("Failed to save flashcards.");
    }
  };

  const handleRestoreVersion = (index, versionIdx) => {
    setMessages((prev) => {
      const next = [...prev];
      const msg = next[index];
      if (!msg?.versions?.[versionIdx]) return prev;
      next[index] = { ...msg, text: msg.versions[versionIdx].text, versionIndex: versionIdx };
      return next;
    });
    setShowHistoryFor(null);
  };

  const handleCopyInviteLink = async () => {
    if (!activeSessionId) {
      toast.info("Send a message first to create a session link.");
      return;
    }
    const url = `${window.location.origin}/ai?session=${activeSessionId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Session link copied", {
      description: "Opens this chat when you’re signed in on this device.",
    });
  };

  const startArtifactResize = (e) => {
    e.preventDefault();
    resizingRef.current = true;
    const onMove = (ev) => {
      if (!resizingRef.current) return;
      const root = document.querySelector(".ais-root--split");
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const pct = ((rect.right - ev.clientX) / rect.width) * 100;
      setArtifactWidthPct(Math.min(62, Math.max(32, pct)));
    };
    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Fetch notes for @mention
  const fetchMentionNotes = async (query) => {
    try {
      const res = await notesService.getAll();
      const notes = res.data.notes || [];
      const filtered = notes.filter(n =>
        n.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setMentionNotes(filtered);
      setShowMentions(filtered.length > 0);
    } catch {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (note) => {
    // Replace @query with @NoteName
    const atIndex = input.lastIndexOf('@');
    const before = input.substring(0, atIndex);
    const newInput = `${before}@${note.name} `;
    setInput(newInput);
    setShowMentions(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setInput(value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";

    // Check for @mention trigger
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1);
      // Only trigger if there's no space after @ (user is still typing the mention)
      if (!afterAt.includes(' ') && afterAt.length >= 0) {
        setMentionQuery(afterAt);
        setMentionHighlight(0);
        fetchMentionNotes(afterAt);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (showMentions && mentionNotes.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionHighlight((h) => Math.min(h + 1, mentionNotes.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleMentionSelect(mentionNotes[mentionHighlight]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;
  const showSplit = showArtifact && artifact;

  const plusItems = [
    { icon: <FileText size={16} />, label: "Upload document", action: () => fileInputRef.current?.click() },
    { icon: <ImageIcon size={16} />, label: "Upload photo", action: () => fileInputRef.current?.click() },
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
    }
  ];

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setSummarizeMap({});
    setArtifact(null);
    setShowArtifact(false);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      await chatService.delete(id);
      if (activeSessionId === id) {
        handleNewChat();
      }
      fetchSessions();
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div
      className={`ais-root ${showSplit && !focusMode && !isMobile ? "ais-root--split" : ""} ${isSidebarOpen && !focusMode ? "ais-root--sidebar" : ""} ${focusMode ? "ais-root--focus" : ""}`}
      style={showSplit && !focusMode && !isMobile ? { "--artifact-width": `${artifactWidthPct}%` } : undefined}
    >
      <div className="sr-only" aria-live="polite" ref={liveRegionRef}>{ttsStatus}</div>

      {/* ══ SIDEBAR — Chat History ══════════════════════════════════════ */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              className="ais-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              className="ais-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="ais-sidebar-header">
                <button className="ais-new-chat-btn" onClick={handleNewChat}>
                  <MessageSquarePlus size={16} />
                  <span>New Chat</span>
                </button>
                <div className="ais-sidebar-search-container">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ais-sidebar-search"
                  />
                </div>
              </div>
              <div className="ais-sidebar-list">
                <div className="ais-sidebar-group">Recent</div>
                {sessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase())).map(session => (
                  <div
                    key={session._id}
                    className={`ais-sidebar-item ${activeSessionId === session._id ? 'active' : ''}`}
                    onClick={() => loadSession(session._id)}
                  >
                    <MessageSquare size={14} className="icon" />
                    <span className="title">{session.title || "New Chat"}</span>
                    <button className="delete-btn" onClick={(e) => handleDeleteChat(e, session._id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="ais-sidebar-empty">No previous chats</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ══ MIDDLE PANE — Conversation ══════════════════════════════════════ */}
      <div className={`ais-chat-pane ${focusMode ? "ais-focus-mode" : ""}`}>
        <div className="ais-chat-pane-header">
          <div className="ais-chat-pane-header-left">
            {!focusMode && (
              <button className="ais-header-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle sidebar" aria-label="Toggle sidebar">
                <IconSlot size={18}><PanelLeft size={18} /></IconSlot>
              </button>
            )}
            <div className="ais-model-selector" ref={modelMenuRef}>
              <button
                className="ais-model-btn"
                onClick={() => setShowModelMenu(!showModelMenu)}
                aria-expanded={showModelMenu}
                aria-haspopup="listbox"
              >
                <span className="ais-model-chip">{selectedModelMeta.short}</span>
                <ChevronDown size={14} className="icon-caret" />
              </button>

              <AnimatePresence>
                {showModelMenu && (
                  <motion.div
                    className="ais-model-menu"
                    role="listbox"
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {MODEL_OPTIONS.map(model => (
                      <div
                        key={model.id}
                        role="option"
                        aria-selected={selectedModel === model.id}
                        className={`ais-model-option ${selectedModel === model.id ? 'active' : ''}`}
                        onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }}
                      >
                        <div className="title">{model.name}</div>
                        <div className="desc">{model.desc}</div>
                        {selectedModel === model.id && <Check size={14} className="check" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ContextNotePicker 
              selectedIds={contextNoteIds} 
              onChange={setContextNoteIds} 
            />
          </div>
          <div className="ais-chat-pane-header-right">
            {!focusMode && (
              <div className="ais-header-badges" aria-label="Study stats">
                <span className="ais-stat-badge" title="Daily study streak">
                  <IconSlot size={14}><Flame size={14} /></IconSlot>
                  {streak.count}d
                </span>
                <span className="ais-stat-badge ais-stat-badge--text" title="Experience points">
                  {xp} XP
                </span>
                {hasVoiceGuruBadge() && (
                  <span className="ais-stat-badge voice-guru" title="Voice Guru — 5+ Listen uses">
                    <IconSlot size={14}><Award size={14} /></IconSlot>
                  </span>
                )}
              </div>
            )}
            <div className="ais-header-tools ais-header-tools--desktop">
              <div className="ais-lang-selector" ref={langMenuRef}>
                <button
                  className="ais-header-btn"
                  onClick={() => { setShowLangMenu((v) => !v); setShowTemplates(false); setShowHeaderMore(false); }}
                  aria-label="Reply language"
                  aria-expanded={showLangMenu}
                >
                  <IconSlot size={18}><Languages size={18} /></IconSlot>
                </button>
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div className="ais-model-menu ais-lang-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                      {AI_LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          className={`ais-model-option ${aiLanguage === lang.id ? "active" : ""}`}
                          onClick={() => { setAiLanguage(lang.id); setShowLangMenu(false); }}
                        >
                          <div className="title">{lang.label}</div>
                          {aiLanguage === lang.id && <Check size={14} className="check" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {activeSessionId && (
                <button
                  className="ais-header-btn"
                  onClick={handleCopyInviteLink}
                  aria-label="Copy session link for this account"
                  title="Copy session link (same account)"
                >
                  <IconSlot size={18}><Link2 size={18} /></IconSlot>
                </button>
              )}
              <div className="ais-templates-wrap" ref={templatesRef}>
                <button
                  className={`ais-header-btn ${showTemplates ? "active" : ""}`}
                  onClick={() => { setShowTemplates((v) => !v); setShowLangMenu(false); }}
                  aria-label="Prompt templates"
                  aria-expanded={showTemplates}
                >
                  <IconSlot size={18}><LayoutTemplate size={18} /></IconSlot>
                </button>
                <AnimatePresence>
                  {showTemplates && (
                    <motion.div className="ais-model-menu ais-templates-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                      {AI_PROMPT_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="ais-model-option"
                          onClick={() => {
                            setInput((prev) => (prev ? `${prev}\n\n${t.prompt} ` : `${t.prompt} `));
                            setShowTemplates(false);
                            textareaRef.current?.focus();
                          }}
                        >
                          <div className="title">{t.label}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                className={`ais-header-btn ${focusMode ? "active" : ""}`}
                onClick={() => setFocusMode(!focusMode)}
                title="Focus mode (Ctrl+F)"
                aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
              >
                <IconSlot size={18}>
                  {focusMode ? <Minimize size={18} /> : <Maximize size={18} />}
                </IconSlot>
              </button>
            </div>
            <div className="ais-header-overflow ais-header-tools--mobile" ref={headerMoreRef}>
              <button
                className={`ais-header-btn ${showHeaderMore ? "active" : ""}`}
                onClick={() => setShowHeaderMore((v) => !v)}
                aria-label="More options"
                aria-expanded={showHeaderMore}
              >
                <IconSlot size={18}><MoreHorizontal size={18} /></IconSlot>
              </button>
              <AnimatePresence>
                {showHeaderMore && (
                  <motion.div className="ais-model-menu ais-header-overflow-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                    <div className="ais-overflow-group-label">Language</div>
                    {AI_LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        className={`ais-overflow-item ${aiLanguage === lang.id ? "active" : ""}`}
                        onClick={() => { setAiLanguage(lang.id); setShowHeaderMore(false); }}
                      >
                        {lang.label}
                      </button>
                    ))}
                    <div className="ais-overflow-divider" />
                    <div className="ais-overflow-group-label">Templates</div>
                    {AI_PROMPT_TEMPLATES.slice(0, 4).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="ais-overflow-item"
                        onClick={() => {
                          setInput((prev) => (prev ? `${prev}\n\n${t.prompt} ` : `${t.prompt} `));
                          setShowHeaderMore(false);
                          textareaRef.current?.focus();
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                    <div className="ais-overflow-divider" />
                    {activeSessionId && (
                      <button type="button" className="ais-overflow-item" onClick={() => { handleCopyInviteLink(); setShowHeaderMore(false); }}><Link2 size={16} /> Copy session link</button>
                    )}
                    <button type="button" className="ais-overflow-item" onClick={() => { setFocusMode((f) => !f); setShowHeaderMore(false); }}><Maximize size={16} /> Focus mode</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {loading && (
            <div className="ais-progress-track" role="progressbar" aria-label="Generating response">
              <div className="ais-progress-fill" />
            </div>
          )}
        </div>
        {focusMode && (
          <button type="button" className="ais-focus-exit" onClick={() => setFocusMode(false)}>
            <Minimize size={16} /> Exit focus
          </button>
        )}

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
                    isStreaming={loading && streamingMsgIndex === i}
                    onCopy={handleCopy}
                    onSave={handleSave}
                    onQuiz={handleQuiz}
                    onArtifact={handleManualArtifact}
                    onSpeak={handleSpeak}
                    onSummarize={handleSummarize}
                    onFlashcards={handleCreateFlashcards}
                    onRestoreVersion={handleRestoreVersion}
                    copiedIdx={copiedIdx}
                    savedIdx={savedIdx}
                    speakingIdx={speakingIdx}
                    summarizingIdx={summarizingIdx}
                    summarizeMap={summarizeMap}
                    showHistoryFor={showHistoryFor}
                    setShowHistoryFor={setShowHistoryFor}
                    moreMenuIdx={moreMenuIdx}
                    setMoreMenuIdx={setMoreMenuIdx}
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
                  <div className="ais-pill-left-actions">
                    <button
                      className={`ais-pill-btn ${showPlusMenu ? "active" : ""}`}
                      onClick={() => setShowPlusMenu(v => !v)}
                      title="Attach"
                    >
                      {showPlusMenu ? <X size={18} /> : <Paperclip size={18} />}
                    </button>
                    <button
                      className={`ais-pill-btn ${webSearch ? "active-globe" : ""}`}
                      onClick={() => setWebSearch(!webSearch)}
                      title="Toggle Web Search"
                    >
                      <Globe size={18} color={webSearch ? "var(--primary)" : "currentColor"} />
                    </button>
                  </div>

                  <div className="ais-input-core">
                    {attachedFile && (
                      <div className="ais-attachment-chip">
                        {attachedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span className="ais-attachment-name">{attachedFile.name}</span>
                        <button className="ais-attachment-remove" onClick={removeAttachment}>
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {showMentions && mentionNotes.length > 0 && (
                      <ul className="ais-mention-menu" role="listbox" aria-label="Link a note">
                        {mentionNotes.map((note, ni) => (
                          <li key={note._id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={ni === mentionHighlight}
                              className={ni === mentionHighlight ? "highlighted" : ""}
                              onClick={() => handleMentionSelect(note)}
                            >
                              {note.icon || "📝"} {note.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <textarea
                      ref={textareaRef}
                      className="ais-input"
                      placeholder={attachedFile ? "Add a message about this file..." : "Ask anything..."}
                      value={input}
                      onChange={handleTextareaChange}
                      onKeyDown={handleInputKeyDown}
                      rows={1}
                      spellCheck={false}
                      aria-label="Message to AI"
                    />
                  </div>

                  <div className="ais-pill-right">
                    {loading ? (
                      <button className="ais-send-btn stop" onClick={handleStop} title="Stop generating">
                        <Square size={14} fill="currentColor" />
                      </button>
                    ) : (!input.trim() && !attachedFile) ? (
                      <button
                        className={`ais-send-btn idle ${isListening ? "listening-ring" : ""}`}
                        onClick={toggleVoice}
                        title="Voice input (Ctrl+Space)"
                        aria-label="Voice input"
                      >
                        <Mic size={18} />
                      </button>
                    ) : (
                      <button className="ais-send-btn active" onClick={() => handleSend()}>
                        <ArrowUp size={18} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <p className="ais-input-hint">
              <span className="ais-hint-full">Enter send · Shift+Enter newline · Ctrl+Space voice · Ctrl+M model · Ctrl+F focus</span>
              <span className="ais-hint-short">Enter send · Ctrl+Space mic</span>
            </p>
          </div>
        </div>
      </div>

      {showSplit && !isMobile && (
        <div
          className="ais-resize-handle"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize artifact panel"
          onMouseDown={startArtifactResize}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* ══ RIGHT PANE — Artifact ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showSplit && (
          <>
            {isMobile && (
              <motion.div
                className="ais-artifact-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowArtifact(false)}
              />
            )}
            <motion.div
              className={`ais-artifact-pane ${isMobile ? "ais-artifact-pane--sheet" : ""}`}
              initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, width: 0 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, width: "var(--artifact-width, 48%)" }}
              exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, width: 0 }}
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
