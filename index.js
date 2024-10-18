const syncRoutes = require('./src/routes/syncRoutes'); // Routes for handling sync jobs
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/config/socket');
const express = require('express');
const bodyParser = require("body-parser");
var cors = require("cors");

// Environment variables
require('dotenv').config();
const PORT = process.env.PORT || 5000;

// Initialize Express app and server
const app = express();

// Middleware to parse JSON
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Create an HTTP server for the app
const httpServer = require('http').createServer(app);

// WebSocket to broadcast real-time sync job updates
const io = initializeSocket(httpServer);

// API routes
app.use('/api/sync', syncRoutes); // Sync-related routes (e.g., start sync, check status)

// Serve a basic homepage or health check endpoint
app.get('/', (req, res) => {
    res.send('Issue Synchronization System is running!');
});

// Handling errors globally
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something went wrong!' });
});

// Start the server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
