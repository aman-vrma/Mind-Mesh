const { ROLES, MESSAGE_TYPES } = require('../config/constants');

class Conversation {
  constructor(task) {
    this.task = task;
    this.timeline = [];
    this.startTime = Date.now();
    
    // Record initial task
    this.addMessage(ROLES.USER, MESSAGE_TYPES.TASK, 'User Task', task, 0);
  }

  addMessage(role, type, title, content, round = 1) {
    const message = {
      role,
      type,
      title,
      content,
      round,
      timestamp: new Date().toISOString()
    };
    this.timeline.push(message);
    return message;
  }

  getTimeline() {
    return this.timeline;
  }

  getSummary(finalResult) {
    return {
      success: true,
      task: this.task,
      totalRounds: Math.max(...this.timeline.map(m => m.round), 1),
      executionTimeMs: Date.now() - this.startTime,
      timeline: this.timeline,
      finalResult
    };
  }
}

module.exports = Conversation;