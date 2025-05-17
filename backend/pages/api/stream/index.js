// Server-Sent Events (SSE) API endpoint for real-time data streaming
import { withApi } from '../../../middleware';

let clients = [];

/**
 * Send data to all connected SSE clients
 * @param {string} eventType - Type of event
 * @param {Object} data - Data to send
 */
export const sendEventToClients = (eventType, data) => {
  clients.forEach(client => {
    client.write(`event: ${eventType}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

/**
 * SSE endpoint handler
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
const handleSSE = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' });
  }

  // Headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send an initial connection message
  const data = {
    message: 'Connected to server-sent events stream'
  };
  
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Add this client to the clients array
  clients.push(res);

  // When client closes connection, remove from clients array
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    console.log('SSE client disconnected, remaining clients:', clients.length);
  });
};

export default withApi(handleSSE, { auth: false });