const mongoose = require('mongoose');
const { logger } = require('../../utils/logger');

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        logger.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

// Export the function
module.exports = connectDB;
