const { GITHUB_REPOSITORY, PLANE_WORKSPACE_SLUG } = require("../../config");
const { STATUS_QUEUED, STATUS_INPROGRESS, STATUS_COMPLETED, STATUS_FAILED } = require("../../constants");
const { sleepFor } = require("../../utils/helper");
const { logger } = require("../../utils/logger");
const { addSyncJobToQueue } = require("../config/queue");
const { broadcastSyncProgress } = require("../config/socket");
const { SyncJobModel } = require("../models/syncJobModel");
const GithubService = require("./githubService");
const PlaneService = require("./planeService");


class IssueSyncService {

    async createSyncJob(jobId) {
        try {
            return await SyncJobModel.create({
                jobId,
                githubRepo: GITHUB_REPOSITORY,
                planeWorkspace: PLANE_WORKSPACE_SLUG,
                status: STATUS_QUEUED
            })
        } catch (e) {
            logger.error("error while createSyncJob", { err: e?.message })
            throw e
        }
    }

    async checkSyncStatus({ jobId }) {
        try {
            const syncJob = await SyncJobModel.findOne({
                jobId,
                githubRepo: GITHUB_REPOSITORY,
                planeWorkspace: PLANE_WORKSPACE_SLUG,
            });
            return { status: syncJob.status, progress: syncJob.progress };
        } catch (e) {
            logger.error("error while isJobAlreadyInProgress", { err: e?.message })
            throw e
        }
    };

    async isJobAlreadyInProgress() {
        try {
            const existingJob = await SyncJobModel.findOne({
                githubRepo: GITHUB_REPOSITORY,
                planeWorkspace: PLANE_WORKSPACE_SLUG,
                status: { $in: [STATUS_QUEUED, STATUS_INPROGRESS] }
            });

            return !!existingJob;
        } catch (e) {
            logger.error("error while isJobAlreadyInProgress", { err: e?.message })
            throw e
        }
    };

    async updateSyncJobProgress({ jobId, progress, status, errorMessage }) {
        try {
            const job = await SyncJobModel.findOne({ jobId: jobId });
            job.progress = progress;
            job.status = status;

            if (status === STATUS_INPROGRESS && !job.startedAt) {
                job.startedAt = new Date();
            }

            if (status === STATUS_COMPLETED) {
                job.completedAt = new Date();
            }

            if (status === STATUS_FAILED) {
                job.errorMessage = errorMessage;
            }

            return await job.save();
        } catch (e) {
            logger.error("error while updateSyncJobProgress", { err: e?.message })
            throw e
        }
    };


    async startSyncJob() {
        try {
            logger.debug("starting sync job")
            // create sync job if not in progress or queued
            const isInProgress = await this.isJobAlreadyInProgress();
            if (isInProgress) {
                return { message: "Sync already in progress" }
            }
            // push in bull queue
            const jobId = new Date().getTime().toString()
            await addSyncJobToQueue(jobId)
            const syncjob = await this.createSyncJob(jobId)

            return { message: "Sync started", body: syncjob }
        } catch (e) {
            logger.error("error while startSyncJob", { err: e?.message })
            throw e
        }
    }

    async startSync(jobId) {
        try {
            // update the status of job
            await this.updateSyncJobProgress({ jobId, progress: 0, status: STATUS_INPROGRESS })
            // broadcast message
            broadcastSyncProgress(jobId, 0, STATUS_INPROGRESS)

            // start the sync
            const githubService = new GithubService()
            const planeService = new PlaneService()
            const issues = await githubService.fetchAllOpenIssues();
            // TODO: handle already created issues in plane

            for (let i = 0; i < issues.length; i++) {
                await sleepFor(10000);
                const issue = issues[i];
                const { title, number } = issue

                // TODO: handle rate limit in plane service and github
                await planeService.createIssue({ name: title, number })

                const progress = Math.round((i / issues.length) * 100)
                broadcastSyncProgress(jobId, progress, STATUS_INPROGRESS)

                // updating in db at 10% intervals
                if (progress % 10 === 0) {
                    await this.updateSyncJobProgress({ jobId, progress, status: STATUS_INPROGRESS })
                }
            }

            // complete status update
            await this.updateSyncJobProgress({ jobId, progress: 100, status: STATUS_COMPLETED })
            // broadcast message
            broadcastSyncProgress(jobId, 100, STATUS_COMPLETED)

            logger.info("Issues Sync Completed for jobId", { jobId })
            return { message: "Sync completed" }
        } catch (e) {
            logger.error("error while startSync", { err: e?.message })
            await this.updateSyncJobProgress({ jobId, progress: 100, status: STATUS_FAILED, errorMessage: e?.message })
            throw e
        }
    }

}

const issueSyncService = new IssueSyncService();

module.exports = issueSyncService;