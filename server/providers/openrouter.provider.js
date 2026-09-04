const { OpenAI } = require('openai');
const BaseProvider = require('./provider.interface');
const logger = require('../utils/logger');

class OpenRouterProvider extends BaseProvider {
  constructor(apiKey, model = 'openrouter/free') {
    super('OpenRouter');
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'MindMesh'
      }
    });
    this.model = model;
  }

  async generateResponse(systemPrompt, userPrompt) {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      return {
        success: true,
        content: response.choices[0].message.content,
        provider: this.name,
        model: this.model
      };
    } catch (error) {
      logger.error(`OpenRouter Execution Failed: ${error.message}`);
      return { 
        success: false, 
        error: error.message, 
        provider: this.name 
      };
    }
  }
}

module.exports = OpenRouterProvider;