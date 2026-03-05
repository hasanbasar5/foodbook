const logger = require("../config/logger");

const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error(error);
  }

  res.status(statusCode).json({
    message: error.message || "Something went wrong",
    errors: error.errors || undefined,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
