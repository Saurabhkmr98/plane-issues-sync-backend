const { logger } = require("../../utils/logger");
const GithubService = require("../services/githubService");
const { githubEvents, githubActions, GITHUB_STATUS_CLOSED } = require("../../constants");
const PlaneService = require("../services/planeService");
const IssueSyncService = require("../services/syncService");
const { addSyncJobToQueue } = require("../config/queue");

const githubService = new GithubService()
const planeService = new PlaneService()
const syncService = new IssueSyncService()

class SyncController {

    async startSync(req, res, next) {
        try {
            const isInProgress = await syncService.isJobAlreadyInProgress();
            if (isInProgress) {
                res.status(200).send({ message: "Sync already in progress" });
                return
            }
            // push in bull queue
            const jobId = new Date().getTime().toString()
            await addSyncJobToQueue(jobId)
            const syncjob = await syncService.createSyncJob(jobId)
            res.status(200).send({ message: "Sync started and queued", jobId: syncjob?._id });
        } catch (error) {
            next(error)
        }
    }

    async checkSyncStatus(req, res, next) {
        try {
            const { jobId } = req.params;
            const resp = await syncService.checkSyncStatus({ jobId })
            res.status(200).send(resp)
        } catch (error) {
            next(error)
        }
    }

    async githubWebhook(req, res, next) {
        try {
            res.status(202).send('Accepted');

            // verify signature
            const header = req.headers['x-hub-signature-256']
            const verification = githubService.verifySignature(header, req.body)

            // only verified signature is processed
            if (verification) {
                logger.info("githubWebhook verified")
                const githubEvent = req.headers['x-github-event'];
                const data = req.body;
                const action = data.action;

                switch (githubEvent) {
                    case githubEvents.ISSUES:
                        if (action === githubActions.CLOSED) {
                            const { id: githubIssueId, state } = data.issue || {};
                            logger.log(`An issue was closed by ${data.issue.number}, ${githubIssueId}`);
                            await planeService.updateIssueState({ githubIssueId, state: GITHUB_STATUS_CLOSED })
                        } else {
                            logger.log(`Unhandled action for the issue event: ${action}`);
                        }
                        break;
                    default:
                        logger.log(`Unhandled event: ${githubEvent}`);
                        break;
                }
            } else {
                logger.error("Failed verification of github webhook")
            }
        } catch (error) {
            next(error)
        }
    }

}

module.exports = SyncController;