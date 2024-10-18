const express = require('express');
const router = express.Router();
const SyncController = require('../controllers/syncController');
const syncController = new SyncController();

// Route to trigger the sync process
router.post('/start', syncController.startSync);

// Route to check the status of the sync process
router.get('/status/:jobId', syncController.checkSyncStatus);

router.post('/github-webhook', syncController.githubWebhook);

module.exports = router;
