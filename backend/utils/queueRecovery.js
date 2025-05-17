/**
 * Queue Recovery Service
 * Handles recovery of failed jobs and system degradation scenarios
 */
import queueService from './queueService';
import redisHealth from './redisHealth';

class QueueRecoveryService {
  constructor() {
    this.recoveryInterval = null;
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    this.MAX_RECOVERY_ATTEMPTS = 10;
    this.RECOVERY_INTERVAL = 60000; // 1 minute
  }

  async startRecovery() {
    if (this.isRecovering) {
      console.log('Recovery already in progress');
      return;
    }

    this.isRecovering = true;
    this.recoveryInterval = setInterval(
      () => this.processFailedJobs(),
      this.RECOVERY_INTERVAL
    );

    console.log('Queue recovery service started');
  }

  async stopRecovery() {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
      this.recoveryInterval = null;
    }
    this.isRecovering = false;
    this.recoveryAttempts = 0;
    console.log('Queue recovery service stopped');
  }

  async processFailedJobs() {
    if (!redisHealth.isConnected) {
      console.log('Redis not connected, skipping recovery');
      return;
    }

    try {
      const client = redisHealth.client;
      
      // Process jobs in batches
      while (true) {
        const failedJob = await client.rpop('failed_jobs');
        if (!failedJob) break;

        const job = JSON.parse(failedJob);
        console.log(`Attempting to recover job ${job.id} from queue ${job.queue}`);

        try {
          switch (job.queue) {
            case 'sensor-data-processing':
              await queueService.addSensorData(job.data);
              break;
            case 'sensor-analytics':
              await queueService.addAnalytics(job.data);
              break;
            case 'alert-processing':
              await queueService.addAlert(job.data);
              break;
            default:
              console.warn(`Unknown queue type for recovery: ${job.queue}`);
          }
        } catch (error) {
          console.error(`Failed to recover job ${job.id}:`, error);
          // Push back to list if recovery failed
          await client.lpush('failed_jobs', JSON.stringify(job));
        }
      }

      // Reset recovery attempts on successful processing
      this.recoveryAttempts = 0;
    } catch (error) {
      console.error('Error during job recovery:', error);
      this.recoveryAttempts++;

      if (this.recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
        console.error('Max recovery attempts reached, stopping recovery service');
        await this.stopRecovery();
      }
    }
  }

  async getRecoveryStats() {
    if (!redisHealth.isConnected) {
      return {
        status: 'disconnected',
        failedJobsCount: 0,
        isRecovering: this.isRecovering,
        recoveryAttempts: this.recoveryAttempts
      };
    }

    const client = redisHealth.client;
    const failedJobsCount = await client.llen('failed_jobs');

    return {
      status: this.isRecovering ? 'recovering' : 'idle',
      failedJobsCount,
      isRecovering: this.isRecovering,
      recoveryAttempts: this.recoveryAttempts,
      nextRecoveryAttempt: this.isRecovering ? 
        new Date(Date.now() + this.RECOVERY_INTERVAL).toISOString() : null
    };
  }
}

// Create singleton instance
const recoveryService = new QueueRecoveryService();

export default recoveryService;