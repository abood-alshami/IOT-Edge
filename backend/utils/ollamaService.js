/**
 * Ollama AI Service
 * Integrates with local Ollama LLM server for on-premise AI capabilities
 */

const fetch = require('node-fetch');
const config = require('../config');
const logger = require('./logger');

class OllamaService {
  constructor() {
    this.endpoint = config.ai.ollamaEndpoint || 'http://localhost:11434';
    this.defaultModel = config.ai.ollamaDefaultModel || 'llama3';
  }

  /**
   * Generate a completion from the Ollama API
   * @param {Object} options - Options for the completion
   * @param {string} options.prompt - The prompt to send to the model
   * @param {string} options.model - The model to use (defaults to config)
   * @param {number} options.temperature - Temperature parameter (0.0-1.0)
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @returns {Promise<Object>} - Response from Ollama
   */
  async generateCompletion(options) {
    try {
      const { 
        prompt, 
        model = this.defaultModel, 
        temperature = 0.7, 
        maxTokens = 500
      } = options;

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error(`Ollama API error: ${JSON.stringify(errorData)}`);
        throw new Error(`Ollama API error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Error generating completion from Ollama: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available models from Ollama
   * @returns {Promise<Array>} - List of available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error(`Ollama API error: ${JSON.stringify(errorData)}`);
        throw new Error(`Ollama API error: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      logger.error(`Error listing Ollama models: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Ollama service is available
   * @returns {Promise<boolean>} - True if Ollama is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.endpoint}/api/version`, {
        method: 'GET',
        timeout: 5000,
      });
      
      return response.ok;
    } catch (error) {
      logger.warn(`Ollama service not available: ${error.message}`);
      return false;
    }
  }

  /**
   * Analyze sensor data using Ollama
   * @param {Object} sensorData - The sensor data to analyze
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeSensorData(sensorData) {
    const prompt = `
    Analyze this IoT sensor data and provide insights:
    ${JSON.stringify(sensorData, null, 2)}
    
    Provide the following analysis:
    1. Are there any anomalies in the data?
    2. What are the trends over time?
    3. Any recommendations based on the data?
    4. Predicted values for the next 24 hours
    `;

    try {
      const result = await this.generateCompletion({
        prompt,
        temperature: 0.3,
        maxTokens: 800,
      });

      return {
        analysis: result.response,
        timestamp: new Date().toISOString(),
        model: result.model,
      };
    } catch (error) {
      logger.error(`Error analyzing sensor data with Ollama: ${error.message}`);
      throw error;
    }
  }
}

// Create singleton instance
const ollamaService = new OllamaService();

module.exports = ollamaService;