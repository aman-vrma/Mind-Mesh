const Conversation = require('./conversation');
const prompts = require('./prompts');
const { ROLES, MESSAGE_TYPES, MAX_DISCUSSION_ROUNDS, TEAM_MODES } = require('../config/constants');
const logger = require('../utils/logger');

// Regex matches CONVERGENCE tag with optional markdown asterisks or trailing spaces/dots
const CONVERGENCE_TAG_RE = /(?:\*{0,2})CONVERGENCE(?:\*{0,2}):\s*(AGREE|CONTINUE)[^\n]*/i;

class Orchestrator {
  constructor(geminiProvider, openRouterProvider) {
    this.gemini = geminiProvider;
    this.openRouter = openRouterProvider;
  }

  // ============================================================
  // DISCUSSION DEPTH HINT
  // ============================================================
  detectDepth(task) {
    const text = (task || '').trim().toLowerCase();

    const simplePatterns = [
      /^(hi|hello|hey|hii|hiii)\b/,
      /^good (morning|afternoon|evening)\b/,
      /^how are you\b/,
      /^who are you\b/,
      /^what can you do\b/
    ];

    if (simplePatterns.some((pattern) => pattern.test(text))) {
      return 'SIMPLE';
    }

    const complexPatterns = [
      /\bdesign\b.*\b(system|architecture|application|platform)\b/,
      /\bbuild\b.*\b(full|complete|large|production)\b/,
      /\bmicroservices\b/,
      /\bscalable system\b/,
      /\bdistributed system\b/,
      /\bsystem design\b/,
      /\bcodebase\b/
    ];

    if (complexPatterns.some((pattern) => pattern.test(text)) || text.length > 500) {
      return 'COMPLEX';
    }

    return 'MEDIUM';
  }

  // ============================================================
  // TEAM MODE DETECTOR (Phase 5 Dynamic Teams)
  // ============================================================
  detectTeamMode(task, requestedMode = 'auto') {
    if (requestedMode && requestedMode !== 'auto') {
      return requestedMode;
    }

    const text = (task || '').toLowerCase();
    const isCoding = /\b(code|function|class|api|component|debug|script|bug|react|python|javascript|node|sql|database|css|html|endpoint|algorithm|test|fix|build app|backend|frontend|crud|schema)\b/.test(text);
    if (isCoding) return TEAM_MODES.DEV_SQUAD;

    const isResearch = /\b(research|compare|difference between|pros and cons|analysis|market|history|deep dive|explain in detail|study|evaluate|vs|versus|benchmark)\b/.test(text);
    if (isResearch) return TEAM_MODES.RESEARCH_TEAM;

    return TEAM_MODES.DUAL_MIND;
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

    const recent = history.slice(-12);
    const lines = recent.map((m) => {
      let speakerName = m.speaker || m.role;
      if (m.role === 'aria' || m.role === 'architect' || m.role === 'gemini') speakerName = 'Aria';
      else if (m.role === 'nexus' || m.role === 'reviewer' || m.role === 'openrouter') speakerName = 'Nexus';
      else if (m.role === 'cipher' || m.role === 'coder') speakerName = 'Cipher';
      else if (m.role === 'aegis' || m.role === 'security') speakerName = 'Aegis';
      else if (m.role === 'atlas' || m.role === 'researcher') speakerName = 'Atlas';
      else if (m.role === 'orion' || m.role === 'critic') speakerName = 'Orion';
      else if (m.role === 'orchestrator') speakerName = 'MindMesh';
      else if (m.role === 'user') speakerName = 'User';

      return `[${speakerName}]: ${m.content}`;
    });

    return `\n--- PREVIOUS CONVERSATION CONTEXT ---\n${lines.join('\n\n')}\n--------------------------------------\n\n`;
  }

  // ============================================================
  // FAILOVER EXECUTION HELPER
  // ============================================================
  async generateWithFailover(systemPrompt, userPrompt, primary = 'gemini') {
    const primaryClient = primary === 'gemini' ? this.gemini : this.openRouter;
    const fallbackClient = primary === 'gemini' ? this.openRouter : this.gemini;
    const primaryName = primary === 'gemini' ? 'Gemini' : 'OpenRouter';
    const fallbackName = primary === 'gemini' ? 'OpenRouter' : 'Gemini';

    let res = await primaryClient.generateResponse(systemPrompt, userPrompt);
    if (!res.success) {
      logger.warn(`[Orchestrator] ${primaryName} failed: ${res.error}. Attempting ${fallbackName} failover...`);
      res = await fallbackClient.generateResponse(systemPrompt, userPrompt);
    }
    if (!res.success) {
      throw new Error(`Execution failed across providers: ${res.error || 'Unknown error'}`);
    }
    return (res.content || '').trim();
  }

