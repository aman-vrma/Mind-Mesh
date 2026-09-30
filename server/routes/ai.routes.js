const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

// POST /api/ai/task (Preserved existing endpoint)
router.post('/task', async (req, res) => {
  const { task } = req.body;

  try {
    const result = await aiService.processTask(task);
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`API Error on /task: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Streaming endpoint supporting both GET and POST (for history payload)
const handleTaskStream = async (req, res) => {
  const task = req.method === 'POST' ? req.body.task : req.query.task;
  const history = req.method === 'POST' 
    ? (req.body.history || []) 
    : (req.query.history ? JSON.parse(req.query.history) : []);

  if (!task || !task.trim()) {
    return res.status(400).json({ success: false, error: 'Task is required.' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    await aiService.processTask(task.trim(), (eventData) => {
      sendSSE(eventData);
    }, { history });
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    logger.error(`SSE Streaming error: ${error.message}`);
    sendSSE({ event: 'pipeline_error', error: error.message });
    res.end();
  }

  req.on('close', () => {
    logger.info('Client closed SSE connection.');
  });
};

router.get('/task/stream', handleTaskStream);
router.post('/task/stream', handleTaskStream);

module.exports = router;