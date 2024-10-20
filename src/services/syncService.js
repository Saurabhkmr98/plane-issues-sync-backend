const { default: mongoose } = require("mongoose");
const { GITHUB_REPOSITORY, PLANE_WORKSPACE_SLUG, PLANE_PROJECT_ID } = require("../../config");
const { STATUS_QUEUED, STATUS_INPROGRESS, STATUS_COMPLETED, STATUS_FAILED, GITHUB_STATUS_OPEN } = require("../../constants");
const { sleepFor } = require("../../utils/helper");
const { logger } = require("../../utils/logger");
const { broadcastSyncProgress } = require("../config/socket");
const { ProjectIssuesModel } = require("../models/projectIssuesModel");
const { SyncJobModel } = require("../models/syncJobModel");
const GithubService = require("./githubService");
const PlaneService = require("./planeService");
const ProjectIssuesService = require("./projectIssueService");


class IssueSyncService {

    async createSyncJob(jobId) {
        try {
            logger.debug("Starting sync job")
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
            logger.debug("check sync status")
            const syncJob = await SyncJobModel.findOne({
                jobId,
                githubRepo: GITHUB_REPOSITORY,
                planeWorkspace: PLANE_WORKSPACE_SLUG,
            });
            return { jobId, status: syncJob.status, progress: syncJob.progress };
        } catch (e) {
            logger.error("error while isJobAlreadyInProgress", { err: e?.message })
            throw e
        }
    };

    async isJobAlreadyInProgress() {
        try {
            logger.debug("check isJobAlreadyInProgress")
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
            logger.debug(`inside updateSyncJobProgress ${jobId} ${progress} ${status} ${errorMessage}`)
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

    async startSync(jobId) {
        try {
            await sleepFor(2000)
            // update the status of job
            await this.updateSyncJobProgress({ jobId, progress: 0, status: STATUS_INPROGRESS })
            // broadcast message
            broadcastSyncProgress(jobId, 0, STATUS_INPROGRESS)

            // start the sync
            const githubService = new GithubService()
            const planeService = new PlaneService()
            const projectIssuesService = new ProjectIssuesService()
            const issues = await githubService.fetchAllOpenIssues();


            // TODO: handle already created issues in plane
            const project = await ProjectIssuesModel.findOne({ projectId: PLANE_PROJECT_ID }).exec();
            const existingGithubIssueIds = project?.issues ? project?.issues?.map((issue) => String(issue?.githubIssueId)) : [];

            let newIssues = []

            for (let i = 0; i < issues.length; i++) {
                await sleepFor(5000);
                const issue = issues[i];
                const { title, number, id: githubIssueId } = issue

                // if issue hasn't been already created
                if (!existingGithubIssueIds.includes(String(githubIssueId))) {
                    const resp = await planeService.createIssue({ name: title, githubIssueId })
                    const { id: issueId } = resp;
                    newIssues.push({
                        issueId,
                        githubIssueId,
                        status: GITHUB_STATUS_OPEN
                    })
                }

                const progress = Math.round((i / issues.length) * 100)
                broadcastSyncProgress(jobId, progress, STATUS_INPROGRESS)

                // updating in db at 10% intervals
                if (progress % 10 === 0) {
                    await this.updateSyncJobProgress({ jobId, progress, status: STATUS_INPROGRESS })
                }
            }

            // add issues to projectissues db
            await projectIssuesService.addOrUpdateIssuesForProject({ projectId: PLANE_PROJECT_ID, newIssues })

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

module.exports = IssueSyncService;