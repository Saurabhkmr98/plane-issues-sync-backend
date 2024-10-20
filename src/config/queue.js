const Bull = require('bull');
const { STATUS_FAILED, STATUS_INPROGRESS, STATUS_QUEUED } = require('../../constants');
const { logger } = require('../../utils/logger');
const IssueSyncService = require('../services/syncService');
const { broadcastSyncProgress } = require('./socket');

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
};

// Initialize Bull queue
const syncQueue = new Bull('syncQueue', {
    redis: redisConfig,
});

// Define the job processing logic
syncQueue.process(async (job, done) => {
    const { jobId } = job.data;
    try {
        // Call the syncIssues service and pass necessary data
        const syncService = new IssueSyncService();
        logger.debug(`processing job ${jobId}`)
        broadcastSyncProgress(jobId, 0, STATUS_INPROGRESS)
        await syncService.startSync(jobId);
        // Mark the job as done once the sync is complete
        done();
    } catch (error) {
        console.error('Error processing sync job:', error);
        done(new Error('Sync job failed'));
    }
});

// Error handling
syncQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with error ${err.message}`);
    const { jobId } = job.data;
    broadcastSyncProgress(jobId, 100, STATUS_FAILED)
});

// Progress tracking (optional)
syncQueue.on('progress', (job, progress) => {
    logger.log(`Job ${job.id} is ${progress}% complete`);
});

const addSyncJobToQueue = async (jobId) => {
    logger.info(`Adding job to queue ${jobId}`, jobId)
    const resp = await syncQueue.add({
        jobId,
    });
    broadcastSyncProgress(jobId, 0, STATUS_QUEUED)
    return resp
};

module.exports = { syncQueue, addSyncJobToQueue };
