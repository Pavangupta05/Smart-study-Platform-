import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  User,
  Sparkles,
  Mic,
  MicOff,
  Loader2,
  Plus,
  Globe,
  ArrowUp,
  Search,
  Image as ImageIcon,
  PenLine,
  ChevronRight,
  Copy,
  Check,
  BookmarkPlus,
  BrainCircuit,
  AudioLines,
  Camera,
  Upload,
  FolderOpen,
  FileText,
  ClipboardPaste,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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

function AI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasMessages = messages.length > 0;

  // Quick actions — simple ChatGPT-style list
  const quickActions = [
    { icon: <ImageIcon size={20} />, label: "Create an image" },
    { icon: <PenLine size={20} />, label: "Write or edit" },
    { icon: <Globe size={20} />, label: "Look something up" },
  ];

  // Plus menu items (ChatGPT-style attachment options)
  const plusMenuItems = [
    { icon: <Upload size={18} />, label: "Upload file", action: () => fileInputRef.current?.click() },
    { icon: <Camera size={18} />, label: "Take photo", action: () => alert("Camera feature coming soon!") },
    { icon: <FolderOpen size={18} />, label: "Browse notes", action: () => {
      const saved = JSON.parse(localStorage.getItem("starNote_files") || "[]");
      if (saved.length > 0) {
        const names = saved.map(f => f.name).join(", ");
        setInput(`I have these notes: ${names}. Help me study them.`);
        textareaRef.current?.focus();
      } else {
        alert("No notes found. Upload some files first!");
      }
    }},
    { icon: <ClipboardPaste size={18} />, label: "Paste text", action: async () => {
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

    // For text-based files, read and insert content
    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        const truncated = content.length > 2000 ? content.substring(0, 2000) + "..." : content;
        setInput(`Here's the content of ${file.name}:\n\n${truncated}\n\nPlease summarize and explain the key points.`);
        textareaRef.current?.focus();
      };
      reader.readAsText(file);
    } else {
      setInput(`I've uploaded a file: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Please help me analyze it.`);
      textareaRef.current?.focus();
    }

    // Reset file input
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
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join("");
        setInput(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
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

    // Reset textarea height
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

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { role: "ai", text }]);
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

  const handleSave = (text, index) => {
    try {
      const savedFiles = JSON.parse(
        localStorage.getItem("starNote_files") || "[]"
      );
      const newFile = {
        id: Date.now(),
        name: "AI Note - " + new Date().toLocaleDateString(),
        content: text,
        date: "Just now",
        icon: "🧠",
      };
      localStorage.setItem(
        "starNote_files",
        JSON.stringify([newFile, ...savedFiles])
      );
      setSavedIndex(index);
      setTimeout(() => setSavedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const handleQuiz = (text) => {
    handleSend(
      `Please generate a short quiz (3-5 questions, mix of MCQ and short answer) based on this explanation:\n"${text}"`
    );
  };

  // Auto-resize textarea — expands as you type, like ChatGPT
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
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                <div className="ai-msg-inner">
                  <div className={`ai-msg-avatar ${msg.role}`}>
                    {msg.role === "user" ? (
                      <User size={14} />
                    ) : (
                      <Sparkles size={14} />
                    )}
                  </div>
                  <div className="ai-msg-body">
                    {msg.role === "ai" && (
                      <div className="ai-msg-label">
                        <Sparkles size={10} />
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
                          {copiedIndex === i ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                        <button
                          className={`ai-action-btn ${savedIndex === i ? "done" : ""}`}
                          onClick={() => handleSave(msg.text, i)}
                        >
                          <BookmarkPlus size={13} />
                          {savedIndex === i ? "Saved" : "Save"}
                        </button>
                        <button
                          className="ai-action-btn"
                          onClick={() => handleQuiz(msg.text)}
                        >
                          <BrainCircuit size={13} />
                          Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai skeleton-msg">
                <div className="ai-msg-inner">
                  <div className="ai-msg-avatar ai">
                    <Sparkles size={14} className="spin" />
                  </div>
                  <div className="ai-msg-body">
                    <div className="ai-thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      ) : (
        /* ════ WELCOME VIEW — Empty state with quick actions above input ════ */
        <div className="ai-welcome">
          <div className="ai-welcome-spacer" />
          <div className="ai-welcome-bottom">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="ai-action-row"
                onClick={() => handleSend(action.label)}
              >
                <span className="ai-action-row-icon">{action.icon}</span>
                <span className="ai-action-row-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════ CHATGPT-STYLE INPUT BAR ════ */}
      <div className={`ai-input-dock ${hasMessages ? "has-chat" : ""}`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="ai-file-input-hidden"
          accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,image/*"
          onChange={handleFileUpload}
        />

        {/* Plus menu popup */}
        {showPlusMenu && (
          <div className="ai-plus-menu" ref={plusMenuRef}>
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
          </div>
        )}

        <div className="ai-input-pill">
          {/* Plus / Attach button — toggles popup */}
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

          {/* Right actions: mic + send */}
          <div className="ai-pill-right">
            {!input.trim() ? (
              <>
                <button
                  className={`ai-pill-btn mic ${isListening ? "listening" : ""}`}
                  onClick={toggleVoice}
                  title={isListening ? "Stop" : "Voice"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button className="ai-pill-send idle" disabled>
                  <AudioLines size={20} />
                </button>
              </>
            ) : (
              <button
                className="ai-pill-send active"
                onClick={() => handleSend()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <ArrowUp size={18} strokeWidth={2.5} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AI;