require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,

  // Live API providers
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel:
    process.env.GEMINI_MODEL || 'gemini-3.6-flash',

  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel:
    process.env.OPENROUTER_MODEL || 'openrouter/free',
};

if (!config.geminiApiKey) {
  console.warn(
    '⚠️ [Config Warning]: Missing GEMINI_API_KEY in .env'
  );
}

if (!config.openrouterApiKey) {
  console.warn(
    '⚠️ [Config Warning]: Missing OPENROUTER_API_KEY in .env'
  );
}

module.exports = config;