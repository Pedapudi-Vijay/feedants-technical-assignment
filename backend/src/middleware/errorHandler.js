class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongo duplicate key (e.g. double registration race caught by the unique index)
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'This action conflicts with an existing record (already done).',
      code: 'DUPLICATE',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, code: 'VALIDATION_ERROR' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format', code: 'INVALID_ID' });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler, ApiError };
