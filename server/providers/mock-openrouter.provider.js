const BaseProvider = require('./provider.interface');
const prompts = require('../orchestrator/prompts');
const { delay, fixedMockDelay, rangedMockDelay, extractSections } = require('./mock-utils');
const kb = require('./mock-knowledge-base');

class MockOpenRouterProvider extends BaseProvider {
  constructor(model = 'mock-openrouter-1') {
    super('OpenRouter');
    this.model = model;
  }

  async generateResponse(systemPrompt, userPrompt) {
    if (systemPrompt === prompts.CHAT_OPENROUTER_PROMPT) {
      await delay(fixedMockDelay('CHAT_OPENROUTER', 700));
      return this._ok(kb.buildChatReviewerIntro());
    }

    if (systemPrompt === prompts.REVIEWER_SYSTEM_PROMPT) {
      await delay(rangedMockDelay('TASK_STEP2', 1000, 1500));
      const sections = extractSections(userPrompt, ['User Task', 'Gemini Proposal']);
      return this._ok(kb.buildReview(sections['User Task'] || '', sections['Gemini Proposal'] || ''));
    }

    if (systemPrompt === prompts.SYNTHESIS_SYSTEM_PROMPT) {
      await delay(rangedMockDelay('TASK_STEP4', 1000, 1500));
      const sections = extractSections(userPrompt, ['User Task', 'Revision', 'Reviewer Notes']);
      return this._ok(
        kb.buildConsensus(sections['User Task'] || '', sections['Reviewer Notes'] || '', sections['Revision'] || '')
      );
    }

    await delay(fixedMockDelay('DEFAULT', 300));
    return this._ok(`OpenRouter — Reviewer:\n${userPrompt}`);
  }

  _ok(content) {
    return { success: true, content, provider: this.name, model: this.model };
  }
}

module.exports = MockOpenRouterProvider;