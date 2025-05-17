/**
 * Queue configuration for the IoT data processing system
 */

const queueConfig = {
  sensorData: {
    name: 'sensor-data-queue',
    concurrency: 10,
    options: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 1000,
      removeOnFail: false
    }
  },
  analytics: {
    name: 'analytics-queue',
    concurrency: 5,
    options: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 100,
      removeOnFail: false
    }
  },
  alerts: {
    name: 'alerts-queue',
    concurrency: 3,
    options: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 500,
      removeOnFail: false,
      priority: 1
    }
  }
};

export default queueConfig;