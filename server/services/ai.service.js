const config = require('../config/env');

const GeminiProvider = require('../providers/gemini.provider');
const OpenRouterProvider = require('../providers/openrouter.provider');

const Orchestrator = require('../orchestrator/orchestrator');

class AIService {
  constructor() {
    /*
     * MindMesh is cloud-provider-only:
     * AI 1 -> Gemini
     * AI 2 -> OpenRouter
     * Local/Ollama routing has been intentionally removed.
     */
    console.log(
      '[AIService] Using live Gemini (AI 1) / OpenRouter (AI 2) providers.'
    );

    this.gemini = new GeminiProvider(
      config.geminiApiKey,
      config.geminiModel
    );

    this.openRouter = new OpenRouterProvider(
      config.openrouterApiKey,
      config.openrouterModel
    );

    this.orchestrator = new Orchestrator(
      this.gemini,
      this.openRouter
    );
  }

  async processTask(task, onProgress = null, options = {}) {
    if (
      !task ||
      typeof task !== 'string' ||
      task.trim().length === 0
    ) {
      throw new Error('Valid task string is required.');
    }

    return await this.orchestrator.runPipeline(
      task.trim(),
      onProgress,
      options
    );
  }
}

module.exports = new AIService();