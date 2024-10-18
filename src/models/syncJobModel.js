const mongoose = require('mongoose');
const { ALL_JOB_STATUS } = require('../../constants');

const syncJobSchema = new mongoose.Schema({
    jobId: { type: String },
    status: { type: String, enum: ALL_JOB_STATUS, required: true },
    progress: { type: Number, default: 0 },
    githubRepo: { type: String, required: true },
    planeWorkspace: { type: String, required: true },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });

const SyncJobModel = mongoose.model('sync_jobs', syncJobSchema);

module.exports = {
    SyncJobModel
};
