const { PLANE_WORKSPACE_SLUG, PLANE_PROJECT_ID } = require("../../config");
const { logger } = require("../../utils/logger");
const { planeAPIService } = require("./apiService");


class PlaneService {
    async createIssue({ name, number }) {
        try {
            const requestURL = `/workspaces/${PLANE_WORKSPACE_SLUG}/projects/${PLANE_PROJECT_ID}/issues/`
            const requestBody = { "name": name, "number": number }
            const resp = await planeAPIService.postMethod({ requestURL, requestBody })
            return resp
        } catch (e) {
            logger.error("Error in createIssue", { err: e?.messsage })
            throw e
        }
    }

    async updateIssueState({ name, number, state }) {
        try {
            // here i need plane's issue id to update the issue state
            // but plane's issue id is auto generated so getting it from github issue data isn't possible
            // we should allow plane issue id to be sent custom via API creation 
            // so on syncing we'll be able to use same issue id from github and then can further use that id to sync any data in plane issue
        } catch {
            logger.error("Error in createIssue", { err: e?.messsage })
            throw e
        }
    }

}

module.exports = PlaneService;