// queued', 'in-progress', 'completed', 'failed
const STATUS_QUEUED = 'queued'
const STATUS_INPROGRESS = 'in-progress'
const STATUS_COMPLETED = 'completed'
const STATUS_FAILED = 'failed'

const ALL_JOB_STATUS = [STATUS_QUEUED, STATUS_INPROGRESS, STATUS_COMPLETED, STATUS_FAILED]

const githubEvents = {
    "ISSUES": "issues",
    "PING": "ping"
}

const githubActions = {
    "CLOSED": "closed"
}

module.exports = {
    githubEvents,
    githubActions,
    STATUS_COMPLETED,
    STATUS_FAILED,
    STATUS_INPROGRESS,
    STATUS_QUEUED,
    ALL_JOB_STATUS
}

