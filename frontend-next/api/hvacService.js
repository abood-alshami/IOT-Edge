import axios from './axiosConfig';

/**
 * Service for interacting with HVAC monitoring endpoints
 */
export const hvacService = {
  /**
   * Get all HVAC systems
   * @returns {Promise} Promise with HVAC systems data
   */
  getHvacSystems: async () => {
    try {
      const response = await axios.get('/api/monitoring/hvac-systems');
      return response.data;
    } catch (error) {
      console.error('Error fetching HVAC systems:', error);
      throw error;
    }
  },

  /**
   * Get a specific HVAC system by ID
   * @param {string} id - HVAC system ID
   * @returns {Promise} Promise with HVAC system data
   */
  getHvacSystemById: async (id) => {
    try {
      const response = await axios.get(`/api/monitoring/hvac-systems/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching HVAC system ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get HVAC system alerts
   * @param {string} id - HVAC system ID (optional)
   * @returns {Promise} Promise with HVAC alerts
   */
  getHvacAlerts: async (id = '') => {
    try {
      const url = id ? `/api/monitoring/hvac-systems/${id}/alerts` : '/api/monitoring/hvac-systems/alerts';
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching HVAC alerts:', error);
      throw error;
    }
  },

  /**
   * Get HVAC system performance metrics
   * @param {string} id - HVAC system ID
   * @param {string} timeRange - Time range for metrics (e.g., '24h', '7d', '30d')
   * @returns {Promise} Promise with HVAC performance data
   */
  getHvacPerformance: async (id, timeRange = '24h') => {
    try {
      const response = await axios.get(`/api/monitoring/hvac-systems/${id}/performance`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching HVAC performance data for ${id}:`, error);
      throw error;
    }
  }
};

export default hvacService; 