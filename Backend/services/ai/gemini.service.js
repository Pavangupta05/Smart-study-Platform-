const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const STUDY_SYSTEM_PROMPT = `You are StarNote AI, an advanced, highly intelligent study assistant and premium AI tutor.

🎯 CORE BEHAVIOR & TONE:
- Be profoundly insightful, articulate, and highly structured.
- Use a calm, professional, yet encouraging tone. Never sound robotic or overly enthusiastic.
- Prioritize depth, clarity, and precision in your explanations.
- Never use unnecessary filler words. Get straight to the value.

🧠 RESPONSE STRUCTURE & FORMATTING:
- YOU MUST use rich Markdown formatting (bolding, italics, code blocks, blockquotes) to make your response highly scannable and beautiful.
- Use distinct sections with clear \`###\` headings.
- Break down complex concepts into numbered lists or bullet points.
- When explaining concepts, provide vivid analogies, real-world examples, or high-quality code snippets.
- End your responses with a 💡 **Key Takeaway** or actionable advice.

✨ MODE DETECTION:
- "summarize" → highly structured, profound key points without losing critical nuance.
- "explain" → a rigorous, step-by-step breakdown of the concept from first principles.
- "quiz" or "test me" → generate challenging, thought-provoking questions.
- "flashcards" → generate Q&A pairs in structured format.
- Default → profound, comprehensive explanation mode.`;

/**
 * Build the system prompt with optional context awareness
 */
function buildSystemPrompt(context = {}) {
  let prompt = STUDY_SYSTEM_PROMPT;

  if (context.currentPage) {
    prompt += `\n\n📍 CONTEXT: The user is currently on the "${context.currentPage}" page.`;
  }
  if (context.currentNote) {
    prompt += `\n📝 ACTIVE NOTE: "${context.currentNote.name}" — the user may be asking about this.`;
  }
  if (context.selection) {
    prompt += `\n🔍 SELECTED TEXT: The user highlighted: "${context.selection.substring(0, 500)}"`;
  }
  if (context.document) {
    prompt += `\n📄 DOCUMENT CONTEXT: User is reading "${context.document}"`;
  }
  if (context.language) {
    prompt += `\n\n🌐 LANGUAGE: ${context.language}`;
  }
  if (context.systemPrompt) {
    prompt += `\n\n📌 TASK:\n${context.systemPrompt}`;
  }
  if (context.multiDocContext) {
    const names = context.contextNoteNames ? context.contextNoteNames.join(", ") : "multiple notes";
    prompt += `\n\n📚 KNOWLEDGE BASE (${names}):\nThe user has provided multiple study documents as context. Use them to answer questions accurately and cite sources using [Note: <name>] format when referencing specific content.\n\n${context.multiDocContext}`;
  }

  return prompt;
}

/**
 * Standard (non-streaming) chat completion
 */
async function chat(messages = [], context = {}) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = buildSystemPrompt(context);

  // Build conversation history for the prompt
  const historyText = messages
    .slice(-10) // last 10 messages for context window efficiency
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const lastMessage = messages[messages.length - 1];
  const userQuery = lastMessage?.text || "";

  const fullPrompt = `${systemPrompt}\n\n--- Conversation History ---\n${historyText}\n\n--- Current Question ---\nUser: ${userQuery}\n\nStarNote AI:`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}

/**
 * Generate flashcards from a topic
 */
async function generateFlashcards(topic, count = 10) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate exactly ${count} flashcards for the topic: "${topic}".
Return ONLY a valid JSON array. Each object must have "question" and "answer" keys.
Example: [{"question": "What is X?", "answer": "X is..."}]
No extra text, no markdown, no code fences. Just the JSON array.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text().trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(text);
}

/**
 * Optimize a study schedule
 */
async function optimizeSchedule(tasks) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const taskList = tasks
    .map(
      (t) =>
        `${t.time} - ${t.text || t.title} (${t.priority || t.load} difficulty, type: ${t.type})`
    )
    .join("\n");

  const prompt = `You are a study schedule optimizer. Given this student's study plan:\n\n${taskList}\n\nOptimize by:\n1. Placing high-difficulty tasks during peak focus hours (8AM-11AM)\n2. Adding strategic breaks after intense sessions\n3. Grouping related subjects\n4. Ensuring rest periods\n\nReturn EXACTLY:\nTASKS: [{"time":"HH:MM","title":"...","load":"High|Medium|Low|None","type":"task|break"}]\nTIP: One-line optimization tip`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

/**
 * Streaming chat via Server-Sent Events
 */
async function streamChat(messages = [], context = {}, res, file = null) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = buildSystemPrompt(context);
  const historyText = messages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const fullPrompt = `${systemPrompt}\n\n--- Conversation History ---\n${historyText}\n\nStarNote AI:`;

  let parts = [{ text: fullPrompt }];

  if (file && file.data) {
    parts.unshift({
      inlineData: {
        data: file.data,
        mimeType: file.type || "application/octet-stream",
      }
    });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const result = await model.generateContentStream(parts);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

module.exports = { chat, streamChat, generateFlashcards, optimizeSchedule, buildSystemPrompt };
