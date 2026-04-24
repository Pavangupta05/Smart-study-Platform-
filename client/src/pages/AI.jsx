import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import "../styles/ai.css";

// 🔥 init Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function AI() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I'm your AI Tutor. How can I help you with your studies today?" },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const chatEndRef = useRef(null);

  // 🔽 Handle initial message from GlobalAskAI
  useEffect(() => {
    if (location.state?.initialMessage) {
      handleSend(location.state.initialMessage);
      // Clear state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 🔽 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle messages from global bar (optional logic if needed)
  // For now, this is the chat area only.

  const handleSend = async (customInput) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join("\n");
      const prompt = historyText + `\nUser: ${textToSend}\nAssistant:`;
      
      const result = await model.generateContent(prompt);
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
          text: err?.message || "I had trouble processing that. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="ai-page fade-in">
      <div className="ai-header">
        <h1 className="page-title">AI Tutor</h1>
        <p className="page-subtitle">Ask questions and get help with your study materials.</p>
      </div>

      <div className="ai-container">
        {/* CHAT AREA */}
        <div className="chat-window">
          <div className="chat-scroll">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-message-inner">
                  <div className={`avatar ${msg.role}`}>
                    {msg.role === "user" ? <User size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div className="message-content">
                    <p>{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message ai loading-message">
                <div className="chat-message-inner">
                  <div className="avatar ai">
                    <Sparkles size={18} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
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