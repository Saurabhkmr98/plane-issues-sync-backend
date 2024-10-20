const { logger } = require("../../utils/logger");
const { ProjectIssuesModel } = require("../models/projectIssuesModel");

class ProjectIssuesService {
    async updateIssueStatusByGithubIssueId({ projectId, githubIssueId, newStatus }) {
        try {
            const project = await ProjectIssuesModel.findOneAndUpdate(
                { projectId, 'issues.githubIssueId': githubIssueId },
                { $set: { 'issues.$.status': newStatus } },
                { new: true }
            );

            if (!project) {
                return;
            }

            return project;
        } catch (e) {
            logger.error("error while updateIssueStatusByGithubIssueId", { err: e?.message })
            throw e;
        }
    }


    async addOrUpdateIssuesForProject({ projectId, newIssues }) {
        try {
            // Check if the project document already exists
            let project = await ProjectIssuesModel.findOne({ projectId });

            if (!project) {
                // If project doesn't exist, create a new one with the issues
                project = new ProjectIssuesModel({
                    projectId,
                    issues: newIssues  // Set the new issues array
                });
            } else {
                // If project exists, append new issues to the existing issues array

                // Filter out duplicates based on githubIssueId
                const existingIssueIds = project.issues.map(issue => issue.githubIssueId);
                const issuesToAdd = newIssues.filter(
                    issue => !existingIssueIds.includes(issue.githubIssueId)
                );

                // Append non-duplicate issues
                project.issues.push(...issuesToAdd);
            }

            // Save the document (either new or updated)
            await project.save();

            return project;
        } catch (e) {
            logger.error('error while addOrUpdateIssuesForProject', { err: e?.message });
            throw e;
        }
    }
}

module.exports = ProjectIssuesService;