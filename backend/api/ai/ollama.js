/**
 * Ollama API Handler
 * Handles requests related to Ollama LLM operations
 */

const express = require('express');
const router = express.Router();
const ollamaService = require('../../utils/ollamaService');
const logger = require('../../utils/logger');
const auth = require('../../middleware/auth');

// Get Ollama service status
router.get('/status', auth, async (req, res) => {
  try {
    const isAvailable = await ollamaService.checkAvailability();
    res.json({ available: isAvailable });
  } catch (error) {
    logger.error(`Error checking Ollama status: ${error.message}`);
    res.status(500).json({ error: 'Failed to check Ollama service status' });
  }
});

// List available models
router.get('/models', auth, async (req, res) => {
  try {
    const models = await ollamaService.listModels();
    res.json({ models });
  } catch (error) {
    logger.error(`Error listing Ollama models: ${error.message}`);
    res.status(500).json({ error: 'Failed to list available models' });
  }
});

// Analyze sensor data
router.post('/analyze', auth, async (req, res) => {
  try {
    const { sensorData } = req.body;
    if (!sensorData) {
      return res.status(400).json({ error: 'No sensor data provided' });
    }

    const analysis = await ollamaService.analyzeSensorData(sensorData);
    res.json(analysis);
  } catch (error) {
    logger.error(`Error analyzing sensor data: ${error.message}`);
    res.status(500).json({ error: 'Failed to analyze sensor data' });
  }
});

// Generate completion
router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const completion = await ollamaService.generateCompletion({
      prompt,
      model,
      temperature,
      maxTokens
    });
    res.json(completion);
  } catch (error) {
    logger.error(`Error generating completion: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate completion' });
  }
});

module.exports = router;