const Conversation = require('./conversation');
const prompts = require('./prompts');
const { ROLES, MESSAGE_TYPES, MAX_DISCUSSION_ROUNDS } = require('../config/constants');
const logger = require('../utils/logger');

// AI 2 is instructed to end turns with a CONVERGENCE: AGREE / CONTINUE tag.
// Regex matches tag even with markdown asterisks (**CONVERGENCE:** AGREE) or trailing dots/spaces.
const CONVERGENCE_TAG_RE = /(?:\*{0,2})CONVERGENCE(?:\*{0,2}):\s*(AGREE|CONTINUE)[^\n]*/i;

class Orchestrator {
  constructor(geminiProvider, openRouterProvider) {
    this.gemini = geminiProvider;
    this.openRouter = openRouterProvider;
  }

  // ============================================================
  // DISCUSSION DEPTH HINT
  // Informational only — used for status/telemetry, never to cap
  // or skip rounds. The only cap on round count is the hard
  // MAX_DISCUSSION_ROUNDS ceiling in runPipeline(). A SIMPLE query
  // that genuinely needs a follow-up round (AI 2 returns CONTINUE)
  // is allowed to take one, exactly like a COMPLEX query would.
  // ============================================================

  detectDepth(task) {
    const text = (task || '').trim().toLowerCase();

    const simplePatterns = [
      /^(hi|hello|hey|hii|hiii)\b/,
      /^good (morning|afternoon|evening)\b/,
      /^how are you\b/,
      /^who are you\b/,
      /^what can you do\b/,
      /^explain\b/,
      /^what is\b/,
      /^what are\b/,
      /^how does\b/,
      /^how do\b/,
      /^why\b/,
      /^write\b/,
      /^create a function\b/,
      /^give me\b/,
      /^teach me\b/,
      /^tell me\b/,
      /^help me\b/,
      /^can you\b/,
      /^show me\b/,
      /^fix this code\b/,
      /^debug\b/,
      /^solve\b/
    ];

    if (simplePatterns.some((pattern) => pattern.test(text))) {
      return 'SIMPLE';
    }

    const complexPatterns = [
      /\bdesign\b.*\b(system|architecture|application|platform)\b/,
      /\bbuild\b.*\b(full|complete|large|production)\b/,
      /\barchitecture\b/,
      /\bmicroservices\b/,
      /\bscalable system\b/,
      /\bproduction[- ]grade\b/,
      /\bhigh[- ]level design\b/,
      /\bdistributed system\b/,
      /\bsystem design\b/,
      /\bproject plan\b/,
      /\bcomplex project\b/,
      /\bsecurity review\b/,
      /\bcodebase\b/,
      /\bmultiple files\b/,
      /\bentire project\b/
    ];

    if (complexPatterns.some((pattern) => pattern.test(text)) || text.length > 500) {
      return 'COMPLEX';
    }

    return 'MEDIUM';
  }

  // ============================================================
  // CONVERGENCE TAG PARSING
  // ============================================================

  parseConvergence(rawContent, round = 1) {
    const text = rawContent || '';
    const match = text.match(CONVERGENCE_TAG_RE);

    if (match) {
      const cleanContent = text.replace(new RegExp(CONVERGENCE_TAG_RE.source, 'gi'), '').trim();
      return {
        cleanContent,
        converged: match[1].toUpperCase() === 'AGREE'
      };
    }

    logger.warn('[Orchestrator] AI 2 response missing CONVERGENCE tag — checking sentiment fallback.');
    const lower = text.toLowerCase();
    const expressesAgreement = 
      lower.includes('solid') || 
      lower.includes('spot-on') || 
      lower.includes('looks good') || 
      lower.includes('great start') || 
      lower.includes('agree') ||
      lower.includes('welcome to mindmesh') ||
      lower.includes('covers everything');

    return {
      cleanContent: text.trim(),
      converged: expressesAgreement || round >= 2
    };
  }

  // ============================================================
  // CONVERSATION HISTORY HELPER
  // ============================================================

  buildHistoryContext(history = []) {
    if (!Array.isArray(history) || history.length === 0) return '';

    // Take recent messages (up to 12 messages) to keep context concise
    const recent = history.slice(-12);
    const lines = recent.map((m) => {
      let speakerName = m.speaker || m.role;
      if (m.role === 'gemini' || m.role === 'architect') speakerName = 'Aria';
      else if (m.role === 'openrouter' || m.role === 'reviewer') speakerName = 'Nexus';
      else if (m.role === 'orchestrator') speakerName = 'MindMesh';
      else if (m.role === 'user') speakerName = 'User';

      return `[${speakerName}]: ${m.content}`;
    });

    return `\n--- PREVIOUS CONVERSATION CONTEXT ---\n${lines.join('\n\n')}\n--------------------------------------\n\n`;
  }

  // ============================================================
  // MAIN ENTRY POINT — every request collaborates.
  // ============================================================

  async runPipeline(task, onProgress = null, options = {}) {
    const depth = this.detectDepth(task);
    const maxRounds = MAX_DISCUSSION_ROUNDS;
    const history = options.history || [];
    logger.info(`MindMesh collaboration starting [depth: ${depth}, maxRounds: ${maxRounds}, historyTurns: ${history.length}] -> "${task}"`);

    const emit = (event, data = {}) => {
      if (typeof onProgress === 'function') {
        onProgress({
          event,
          timestamp: new Date().toISOString(),
          mode: 'COLLABORATE',
          depth,
          maxRounds,
          ...data
        });
      }
    };

    emit('intent_detected', { depth, task });

    return await this.runCollaborationPipeline(task, maxRounds, emit, history);
  }

  // ============================================================
  // COLLABORATION LOOP
  // ============================================================

