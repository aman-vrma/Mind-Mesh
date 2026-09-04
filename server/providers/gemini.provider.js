const { GoogleGenAI } = require('@google/genai');
const BaseProvider = require('./provider.interface');
const logger = require('../utils/logger');

class GeminiProvider extends BaseProvider {
  constructor(apiKey, model = 'gemini-3.6-flash') {
    super('Gemini');
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generateResponse(systemPrompt, userPrompt, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          }
        });

        return {
          success: true,
          content: response.text,
          provider: this.name,
          model: this.model
        };
      } catch (error) {
        logger.warn(`Gemini Attempt ${attempt} failed: ${error.message}`);

        // Check if rate limited (429) or overloaded (503)
        const isRateLimit = error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED');
        const isServerBusy = error.message.includes('503') || error.message.includes('UNAVAILABLE');

        if ((isRateLimit || isServerBusy) && attempt < retries) {
          // Parse retry delay from error if present, else fallback to 15s for 429, 3s for 503
          let waitTime = 3000;
          if (isRateLimit) {
            const match = error.message.match(/retry in ([\d.]+)s/);
            waitTime = match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : 15000;
          }
          logger.info(`[Rate-Limit Protection] Waiting ${Math.round(waitTime / 1000)}s before retry attempt ${attempt + 1}...`);
          await new Promise((res) => setTimeout(res, waitTime));
        } else if (attempt === retries) {
          logger.error(`Gemini Final Execution Failed: ${error.message}`);
          return { success: false, error: error.message, provider: this.name };
        }
      }
    }
  }
}

module.exports = GeminiProvider;