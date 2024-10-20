const { logger } = require('../../utils/logger');

// socket.js
let io;

const initializeSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });

    return io;
};

const broadcastSyncProgress = (jobId, progress, message) => {
    logger.debug(`Broadcasting sync progress`, jobId, progress, message)
    if (io) {
        io.emit('syncProgress', { jobId, progress, message });
    }
};

module.exports = { initializeSocket, broadcastSyncProgress };
