const syncService = require("../services/syncService");
const { logger } = require("../../utils/logger");
const GithubService = require("../services/githubService");
const { githubEvents, githubActions } = require("../../constants");
const PlaneService = require("../services/planeService");

const githubService = new GithubService()
const planeService = new PlaneService()

class SyncController {

    async startSync(req, res, next) {
        try {
            const resp = await syncService.startSyncJob()
            res.status(200).send(resp)
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
            const header = req.headers['X-Hub-Signature-256']
            const verification = githubService.verifySignature(header, req.body)

            // only verified signature is processed
            if (verification) {
                const githubEvent = req.headers['x-github-event'];
                const data = req.body;
                const action = data.action;

                switch (githubEvent) {
                    case githubEvents.ISSUES:
                        if (action === githubActions.CLOSED) {
                            logger.log(`An issue was closed by ${data.issue.number}`);
                            planeService.updateIssueState({})
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