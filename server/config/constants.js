module.exports = {
  ROLES: {
    USER: 'user',
    ARCHITECT: 'gemini',
    REVIEWER: 'openrouter',
    ORCHESTRATOR: 'orchestrator'
  },
  MESSAGE_TYPES: {
    TASK: 'task',
    PROPOSAL: 'proposal',
    CRITIQUE: 'critique',
    REVISION: 'revision',
    FINAL: 'final',
    ERROR: 'error'
  },
  // Hard safety ceiling on AI1<->AI2 discussion rounds.
  // This is a MAXIMUM, not a mandatory round count. The discussion
  // always stops early when AI 2 signals CONVERGENCE: AGREE; this
  // constant only bounds how far it can go if it never agrees.
  MAX_DISCUSSION_ROUNDS: 4
};