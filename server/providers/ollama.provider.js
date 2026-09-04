const BaseProvider = require('./provider.interface');
const logger = require('../utils/logger');

class OllamaProvider extends BaseProvider {
  constructor(model = 'qwen2.5:1.5b', baseUrl = 'http://127.0.0.1:11434') {
    super('Ollama');

    this.model = model;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async generateResponse(systemPrompt, userPrompt) {
    try {
      logger.info(`[Ollama] Generating response using ${this.model}`);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,

          prompt: userPrompt,

          system: systemPrompt,

          stream: false,

          options: {
            temperature: 0.7,
            num_ctx: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Ollama request failed: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        content: data.response,
        provider: this.name,
        model: this.model,
      };

    } catch (error) {
      logger.error(`Ollama Execution Failed: ${error.message}`);

      return {
        success: false,
        error: error.message,
        provider: this.name,
        model: this.model,
      };
    }
  }
}

module.exports = OllamaProvider;