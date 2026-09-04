const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const aiRoutes = require('./routes/ai.routes');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', platform: 'MindMesh Orchestration Engine' });
});

// API Routes
app.use('/api/ai', aiRoutes);

app.listen(config.port, () => {
  logger.success(`🚀 MindMesh Server running at http://localhost:${config.port}`);
});