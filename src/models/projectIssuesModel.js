const mongoose = require('mongoose');
const { ALL_GITHUB_STATUS } = require('../../constants');
const { Schema } = mongoose;

// Issue subdocument schema
const issueSchema = new Schema({
    issueId: {
        type: String,
        required: true,
        unique: true
    },
    githubIssueId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ALL_GITHUB_STATUS,
        required: true
    }
}, { _id: false });

// Project schema with issues array
const projectIssuesSchema = new Schema({
    projectId: {
        type: String,
        required: true,
        unique: true
    },
    issues: [issueSchema]
}, { timestamps: true });

const ProjectIssuesModel = mongoose.model('project_issues', projectIssuesSchema);
module.exports = {
    ProjectIssuesModel
};
