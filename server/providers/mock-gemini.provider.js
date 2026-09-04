const BaseProvider = require('./provider.interface');
const prompts = require('../orchestrator/prompts');
const { delay, fixedMockDelay, rangedMockDelay, extractSections } = require('./mock-utils');
const kb = require('./mock-knowledge-base');

class MockGeminiProvider extends BaseProvider {
  constructor(model = 'mock-gemini-1') {
    super('Gemini');
    this.model = model;
  }

  async generateResponse(systemPrompt, userPrompt) {
    if (systemPrompt === prompts.CHAT_GEMINI_PROMPT) {
      await delay(fixedMockDelay('CHAT_GEMINI', 500));
      return this._ok(kb.buildChatGreeting());
    }

    if (systemPrompt === prompts.CHAT_SYNTHESIS_PROMPT) {
      await delay(fixedMockDelay('CHAT_SYNTHESIS', 400));
      return this._ok(kb.buildChatSynthesis());
    }

    if (systemPrompt === prompts.ARCHITECT_SYSTEM_PROMPT) {
      await delay(rangedMockDelay('TASK_STEP1', 1000, 1500));
      const { 'User Task': task } = extractSections(userPrompt, ['User Task']);
      return this._ok(kb.buildProposal(task || userPrompt));
    }

    if (systemPrompt === prompts.REVISER_SYSTEM_PROMPT) {
      await delay(rangedMockDelay('TASK_STEP3', 1000, 1500));
      const sections = extractSections(userPrompt, ['User Task', 'Proposal', 'Critique']);
      return this._ok(
        kb.buildRevision(sections['User Task'] || '', sections['Proposal'] || '', sections['Critique'] || '')
      );
    }

    await delay(fixedMockDelay('DEFAULT', 300));
    return this._ok(`Gemini — Architect:\n${userPrompt}`);
  }

  _ok(content) {
    return { success: true, content, provider: this.name, model: this.model };
  }
}

module.exports = MockGeminiProvider;