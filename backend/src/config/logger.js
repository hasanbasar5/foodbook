const fs = require("fs");
const path = require("path");
const winston = require("winston");

const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logDir, "app.log") }),
  ],
});

const requestLogger = {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
};

module.exports = logger;
module.exports.requestLogger = requestLogger;
