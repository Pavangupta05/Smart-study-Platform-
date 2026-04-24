import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Sparkles, Mic, MicOff, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "../styles/ai.css";

// 🔥 init Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ✍️ Typewriter with Markdown support
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
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I'm your **AI Study Expert**. Ask me anything — I'll explain, summarize, or quiz you. 💡" },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const location = useLocation();
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // 🔽 Handle initial message from GlobalAskAI
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
      // Clear state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 🔽 Handle messages from GlobalAskAI while ALREADY on the AI page
  useEffect(() => {
    const handleGlobalAskAI = (e) => {
      if (e.detail) {
        handleSend(e.detail);
      }
    };
    window.addEventListener("globalAskAI", handleGlobalAskAI);
    return () => window.removeEventListener("globalAskAI", handleGlobalAskAI);
  }, [messages, loading]);

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 🎤 Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

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

    // Stop voice if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join("\n");
      const fullPrompt = `${systemPrompt}\n\nChat History:\n${historyText}\n\nUser Question: ${textToSend}\n\nAI Study Assistant:`;
      
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [
        ...prev,
        { role: "ai", text },
      ]);
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
      const savedFiles = JSON.parse(localStorage.getItem("starNote_files") || "[]");
      const newFile = {
        id: Date.now(),
        name: "AI Note - " + new Date().toLocaleDateString(),
        content: text,
        date: "Just now",
        icon: "🧠"
      };
      localStorage.setItem("starNote_files", JSON.stringify([newFile, ...savedFiles]));
      setSavedIndex(index);
      setTimeout(() => setSavedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
    }
  };

  const handleQuiz = (text) => {
    handleSend(`Please generate a short quiz (3-5 questions, mix of MCQ and short answer) based on this explanation:\n"${text}"`);
  };

  return (
    <div className="ai-page fade-in">
      <div className="ai-header">
        <h1 className="page-title">AI Tutor</h1>
        <p className="page-subtitle">Ask questions, get structured explanations, or generate quizzes instantly.</p>
      </div>

      <div className="ai-container">
        {/* CHAT AREA */}
        <div className="chat-window">
          <div className="chat-scroll">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-message-inner">
                  <div className={`avatar ${msg.role}`}>
                    {msg.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className="message-bubble">
                    {msg.role === "ai" && (
                      <div className="ai-badge-label">
                        <Sparkles size={10} />
                        <span>AI Study Expert</span>
                      </div>
                    )}
                    <div className="message-content">
                      {msg.role === "ai" && i === messages.length - 1 ? (
                        <TypewriterMarkdown text={msg.text} />
                      ) : msg.role === "ai" ? (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                    {msg.role === "ai" && (
                      <div className="message-actions">
                        <button 
                          className={`action-btn ${copiedIndex === i ? 'success' : ''}`}
                          onClick={() => handleCopy(msg.text, i)}
                        >
                          {copiedIndex === i ? "✓ Copied!" : "Copy"}
                        </button>
                        <button 
                          className={`action-btn ${savedIndex === i ? 'success' : ''}`}
                          onClick={() => handleSave(msg.text, i)}
                        >
                          {savedIndex === i ? "✓ Saved!" : "Save to Notes"}
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => handleQuiz(msg.text)}
                        >
                          Generate Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai skeleton">
                <div className="chat-message-inner">
                  <div className="avatar ai">
                    <Sparkles size={14} className="spin" />
                  </div>
                  <div className="message-bubble">
                    <div className="skeleton-text" style={{ width: '80%', height: 12, marginBottom: 8, borderRadius: 6 }}></div>
                    <div className="skeleton-text" style={{ width: '95%', height: 12, marginBottom: 8, borderRadius: 6 }}></div>
                    <div className="skeleton-text" style={{ width: '60%', height: 12, borderRadius: 6 }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="chat-anchor"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AI;