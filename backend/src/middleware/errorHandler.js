// backend/src/middleware/errorHandler.js
const { ApiError } = require('../utils/ApiError');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, err?.errors || [], err.stack);
  }
  if (error.statusCode >= 500) logger.error(error.stack);

  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };
  return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
