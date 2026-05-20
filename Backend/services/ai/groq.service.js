const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const STUDY_SYSTEM_PROMPT = `You are StarNote AI, an intelligent study assistant integrated into a premium AI-powered study workspace.

🎯 CORE BEHAVIOR:
- Respond like a smart, calm tutor — never robotic
- Use Markdown formatting for all responses
- Be concise but thorough; avoid padding
- Friendly and focused — respect the user's study time

🧠 RESPONSE STRUCTURE:
1. Short 1–2 line summary
2. Well-structured sections with bold headings or bullet lists
3. Key concepts clearly explained
4. A practical example, analogy, or code snippet when relevant
5. End with a 💡 **Tip** or quick takeaway

✨ MODE DETECTION:
- "summarize" → compress to key points only
- "explain" → step-by-step breakdown
- "quiz" or "test me" → generate 3–5 mixed questions (MCQ + short answer)
- "flashcards" → generate Q&A pairs in structured format
- Default → explanation mode`;

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

  return prompt;
}

/**
 * Standard (non-streaming) chat completion
 */
async function chat(messages = [], context = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in the environment.");
  }

  const systemPrompt = buildSystemPrompt(context);
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  return json.choices[0].message.content;
}

/**
 * Generate flashcards from a topic
 */
async function generateFlashcards(topic, count = 10) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in the environment.");
  }

  const prompt = `Generate exactly ${count} flashcards for the topic or text: "${topic}".
Return ONLY a valid JSON array. Each object must have "question" and "answer" keys.
Example: [{"question": "What is X?", "answer": "X is..."}]
No extra text, no markdown, no code fences. Just the JSON array.`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq flashcard generation failed: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  let text = json.choices[0].message.content.trim();
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  return JSON.parse(text);
}

/**
 * Optimize a study schedule
 */
async function optimizeSchedule(tasks) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined.");
  }

  const taskList = tasks
    .map(
      (t) =>
        `${t.time} - ${t.text || t.title} (${t.priority || t.load} difficulty, type: ${t.type})`
    )
    .join("\n");

  const prompt = `You are a study schedule optimizer. Given this student's study plan:\n\n${taskList}\n\nOptimize by:\n1. Placing high-difficulty tasks during peak focus hours (8AM-11AM)\n2. Adding strategic breaks after intense sessions\n3. Grouping related subjects\n4. Ensuring rest periods\n\nReturn EXACTLY:\nTASKS: [{"time":"HH:MM","title":"...","load":"High|Medium|Low|None","type":"task|break"}]\nTIP: One-line optimization tip`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq schedule optimization failed: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  return json.choices[0].message.content.trim();
}

/**
 * Streaming chat via Server-Sent Events
 */
async function streamChat(messages = [], context = {}, res, file = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ error: "GROQ_API_KEY not configured." })}\n\n`);
    res.end();
    return;
  }

  const systemPrompt = buildSystemPrompt(context);
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq stream request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === "data: [DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const dataJson = JSON.parse(trimmed.slice(6));
            const chunkText = dataJson.choices[0]?.delta?.content || "";
            if (chunkText) {
              res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Groq Stream Error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

module.exports = { chat, streamChat, generateFlashcards, optimizeSchedule, buildSystemPrompt };
