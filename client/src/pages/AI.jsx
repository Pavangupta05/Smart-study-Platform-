import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sparkles,
  Mic,
  MicOff,
  Loader2,
  Plus,
  Globe,
  ArrowUp,
  Image as ImageIcon,
  PenLine,
  Copy,
  Check,
  BookmarkPlus,
  BrainCircuit,
  AudioLines,
  Camera,
  Upload,
  FolderOpen,
  ClipboardPaste,
  X,
  Trash2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { notesService, chatService } from "../services/index";
import "../styles/ai.css";

// Init Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Typewriter with Markdown
const TypewriterMarkdown = ({ text, delay = 12 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
};

// Optimized Voice Visualizer Sub-component
const VoiceVisualizer = ({ volumes }) => {
  return (
    <div className="ai-voice-flowing-wave">
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="ai-wave-svg">
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="50%" stopColor="rgba(236, 72, 153, 0.6)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
          </linearGradient>
        </defs>
        {[...Array(3)].map((_, i) => (
          <motion.path
            key={i}
            fill="url(#wave-grad)"
            initial={{ d: "M0 20 Q100 20 200 20 Q300 20 400 20" }}
            animate={{ 
              d: [
                `M0 ${20 - i*2} Q100 ${10 + (volumes[5+i]||0)} 200 ${20} Q300 ${30 - (volumes[15+i]||0)} 400 ${20 + i*2}`,
                `M0 ${20 + i*2} Q100 ${30 - (volumes[10+i]||0)} 200 ${20} Q300 ${10 + (volumes[20+i]||0)} 400 ${20 - i*2}`
              ]
            }}
            transition={{ 
              duration: 1.5 + i * 0.2, 
              repeat: Infinity, 
              repeatType: "mirror",
              ease: "easeInOut" 
            }}
            style={{ opacity: 0.5 - i * 0.1 }}
          />
        ))}
      </svg>
      <div className="ai-voice-bars-overlay centered">
        {volumes.slice(4, 20).map((vol, i) => (
          <motion.div
            key={i}
            className="waveform-bar-mini"
            animate={{ 
              height: vol,
              opacity: 0.6 + (vol / 56) * 0.4
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, // Faster/More animated
              damping: 15     // More bouncy
            }}
          />
        ))}
      </div>
    </div>
  );
};

function AI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [voiceVolumes, setVoiceVolumes] = useState(new Array(24).fill(10));
  const isListeningRef = useRef(false);

  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    chatService.getLatest().then(res => {
      if (res.data.session && res.data.session.messages) {
        setMessages(res.data.session.messages);
      }
    }).catch(console.error);
  }, []);

  const hasMessages = messages.length > 0;

  // Premium Glass Cards Suggestions
  const quickActions = [
    { icon: <Sparkles size={20} color="#8b5cf6" />, title: "Summarize Notes", desc: "Condense long text into key points" },
    { icon: <BrainCircuit size={20} color="#ec4899" />, title: "Explain Concept", desc: "Break down complex topics simply" },
    { icon: <PenLine size={20} color="#10b981" />, title: "Draft Outline", desc: "Get a structured starting point" },
    { icon: <Globe size={20} color="#3b82f6" />, title: "Web Research", desc: "Find factual data and context" },
  ];

  // Plus menu items
  const plusMenuItems = [
    { icon: <Upload size={18} />, label: "Upload File", action: () => fileInputRef.current?.click() },
    { icon: <Camera size={18} />, label: "Take Photo", action: () => alert("Camera feature coming soon!") },
    { icon: <FolderOpen size={18} />, label: "Browse Notes", action: async () => {
      try {
        const res = await notesService.getAll();
        const saved = res.data.notes || [];
        if (saved.length > 0) {
          const names = saved.map(f => f.name).join(", ");
          setInput(`I have these notes: ${names}. Help me study them.`);
          textareaRef.current?.focus();
        } else {
          alert("No notes found. Upload some files first!");
        }
      } catch {
        alert("Failed to load notes.");
      }
    }},
    { icon: <ClipboardPaste size={18} />, label: "Paste Text", action: async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput((prev) => prev + text);
          textareaRef.current?.focus();
        }
      } catch {
        alert("Could not read clipboard. Please paste manually.");
      }
    }},
  ];

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setShowPlusMenu(false);
      }
    };
    if (showPlusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPlusMenu]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowPlusMenu(false);

    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        const truncated = content.length > 2000 ? content.substring(0, 2000) + "..." : content;
        setInput(`Here's the content of ${file.name}:\n\n${truncated}\n\nPlease summarize and explain the key points.`);
        textareaRef.current?.focus();
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Data = ev.target.result.split(',')[1];
        setAttachment({
          inlineData: { data: base64Data, mimeType: file.type }
        });
        setInput(`I've attached ${file.name}. Please explain it.`);
        textareaRef.current?.focus();
      };
      reader.readAsDataURL(file);
    } else {
      setInput(`I've uploaded a file: ${file.name}. Please help me analyze it.`);
      textareaRef.current?.focus();
    }
    e.target.value = "";
  };

  // Handle initial message from navigation
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle globalAskAI events
  useEffect(() => {
    const handleGlobalAskAI = (e) => {
      if (e.detail) handleSend(e.detail);
    };
    window.addEventListener("globalAskAI", handleGlobalAskAI);
    return () => window.removeEventListener("globalAskAI", handleGlobalAskAI);
  }, [messages, loading]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInput((prev) => prev + event.results[i][0].transcript + " ");
          }
        }
      };
      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }
      };
      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'no-speech') return;
        setIsListening(false);
        stopAudioAnalysis();
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const startSimulation = () => {
    const updateSim = () => {
      if (!isListeningRef.current) return;
      const simVolumes = [];
      const time = Date.now() / 100;
      for (let i = 0; i < 24; i++) {
        // Create a smooth undulating wave using sine
        const val = Math.sin(time + i * 0.5) * 20 + 30;
        simVolumes.push(val);
      }
      setVoiceVolumes(simVolumes);
      animationFrameRef.current = requestAnimationFrame(updateSim);
    };
    updateSim();
  };

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 64; // Smaller size for fewer bars
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;

      const updateVolumes = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Map frequency data to 24 bars
        const newVolumes = [];
        for (let i = 0; i < 24; i++) {
          // Symmetric mapping: bars in middle get lower frequencies (usually more active)
          const index = Math.abs(i - 12); 
          const val = dataArrayRef.current[index] || 0;
          // Scale value to min 4px, max 56px (bigger)
          const height = 4 + (val / 255) * 52;
          newVolumes.push(height);
        }
        setVoiceVolumes(newVolumes);
        animationFrameRef.current = requestAnimationFrame(updateVolumes);
      };
      
      updateVolumes();
    } catch (err) {
      console.error("Audio analysis failed:", err);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setVoiceVolumes(new Array(24).fill(4));
  };

  const toggleVoice = async () => {
    // Resume AudioContext if it's suspended (browser policy)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      stopAudioAnalysis();
      setIsListening(false);
    } else {
      setIsListening(true);
      isListeningRef.current = true;
      
      if (!recognitionRef.current) {
        // Simulation Mode fallback
        console.warn("Speech recognition not supported - starting simulation mode.");
        startSimulation();
      } else {
        try {
          recognitionRef.current.start();
          await startAudioAnalysis();
        } catch (e) {
          console.error("Speech recognition error:", e);
          startSimulation(); // Fallback to simulation if microphone fails
        }
      }
    }
  };

  const systemPrompt = `
You are an advanced AI Study Assistant integrated into a modern Smart Study Platform.
Your goal is to generate high-quality, structured, and helpful study responses.
ALWAYS use Markdown formatting in your responses for maximum readability.

🎯 CORE BEHAVIOR:
- Always respond like a smart tutor
- Keep tone friendly, slightly conversational, not robotic
- Avoid overly long paragraphs
- Make responses clean, structured, and easy to scan
- Use **bold** for key terms, use headings (##), bullet lists, and code blocks when relevant

🧠 RESPONSE STRUCTURE:
1. Short 1–2 line summary
2. Sections using **bold headings** or bullet lists
3. 2–4 key points explaining the concept
4. A small example, analogy, or code snippet (if useful)
5. End with a 💡 **Tip** or quick takeaway

✨ MODES (based on user intent):
- If user says "summarize" → Provide a short, compressed version
- If user says "explain" → Break down concept step-by-step
- If user says "quiz" or "questions" → Generate 3–5 questions (mix of MCQ + short answer)
- Default → Explanation mode
  `;

  const handleSend = async (customInput) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    chatService.sendMessage("user", textToSend).catch(console.error);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const historyText = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
        .join("\n");
      const fullPrompt = `${systemPrompt}\n\nChat History:\n${historyText}\n\nUser Question: ${textToSend}\n\nAI Study Assistant:`;

      let contentParts = [fullPrompt];
      if (attachment) {
        contentParts.push(attachment);
        setAttachment(null);
      }

      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const text = response.text();
      const aiMsg = { role: "ai", text };
      setMessages((prev) => [...prev, aiMsg]);
      
      chatService.sendMessage("ai", text).catch(console.error);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "💡 **Tip:** I had a brief connection issue. Try rephrasing your question or check your connection!",
        },
      ]);
    }

    setLoading(false);
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSave = async (text, index) => {
    try {
      const newFile = {
        name: "AI Note - " + new Date().toLocaleDateString(),
        size: "0.1 MB",
        icon: "🧠",
        category: "general",
        fileType: "text",
        content: text
      };
      await notesService.create(newFile);
      setSavedIndex(index);
      setTimeout(() => setSavedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save AI note to your backend.");
    }
  };

  const handleQuiz = (text) => {
    handleSend(
      `Please generate a short quiz (3-5 questions, mix of MCQ and short answer) based on this explanation:\n"${text}"`
    );
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  return (
    <div className="ai-page-v2">
      {/* ════ CONVERSATION VIEW ════ */}
      {hasMessages ? (
        <div className="ai-chat-view">
          <div className="ai-chat-scroll">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <button 
                className="ai-action-btn" 
                onClick={async () => {
                  await chatService.clear();
                  setMessages([]);
                }}
                style={{ borderRadius: '20px', padding: '6px 16px' }}
              >
                <Trash2 size={13} style={{ marginRight: '6px' }} />
                Clear Conversation
              </button>
            </div>
            
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  className={`ai-msg ${msg.role}`}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="ai-msg-inner">
                    <div className={`ai-msg-avatar ${msg.role}`}>
                      {msg.role === "user" ? <User size={16} strokeWidth={2.5} /> : <Sparkles size={16} strokeWidth={2.5} />}
                    </div>
                    <div className="ai-msg-body">
                      {msg.role === "ai" && (
                        <div className="ai-msg-label">
                          <Sparkles size={11} strokeWidth={3} />
                          <span>AI Study Expert</span>
                        </div>
                      )}
                      <div className="ai-msg-content">
                        {msg.role === "ai" && i === messages.length - 1 ? (
                          <TypewriterMarkdown text={msg.text} />
                        ) : msg.role === "ai" ? (
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>
                      {msg.role === "ai" && (
                        <div className="ai-msg-actions">
                          <button
                            className={`ai-action-btn ${copiedIndex === i ? "done" : ""}`}
                            onClick={() => handleCopy(msg.text, i)}
                          >
                            {copiedIndex === i ? <Check size={14} /> : <Copy size={14} />}
                            {copiedIndex === i ? "Copied" : "Copy"}
                          </button>
                          <button
                            className={`ai-action-btn ${savedIndex === i ? "done" : ""}`}
                            onClick={() => handleSave(msg.text, i)}
                          >
                            <BookmarkPlus size={14} />
                            {savedIndex === i ? "Saved" : "Save"}
                          </button>
                          <button
                            className="ai-action-btn"
                            onClick={() => handleQuiz(msg.text)}
                          >
                            <BrainCircuit size={14} />
                            Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div 
                className="ai-msg ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="ai-msg-inner">
                  <div className="ai-msg-avatar ai">
                    <Sparkles size={16} className="spin" />
                  </div>
                  <div className="ai-msg-body">
                    <div className="ai-thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      ) : (
        /* ════ PREMIUM WELCOME VIEW ════ */
        <div className="ai-welcome">
          <div className="ai-hero">
            <motion.div 
              className="ai-hero-logo"
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Sparkles size={40} strokeWidth={2} />
            </motion.div>
            <motion.h1 
              className="ai-hero-title"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              How can I help you learn?
            </motion.h1>
          </div>

          <div className="ai-suggestions-grid">
            {quickActions.map((action, idx) => (
              <motion.div
                key={idx}
                className="ai-suggestion-card"
                onClick={() => handleSend(action.title)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.4 }}
              >
                <div className="ai-suggestion-icon">{action.icon}</div>
                <div className="ai-suggestion-text">
                  <h4>{action.title}</h4>
                  <p>{action.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ════ FLOATING INPUT PILL ════ */}
      <div className="ai-input-dock">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="ai-file-input-hidden"
          accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,image/*"
          onChange={handleFileUpload}
        />

        <div className="ai-input-wrapper">
          {/* Plus menu popup */}
          <AnimatePresence>
            {showPlusMenu && (
                <motion.div 
                  className="ai-plus-menu" 
                  ref={plusMenuRef}
                  initial={{ opacity: 0, scale: 0.2, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.2, y: 15 }}
                  transition={{ type: "spring", damping: 22, stiffness: 350 }}
                  style={{ transformOrigin: "bottom left" }}
                >
                {plusMenuItems.map((item, idx) => (
                  <button
                    key={idx}
                    className="ai-plus-menu-item"
                    onClick={() => {
                      item.action();
                      setShowPlusMenu(false);
                    }}
                  >
                    <span className="ai-plus-menu-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`ai-input-pill ${isListening ? 'listening-mode' : ''}`}>
            {isListening ? (
              <div className="ai-voice-visualizer-wrapper flowing">
                <button className="ai-pill-btn attach dimmed">
                  <Plus size={20} />
                </button>

                <VoiceVisualizer volumes={voiceVolumes} />

                <div className="voice-actions-right">
                  <button className="ai-pill-btn voice-close-new" onClick={toggleVoice} title="Stop Listening">
                    <X size={18} />
                  </button>
                  <button className="ai-pill-send active voice-send" onClick={() => handleSend()}>
                    <ArrowUp size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Animated Plus / Attach button */}
                <button
                  className={`ai-pill-btn attach ${showPlusMenu ? "active" : ""}`}
                  title="Attach"
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                >
                  {showPlusMenu ? <X size={20} /> : <Plus size={20} />}
                </button>

                {/* Expandable textarea */}
                <textarea
                  ref={textareaRef}
                  className="ai-pill-input"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                />

                {/* Right actions: send / mic */}
                <div className="ai-pill-right">
                  {!input.trim() ? (
                    <button className="ai-pill-send idle" onClick={toggleVoice}>
                      <AudioLines size={20} />
                    </button>
                  ) : (
                    <button
                      className="ai-pill-send active"
                      onClick={() => handleSend()}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 size={18} className="spin" />
                      ) : (
                        <ArrowUp size={20} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AI;