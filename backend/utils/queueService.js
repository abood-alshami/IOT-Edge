/**
 * Queue Service
 * Implements reliable message queuing for asynchronous processing of IoT data
 */
import Queue from 'bull';
import Redis from 'ioredis';
import queueConfig from './queueConfig.js';
import { sensorDataProcessor, analyticsProcessor, alertProcessor } from './queueProcessors.js';
import redisHealth from './redisHealth.js';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

// Store active queues
const queues = new Map();
let fallbackMode = false;

// Compression threshold in bytes (10KB)
const COMPRESSION_THRESHOLD = 10 * 1024;

/**
 * Compress data if it exceeds threshold
 */
async function compressData(data) {
  const jsonString = JSON.stringify(data);
  if (jsonString.length > COMPRESSION_THRESHOLD) {
    const compressed = await gzip(jsonString);
    return { compressed: true, data: compressed };
  }
  return { compressed: false, data };
}

/**
 * Decompress data if needed
 */
async function decompressData(payload) {
  if (payload.compressed) {
    const decompressed = await gunzip(payload.data);
    return JSON.parse(decompressed.toString());
  }
  return payload.data;
}

/**
 * Create and configure a queue with its processor
 */
const createQueue = async (queueType) => {
  if (!queueConfig[queueType]) {
    throw new Error(`Invalid queue type: ${queueType}`);
  }

  const config = queueConfig[queueType];
  
  if (!queues.has(config.name)) {
    const queue = new Queue(config.name, {
      redis: redisConfig,
      defaultJobOptions: config.options
    });

    // Enhanced error handling
    queue.on('error', (error) => {
      console.error(`Queue ${config.name} error:`, error);
      enableFallbackMode();
    });
    
    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} in queue ${config.name} failed:`, error);
      handleFailedJob(job, error);
    });

    // Add processor with decompression support
    let processor;
    switch (queueType) {
      case 'sensorData':
        processor = async (job) => {
          const decompressed = await decompressData(job.data);
          return sensorDataProcessor({ ...job, data: decompressed });
        };
        break;
      case 'analytics':
        processor = async (job) => {
          const decompressed = await decompressData(job.data);
          return analyticsProcessor({ ...job, data: decompressed });
        };
        break;
      case 'alerts':
        processor = async (job) => {
          const decompressed = await decompressData(job.data);
          return alertProcessor({ ...job, data: decompressed });
        };
        break;
    }

    if (processor) {
      queue.process(config.concurrency, processor);
      console.log(`Processor set up for queue ${config.name} with concurrency ${config.concurrency}`);
    }

    queues.set(config.name, queue);
  }

  return queues.get(config.name);
};

/**
 * Enable fallback mode for graceful degradation
 */
function enableFallbackMode() {
  if (!fallbackMode) {
    fallbackMode = true;
    console.log('Queue service entering fallback mode');
  }
}

/**
 * Disable fallback mode when system recovers
 */
function disableFallbackMode() {
  if (fallbackMode) {
    fallbackMode = false;
    console.log('Queue service recovered from fallback mode');
  }
}

/**
 * Handle failed jobs with retry logic
 */
async function handleFailedJob(job, error) {
  console.error(`Job ${job.id} failed:`, error);
  await storeFailedJob(job);
}

/**
 * Store failed jobs for later recovery
 */
async function storeFailedJob(job) {
  try {
    const client = redisHealth.client;
    if (client) {
      await client.lpush('failed_jobs', JSON.stringify({
        id: job.id,
        queue: job.queue.name,
        data: job.data,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('Error storing failed job:', error);
  }
}

/**
 * Add data to queue with compression
 */
async function addToQueue(queueName, data) {
  const queue = queues.get(queueName);
  if (!queue) throw new Error(`Queue ${queueName} not initialized`);

  if (fallbackMode) {
    await storeFailedJob({ id: Date.now(), queue: { name: queueName }, data });
    return null;
  }

  const compressed = await compressData(data);
  return queue.add(compressed);
}

/**
 * Initialize all queues and Redis health monitoring
 */
export const initializeQueues = async () => {
  try {
    await redisHealth.connect();
    redisHealth.on('error', enableFallbackMode);
    redisHealth.on('connected', disableFallbackMode);

    await Promise.all([
      createQueue('sensorData'),
      createQueue('analytics'),
      createQueue('alerts')
    ]);
    return true;
  } catch (error) {
    console.error('Error initializing queues:', error);
    enableFallbackMode();
    return false;
  }
};

/**
 * Add sensor data to processing queue
 */
export const addSensorData = async (data) => {
  return addToQueue(queueConfig.sensorData.name, data);
};

/**
 * Add data for analytics processing
 */
export const addAnalytics = async (data) => {
  return addToQueue(queueConfig.analytics.name, data);
};

/**
 * Add alert for processing
 */
export const addAlert = async (data) => {
  return addToQueue(queueConfig.alerts.name, data);
};

/**
 * Get queue statistics including Redis health
 */
export const getQueueStats = async () => {
  const stats = {};
  const redisStatus = await redisHealth.getStatus();

  for (const [name, queue] of queues) {
    stats[name] = {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount()
    };
  }

  return {
    queues: stats,
    redis: redisStatus,
    fallbackMode
  };
};

/**
 * Clean up resources during shutdown
 */
export const cleanUp = async () => {
  console.log('Cleaning up queue resources...');
  try {
    // Close all queue connections
    const closePromises = [];
    for (const [name, queue] of queues) {
      console.log(`Closing queue: ${name}`);
      closePromises.push(queue.close());
    }
    
    await Promise.all(closePromises);
    
    // Close Redis health connection
    if (redisHealth && typeof redisHealth.disconnect === 'function') {
      await redisHealth.disconnect();
    }
    
    console.log('Queue resources cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Error cleaning up queue resources:', error);
    return false;
  }
};

export default {
  initializeQueues,
  addSensorData,
  addAnalytics,
  addAlert,
  getQueueStats,
  cleanUp
};