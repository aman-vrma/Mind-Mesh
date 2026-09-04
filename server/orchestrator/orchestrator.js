const Conversation = require('./conversation');
const prompts = require('./prompts');
const { ROLES, MESSAGE_TYPES, MAX_DISCUSSION_ROUNDS } = require('../config/constants');
const logger = require('../utils/logger');

// AI 2 is instructed to end every turn with a line in exactly this shape.
// This regex strips it out before the content ever reaches the timeline,
// the SSE payload, or the frontend.
const CONVERGENCE_LINE_RE = /\n?CONVERGENCE:\s*(AGREE|CONTINUE)\s*$/i;

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

  parseConvergence(rawContent) {
    const text = rawContent || '';
    const match = text.match(CONVERGENCE_LINE_RE);

    if (!match) {
      logger.warn('[Orchestrator] AI 2 response missing CONVERGENCE tag — defaulting to CONTINUE.');
      return { cleanContent: text.trim(), converged: false };
    }

    return {
      cleanContent: text.replace(CONVERGENCE_LINE_RE, '').trim(),
      converged: match[1].toUpperCase() === 'AGREE'
    };
  }

  // ============================================================
  // MAIN ENTRY POINT — every request collaborates.
  // ============================================================

  async runPipeline(task, onProgress = null) {
    const depth = this.detectDepth(task);
    // MAX_DISCUSSION_ROUNDS is the ONLY cap. Depth is informational —
    // it does not shorten or lengthen the ceiling. A round only ends
    // early because AI 2 signals CONVERGENCE: AGREE.
    const maxRounds = MAX_DISCUSSION_ROUNDS;
    logger.info(`MindMesh collaboration starting [depth: ${depth}, maxRounds: ${maxRounds}] -> "${task}"`);

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

    return await this.runCollaborationPipeline(task, maxRounds, emit);
  }

  // ============================================================
  // COLLABORATION LOOP
  // Every request runs AI1 -> AI2 at least once, then optionally
  // repeats (AI1 responds to feedback -> AI2 re-evaluates) until
  // AI 2 signals AGREE or maxRounds (the effective cap) is hit.
  // ============================================================

  async runCollaborationPipeline(task, maxRounds, emit) {
    const conversation = new Conversation(task);
    let stepCount = 0;
    let ai1Latest = null;
    let ai2Latest = null;
    let round = 0;
    let converged = false;

    try {
      while (round < maxRounds && !converged) {
        round++;
        const isFirstRound = round === 1;

        // ---------------- AI 1 turn ----------------
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'AI 1',
          title: isFirstRound ? 'Initial Analysis' : `AI 1 Response (Round ${round})`,
          statusMessage: isFirstRound ? 'Analyzing the task...' : 'Addressing feedback...'
        });

        const ai1UserPrompt = isFirstRound
          ? `User Request:\n${task}`
          : `Original User Request:\n${task}\n\nYour Previous Response:\n${ai1Latest}\n\nAI 2 Feedback:\n${ai2Latest}\n\nRespond to the feedback and refine your answer.`;

        const ai1Res = await this.gemini.generateResponse(prompts.AI1_SYSTEM_PROMPT, ai1UserPrompt);
        if (!ai1Res.success) {
          throw new Error(`AI 1 failed: ${ai1Res.error || 'Unknown error'}`);
        }

        ai1Latest = (ai1Res.content || '').trim();

        conversation.addMessage(
          ROLES.ARCHITECT,
          isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          isFirstRound ? 'Initial Analysis' : `AI 1 Response (Round ${round})`,
          ai1Latest,
          round
        );

        emit('step_complete', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'AI 1',
          type: isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          title: isFirstRound ? 'Initial Analysis' : `AI 1 Response (Round ${round})`,
          content: ai1Latest,
          round,
          statusMessage: 'Response ready'
        });

        // ---------------- AI 2 turn ----------------
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.REVIEWER,
          speaker: 'AI 2',
          title: `AI 2 Review (Round ${round})`,
          statusMessage: 'Evaluating the response...'
        });

        const ai2UserPrompt = `Original User Request:\n${task}\n\nAI 1's Response:\n${ai1Latest}`;

        const ai2Res = await this.openRouter.generateResponse(prompts.AI2_SYSTEM_PROMPT, ai2UserPrompt);
        if (!ai2Res.success) {
          throw new Error(`AI 2 failed: ${ai2Res.error || 'Unknown error'}`);
        }

        const { cleanContent, converged: signaledConverge } = this.parseConvergence(ai2Res.content);
        ai2Latest = cleanContent;
        converged = signaledConverge;

        conversation.addMessage(ROLES.REVIEWER, MESSAGE_TYPES.CRITIQUE, `AI 2 Review (Round ${round})`, ai2Latest, round);

        emit('step_complete', {
          step: stepCount,
          role: ROLES.REVIEWER,
          speaker: 'AI 2',
          type: MESSAGE_TYPES.CRITIQUE,
          title: `AI 2 Review (Round ${round})`,
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

      const synthesisPrompt = `User Request:\n${task}\n\nAI 1's Final Response:\n${ai1Latest}\n\nAI 2's Final Evaluation:\n${ai2Latest}`;
      const finalRes = await this.gemini.generateResponse(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt);
      if (!finalRes.success) {
        throw new Error(`Final synthesis failed: ${finalRes.error || 'Unknown error'}`);
      }

      const finalContent = (finalRes.content || '').trim();

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
