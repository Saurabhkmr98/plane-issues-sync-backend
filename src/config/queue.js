const Bull = require('bull');
const { logger } = require('../../utils/logger');


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
        const syncService = require('../services/syncService');
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
});

// Progress tracking (optional)
syncQueue.on('progress', (job, progress) => {
    logger.log(`Job ${job.id} is ${progress}% complete`);
});

const addSyncJobToQueue = async (jobId) => {
    logger.info("Adding job to queue", { jobId })
    return await syncQueue.add({
        jobId,
    });
};

module.exports = { syncQueue, addSyncJobToQueue };
