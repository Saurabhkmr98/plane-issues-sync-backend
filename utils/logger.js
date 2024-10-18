const appRoot = require('app-root-path');
const { format, createLogger, transports, addColors } = require("winston");
const { combine, timestamp, label, printf } = format;
const LOG_LEVEL = process.env.LOG_LEVEL?.toString()?.toLowerCase();

// Define custom settings for each transport (file, console)
const options = {
    file: {
        level: 'info',
        filename: `${appRoot}/logs/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    error_file: {
        level: 'error',
        filename: `${appRoot}/logs/error.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    }
};

// Custom log format
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

// Instantiate a new Winston Logger with the settings defined above
const winstonlogger = createLogger({
    level: LOG_LEVEL || 'debug',
    format: combine(
        label({ label: 'Issue-Sync Backend' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.File(options.file),       // Log info-level and above to file
        new transports.File(options.error_file), // Log error-level and above to error log file
        new transports.Console(options.console)  // Log debug-level and above to console
    ],
    exitOnError: false // Do not exit on handled exceptions
});

// Add custom log colors
addColors({
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green'
});

/**
 * Wrapper over logger methods to allow flexible logging with multiple parameters.
 */
class FileTransportExtended {
    constructor(logger) {
        this.logger = logger;
    }

    log(...args) {
        this.logger.log('info', ...args); // Default to 'info' level logging
    }

    debug(...args) {
        this.logger.debug(...args); // Log debug messages
    }

    info(...args) {
        this.logger.info(...args); // Log info messages
    }

    error(...args) {
        this.logger.error(...args); // Log error messages
    }

    warn(...args) {
        this.logger.warn(...args); // Log warning messages
    }

    silly(...args) {
        this.logger.silly(...args); // Log silly messages (lowest priority)
    }

    http(...args) {
        this.logger.http(...args); // Log HTTP requests
    }
}

const logger = new FileTransportExtended(winstonlogger);

module.exports = {
    logger
};
