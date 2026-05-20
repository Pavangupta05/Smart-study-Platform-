/**
 * AI Provider Abstraction
 * Supports switching between AI providers via AI_PROVIDER env variable.
 * Add new providers here without touching route logic.
 */

const geminiService = require("./gemini.service");
const groqService = require("./groq.service");
const openrouterService = require("./openrouter.service");

// Claude stub — ready for future integration
const claudeService = {
  chat: async () => {
    throw new Error("Claude provider not yet configured. Set ANTHROPIC_API_KEY.");
  },
  streamChat: async (messages, context, res) => {
    res.write(`data: ${JSON.stringify({ error: "Claude not configured." })}\n\n`);
    res.end();
  },
  generateFlashcards: async () => {
    throw new Error("Claude provider not configured.");
  },
};

const providers = {
  gemini: geminiService,
  claude: claudeService,
  groq: groqService,
  openrouter: openrouterService,
};

/**
 * Get the active AI provider based on environment config or requested override.
 * Falls back to environment default, then Gemini if neither is available.
 */
function getProvider(requestedProvider) {
  let providerName = (requestedProvider || process.env.AI_PROVIDER || "gemini").toLowerCase();
  
  // Verify requested provider exists, else fallback to env
  if (requestedProvider && !providers[providerName]) {
    providerName = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  }

  const provider = providers[providerName];
  if (!provider) {
    console.warn(`⚠️  AI provider "${providerName}" not found. Falling back to Gemini.`);
    return providers.gemini;
  }
  return provider;
}

module.exports = { getProvider, providers };