  async runCollaborationPipeline(task, maxRounds, emit, history = []) {
    const conversation = new Conversation(task);
    const historyContext = this.buildHistoryContext(history);
    let stepCount = 0;
    let ai1Latest = null;
    let ai2Latest = null;
    let round = 0;
    let converged = false;

    try {
      while (round < maxRounds && !converged) {
        round++;
        const isFirstRound = round === 1;

        // ---------------- AI 1 (Aria) turn ----------------
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'Aria',
          title: isFirstRound ? 'Initial Analysis' : `Aria Response (Round ${round})`,
          statusMessage: isFirstRound ? 'Analyzing the task...' : 'Addressing feedback...'
        });

        const ai1UserPrompt = isFirstRound
          ? `${historyContext}User Request:\n${task}`
          : `${historyContext}Original User Request:\n${task}\n\nYour Previous Response:\n${ai1Latest}\n\nNexus Feedback:\n${ai2Latest}\n\nRespond to the feedback and refine your answer.`;

        let ai1Res = await this.gemini.generateResponse(prompts.AI1_SYSTEM_PROMPT, ai1UserPrompt);
        if (!ai1Res.success) {
          logger.warn(`[Orchestrator] Aria (Gemini) failed: ${ai1Res.error}. Attempting OpenRouter failover for Aria...`);
          ai1Res = await this.openRouter.generateResponse(prompts.AI1_SYSTEM_PROMPT, ai1UserPrompt);
        }
        if (!ai1Res.success) {
          throw new Error(`AI 1 (Aria) failed: ${ai1Res.error || 'Unknown error'}`);
        }

        ai1Latest = (ai1Res.content || '').trim();

        conversation.addMessage(
          ROLES.ARCHITECT,
          isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          isFirstRound ? 'Initial Analysis' : `Aria Response (Round ${round})`,
          ai1Latest,
          round
        );

        emit('step_complete', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'Aria',
          type: isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          title: isFirstRound ? 'Initial Analysis' : `Aria Response (Round ${round})`,
          content: ai1Latest,
          round,
          statusMessage: 'Response ready'
        });

        // ---------------- AI 2 (Nexus) turn ----------------
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.REVIEWER,
          speaker: 'Nexus',
          title: `Nexus Review (Round ${round})`,
          statusMessage: 'Evaluating the response...'
        });

        const ai2UserPrompt = `${historyContext}Original User Request:\n${task}\n\nAria's Response:\n${ai1Latest}`;

        let ai2Res = await this.openRouter.generateResponse(prompts.AI2_SYSTEM_PROMPT, ai2UserPrompt);
        if (!ai2Res.success) {
          logger.warn(`[Orchestrator] Nexus (OpenRouter) failed: ${ai2Res.error}. Attempting Gemini failover for Nexus...`);
          ai2Res = await this.gemini.generateResponse(prompts.AI2_SYSTEM_PROMPT, ai2UserPrompt);
        }
        if (!ai2Res.success) {
          throw new Error(`AI 2 (Nexus) failed: ${ai2Res.error || 'Unknown error'}`);
        }

        const { cleanContent, converged: signaledConverge } = this.parseConvergence(ai2Res.content, round);
        ai2Latest = cleanContent;
        converged = signaledConverge;

        conversation.addMessage(ROLES.REVIEWER, MESSAGE_TYPES.CRITIQUE, `Nexus Review (Round ${round})`, ai2Latest, round);

        emit('step_complete', {
          step: stepCount,
          role: ROLES.REVIEWER,
          speaker: 'Nexus',
          type: MESSAGE_TYPES.CRITIQUE,
          title: `Nexus Review (Round ${round})`,
          content: ai2Latest,
          round,
          statusMessage: converged ? 'Review complete — agreement reached' : 'Review complete'
        });
      }

      // ---------------- Final synthesis ----------------
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        title: 'Final Answer',
        statusMessage: 'Creating the final answer...'
      });

      const synthesisPrompt = `${historyContext}User Request:\n${task}\n\nAria's Final Response:\n${ai1Latest}\n\nNexus's Final Evaluation:\n${ai2Latest}`;
      let finalContent = '';
      const finalRes = await this.gemini.generateResponse(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt);
      if (finalRes.success && finalRes.content) {
        finalContent = finalRes.content.trim();
      } else {
        logger.warn(`[Orchestrator] Gemini synthesis failed, attempting OpenRouter fallback synthesis: ${finalRes.error}`);
        const fallbackRes = await this.openRouter.generateResponse(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt);
        if (fallbackRes.success && fallbackRes.content) {
          finalContent = fallbackRes.content.trim();
        } else {
          logger.warn(`[Orchestrator] Both synthesizers unavailable, using Aria's latest verified response.`);
          finalContent = ai1Latest || 'Collaboration completed successfully.';
        }
      }

      conversation.addMessage(ROLES.ORCHESTRATOR, MESSAGE_TYPES.FINAL, 'Final Answer', finalContent, round + 1);

      emit('step_complete', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        type: MESSAGE_TYPES.FINAL,
        title: 'Final Answer',
        content: finalContent,
        round: round + 1,
        statusMessage: 'Final answer ready'
      });

      const summary = conversation.getSummary(finalContent);
      summary.mode = 'COLLABORATE';
      summary.roundsUsed = round;

      emit('pipeline_complete', {
        step: stepCount,
        totalSteps: stepCount,
        summary,
        statusMessage: 'Collaboration complete'
      });

      return summary;
    } catch (error) {
      logger.error(`Collaboration pipeline failed: ${error.message}`);
      emit('pipeline_error', { error: error.message });
      throw error;
    }
  }
}

module.exports = Orchestrator;