  // ============================================================
  // MAIN ENTRY POINT
  // ============================================================
  async runPipeline(task, onProgress = null, options = {}) {
    const depth = this.detectDepth(task);
    const teamMode = this.detectTeamMode(task, options.mode);
    const history = options.history || [];

    logger.info(`MindMesh pipeline starting [team: ${teamMode}, depth: ${depth}, historyTurns: ${history.length}] -> "${task}"`);

    const emit = (event, data = {}) => {
      if (typeof onProgress === 'function') {
        onProgress({
          event,
          timestamp: new Date().toISOString(),
          teamMode,
          depth,
          ...data
        });
      }
    };

    emit('intent_detected', { depth, task, teamMode });

    if (teamMode === TEAM_MODES.DEV_SQUAD) {
      return await this.runDevSquadPipeline(task, emit, history);
    } else if (teamMode === TEAM_MODES.RESEARCH_TEAM) {
      return await this.runResearchPipeline(task, emit, history);
    } else {
      return await this.runCollaborationPipeline(task, MAX_DISCUSSION_ROUNDS, emit, history);
    }
  }

  // ============================================================
  // 1. DUAL MIND PIPELINE (Aria & Nexus)
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

        // Aria turn
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'Aria',
          title: isFirstRound ? 'Initial Proposal' : `Aria Revision (Round ${round})`,
          statusMessage: isFirstRound ? 'Formulating architecture...' : 'Refining solution...'
        });

        const ai1UserPrompt = isFirstRound
          ? `${historyContext}User Request:\n${task}`
          : `${historyContext}Original User Request:\n${task}\n\nYour Previous Response:\n${ai1Latest}\n\nNexus Feedback:\n${ai2Latest}\n\nRespond to the feedback and refine your answer.`;

        ai1Latest = await this.generateWithFailover(prompts.AI1_SYSTEM_PROMPT, ai1UserPrompt, 'gemini');

        conversation.addMessage(
          ROLES.ARCHITECT,
          isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          isFirstRound ? 'Initial Proposal' : `Aria Revision (Round ${round})`,
          ai1Latest,
          round
        );

        emit('step_complete', {
          step: stepCount,
          role: ROLES.ARCHITECT,
          speaker: 'Aria',
          type: isFirstRound ? MESSAGE_TYPES.PROPOSAL : MESSAGE_TYPES.REVISION,
          title: isFirstRound ? 'Initial Proposal' : `Aria Revision (Round ${round})`,
          content: ai1Latest,
          round,
          statusMessage: 'Proposal ready'
        });

        // Nexus turn
        stepCount++;
        emit('step_start', {
          step: stepCount,
          role: ROLES.REVIEWER,
          speaker: 'Nexus',
          title: `Nexus Review (Round ${round})`,
          statusMessage: 'Evaluating solution & checking quality...'
        });

        const ai2UserPrompt = `${historyContext}Original User Request:\n${task}\n\nAria's Response:\n${ai1Latest}`;
        const rawNexus = await this.generateWithFailover(prompts.AI2_SYSTEM_PROMPT, ai2UserPrompt, 'openrouter');

        const { cleanContent, converged: signaledConverge } = this.parseConvergence(rawNexus, round);
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
          statusMessage: converged ? 'Review complete — consensus reached' : 'Review complete'
        });
      }

      // Final synthesis
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        title: 'Final Answer',
        statusMessage: 'Synthesizing final consensus...'
      });

      const synthesisPrompt = `${historyContext}User Request:\n${task}\n\nAria's Final Response:\n${ai1Latest}\n\nNexus's Final Evaluation:\n${ai2Latest}`;
      let finalContent = '';
      try {
        finalContent = await this.generateWithFailover(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt, 'gemini');
      } catch (err) {
        logger.warn(`[Orchestrator] Synthesis failed, falling back to Aria's verified response.`);
        finalContent = ai1Latest || 'Collaboration completed successfully.';
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
      summary.teamMode = 'dual_mind';
      summary.roundsUsed = round;

      emit('pipeline_complete', {
        step: stepCount,
        totalSteps: stepCount,
        summary,
        statusMessage: 'Collaboration complete'
      });

      return summary;
    } catch (error) {
      logger.error(`Dual Mind pipeline failed: ${error.message}`);
      emit('pipeline_error', { error: error.message });
      throw error;
    }
  }

  // ============================================================
  // 2. DEV SQUAD PIPELINE (Aria -> Cipher -> Aegis -> MindMesh)
  // ============================================================
  async runDevSquadPipeline(task, emit, history = []) {
    const conversation = new Conversation(task);
    const historyContext = this.buildHistoryContext(history);
    let stepCount = 0;

    try {
      // Step 1: Aria (Architect) — System & Architecture Specs
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.ARCHITECT,
        speaker: 'Aria',
        title: 'Architecture & System Design',
        statusMessage: 'Designing modular architecture & specifications...'
      });

      const ariaPrompt = `${historyContext}User Engineering Task:\n${task}\n\nCreate a clear, structured technical plan, architecture overview, and component breakdown for Cipher (our coder) to implement.`;
      const ariaOutput = await this.generateWithFailover(prompts.AI1_SYSTEM_PROMPT, ariaPrompt, 'gemini');

      conversation.addMessage(ROLES.ARCHITECT, MESSAGE_TYPES.PROPOSAL, 'Architecture & Specs', ariaOutput, 1);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.ARCHITECT,
        speaker: 'Aria',
        type: MESSAGE_TYPES.PROPOSAL,
        title: 'Architecture & System Design',
        content: ariaOutput,
        round: 1,
        statusMessage: 'Architecture ready'
      });

      // Step 2: Cipher (Coder) — Production Code Implementation
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.CODER,
        speaker: 'Cipher',
        title: 'Code Implementation',
        statusMessage: 'Writing production-ready code & algorithms...'
      });

      const cipherPrompt = `${historyContext}User Request:\n${task}\n\nAria's Architectural Plan:\n${ariaOutput}\n\nImplement the complete, clean, production-grade code according to Aria's plan. Include comments, types, and robust error handling.`;
      const cipherOutput = await this.generateWithFailover(prompts.CIPHER_SYSTEM_PROMPT, cipherPrompt, 'openrouter');

      conversation.addMessage(ROLES.CODER, MESSAGE_TYPES.CODE, 'Code Implementation', cipherOutput, 1);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.CODER,
        speaker: 'Cipher',
        type: MESSAGE_TYPES.CODE,
        title: 'Code Implementation',
        content: cipherOutput,
        round: 1,
        statusMessage: 'Code implementation complete'
      });

      // Step 3: Aegis (Security Auditor) — Security & Reliability Review
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.SECURITY,
        speaker: 'Aegis',
        title: 'Security & Edge Case Audit',
        statusMessage: 'Auditing code for vulnerabilities & edge cases...'
      });

      const aegisPrompt = `${historyContext}User Request:\n${task}\n\nAria's Plan:\n${ariaOutput}\n\nCipher's Code:\n${cipherOutput}\n\nPerform a security, reliability, and edge-case audit on Cipher's implementation. Identify any risks, vulnerabilities, or performance bottlenecks, and provide exact fixes.`;
      const aegisOutput = await this.generateWithFailover(prompts.AEGIS_SYSTEM_PROMPT, aegisPrompt, 'gemini');

      conversation.addMessage(ROLES.SECURITY, MESSAGE_TYPES.SECURITY_AUDIT, 'Security Audit', aegisOutput, 1);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.SECURITY,
        speaker: 'Aegis',
        type: MESSAGE_TYPES.SECURITY_AUDIT,
        title: 'Security & Edge Case Audit',
        content: aegisOutput,
        round: 1,
        statusMessage: 'Security audit complete'
      });

      // Step 4: MindMesh — Synthesis
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        title: 'Final Engineering Deliverable',
        statusMessage: 'Synthesizing verified code & deliverables...'
      });

      const synthesisPrompt = `${historyContext}User Request:\n${task}\n\nAria (Architecture):\n${ariaOutput}\n\nCipher (Code):\n${cipherOutput}\n\nAegis (Security Audit):\n${aegisOutput}\n\nCreate the final, complete, unified deliverable for the user with verified code, architecture, and reliability notes.`;
      let finalContent = '';
      try {
        finalContent = await this.generateWithFailover(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt, 'gemini');
      } catch (err) {
        finalContent = cipherOutput;
      }

      conversation.addMessage(ROLES.ORCHESTRATOR, MESSAGE_TYPES.FINAL, 'Final Answer', finalContent, 2);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        type: MESSAGE_TYPES.FINAL,
        title: 'Final Engineering Deliverable',
        content: finalContent,
        round: 2,
        statusMessage: 'Engineering deliverable ready'
      });

      const summary = conversation.getSummary(finalContent);
      summary.teamMode = 'dev_squad';
      summary.roundsUsed = 1;

      emit('pipeline_complete', {
        step: stepCount,
        totalSteps: stepCount,
        summary,
        statusMessage: 'Dev Squad engineering complete'
      });

      return summary;
    } catch (error) {
      logger.error(`Dev Squad pipeline failed: ${error.message}`);
      emit('pipeline_error', { error: error.message });
      throw error;
    }
  }

  // ============================================================
  // 3. RESEARCH PIPELINE (Atlas -> Orion -> MindMesh)
  // ============================================================
  async runResearchPipeline(task, emit, history = []) {
    const conversation = new Conversation(task);
    const historyContext = this.buildHistoryContext(history);
    let stepCount = 0;

    try {
      // Step 1: Atlas (Researcher)
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.RESEARCHER,
        speaker: 'Atlas',
        title: 'Deep Domain Research',
        statusMessage: 'Conducting comprehensive research & gathering insights...'
      });

      const atlasPrompt = `${historyContext}User Research Topic:\n${task}\n\nPerform a deep domain investigation. Provide clear factual findings, comparative options, pros/cons, and state-of-the-art standards.`;
      const atlasOutput = await this.generateWithFailover(prompts.ATLAS_SYSTEM_PROMPT, atlasPrompt, 'gemini');

      conversation.addMessage(ROLES.RESEARCHER, MESSAGE_TYPES.RESEARCH, 'Domain Research', atlasOutput, 1);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.RESEARCHER,
        speaker: 'Atlas',
        type: MESSAGE_TYPES.RESEARCH,
        title: 'Deep Domain Research',
        content: atlasOutput,
        round: 1,
        statusMessage: 'Research analysis complete'
      });

      // Step 2: Orion (Critic)
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.CRITIC,
        speaker: 'Orion',
        title: 'Critical Assessment & Trade-offs',
        statusMessage: 'Testing assumptions & identifying hidden trade-offs...'
      });

      const orionPrompt = `${historyContext}User Research Topic:\n${task}\n\nAtlas's Research Findings:\n${atlasOutput}\n\nCritique Atlas's findings: challenge any assumptions, identify real-world caveats, scalability bottlenecks, costs, and hidden risks.`;
      const orionOutput = await this.generateWithFailover(prompts.ORION_SYSTEM_PROMPT, orionPrompt, 'openrouter');

      conversation.addMessage(ROLES.CRITIC, MESSAGE_TYPES.CRITIQUE, 'Critical Assessment', orionOutput, 1);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.CRITIC,
        speaker: 'Orion',
        type: MESSAGE_TYPES.CRITIQUE,
        title: 'Critical Assessment & Trade-offs',
        content: orionOutput,
        round: 1,
        statusMessage: 'Critical assessment complete'
      });

      // Step 3: MindMesh — Synthesis
      stepCount++;
      emit('step_start', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        title: 'Synthesized Research Report',
        statusMessage: 'Synthesizing balanced findings & strategic recommendation...'
      });

      const synthesisPrompt = `${historyContext}User Research Topic:\n${task}\n\nAtlas (Research Findings):\n${atlasOutput}\n\nOrion (Critical Perspective):\n${orionOutput}\n\nSynthesize a balanced, highly actionable, authoritative research report with clear conclusions and recommendations for the user.`;
      let finalContent = '';
      try {
        finalContent = await this.generateWithFailover(prompts.SYNTHESIS_SYSTEM_PROMPT, synthesisPrompt, 'gemini');
      } catch (err) {
        finalContent = atlasOutput;
      }

      conversation.addMessage(ROLES.ORCHESTRATOR, MESSAGE_TYPES.FINAL, 'Final Answer', finalContent, 2);
      emit('step_complete', {
        step: stepCount,
        role: ROLES.ORCHESTRATOR,
        speaker: 'MindMesh',
        type: MESSAGE_TYPES.FINAL,
        title: 'Synthesized Research Report',
        content: finalContent,
        round: 2,
        statusMessage: 'Research report ready'
      });

      const summary = conversation.getSummary(finalContent);
      summary.teamMode = 'research_team';
      summary.roundsUsed = 1;

      emit('pipeline_complete', {
        step: stepCount,
        totalSteps: stepCount,
        summary,
        statusMessage: 'Research collaboration complete'
      });

      return summary;
    } catch (error) {
      logger.error(`Research pipeline failed: ${error.message}`);
      emit('pipeline_error', { error: error.message });
      throw error;
    }
  }
}

module.exports = Orchestrator;
