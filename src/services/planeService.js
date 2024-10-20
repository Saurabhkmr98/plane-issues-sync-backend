const { PLANE_WORKSPACE_SLUG, PLANE_PROJECT_ID, PLANE_COMPLETED_STATE_ID } = require("../../config");
const { GITHUB_STATUS_CLOSED, STATUS_COMPLETED } = require("../../constants");
const { logger } = require("../../utils/logger");
const { ProjectIssuesModel } = require("../models/projectIssuesModel");
const { planeAPIService } = require("./apiService");
const ProjectIssuesService = require("./projectIssueService");


class PlaneService {
    async createIssue({ name, githubIssueId }) {
        try {
            const requestURL = `/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`
            const requestBody = { "name": `${githubIssueId} - ${name}` }
            const resp = await planeAPIService.postMethod({ requestURL, requestBody })
            return resp
        } catch (e) {
            logger.error("Error in createIssue", { err: e?.messsage })
            throw e
        }
    }

    async updateIssueState({ githubIssueId, state = GITHUB_STATUS_CLOSED }) {
        try {
            let planeStateId;
            switch (state) {
                case GITHUB_STATUS_CLOSED:
                    planeStateId = PLANE_COMPLETED_STATE_ID
                    break;
                default:
                    planeStateId = PLANE_COMPLETED_STATE_ID
                    break;
            }


            // get project issues
            const project = await ProjectIssuesModel.findOne({ projectId: PLANE_PROJECT_ID }).exec();
            if (!project) {
                logger.debug("no progject found")
                return
            }

            // get filtered issue
            const [issue] = project?.issues?.filter((issue) => issue.githubIssueId == githubIssueId);
            if (!issue) {
                logger.debug(`no issue found to close ${githubIssueId}`, githubIssueId)
                return;
            }

            // update state in plane project as completed
            const requestURL = `/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/${issue?.issueId}`
            const requestBody = { "state": PLANE_COMPLETED_STATE_ID }
            const resp = await planeAPIService.patchMethod({ requestURL, requestBody })

            // update status in DB
            const projectIssuesService = new ProjectIssuesService();
            await projectIssuesService.updateIssueStatusByGithubIssueId({ projectId: PLANE_PROJECT_ID, githubIssueId, newStatus: GITHUB_STATUS_CLOSED });

            return resp
        } catch {
            logger.error("Error in createIssue", { err: e?.messsage })
            throw e
        }
    }

}

module.exports = PlaneService;