// Response utilities for consistent API responses

// Success response
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Error response
const errorResponse = (res, error, statusCode = 500, errorType = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    error: error.message || error,
    errorType,
    timestamp: new Date().toISOString()
  });
};

// Validation error response
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errorType: 'VALIDATION_ERROR',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  });
};

// Not found response
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
    errorType: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

// Unauthorized response
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return res.status(401).json({
    success: false,
    error: message,
    errorType: 'UNAUTHORIZED',
    timestamp: new Date().toISOString()
  });
};

// Forbidden response
const forbiddenResponse = (res, message = 'Access denied') => {
  return res.status(403).json({
    success: false,
    error: message,
    errorType: 'FORBIDDEN',
    timestamp: new Date().toISOString()
  });
};

// Conflict response
const conflictResponse = (res, message = 'Resource already exists') => {
  return res.status(409).json({
    success: false,
    error: message,
    errorType: 'CONFLICT',
    timestamp: new Date().toISOString()
  });
};

// Too many requests response
const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return res.status(429).json({
    success: false,
    error: message,
    errorType: 'TOO_MANY_REQUESTS',
    timestamp: new Date().toISOString()
  });
};

// Paginated response
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      itemsPerPage: pagination.itemsPerPage,
      hasNextPage: pagination.hasNextPage,
      hasPreviousPage: pagination.hasPreviousPage
    },
    timestamp: new Date().toISOString()
  });
};

// Created response
const createdResponse = (res, data, message = 'Created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Updated response
const updatedResponse = (res, data, message = 'Updated successfully') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Deleted response
const deletedResponse = (res, message = 'Deleted successfully') => {
  return res.status(200).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

// No content response
const noContentResponse = (res) => {
  return res.status(204).send();
};

// Server error response
const serverErrorResponse = (res, error, message = 'Internal server error') => {
  console.error('Server Error:', error);
  
  return res.status(500).json({
    success: false,
    error: message,
    errorType: 'SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Bad request response
const badRequestResponse = (res, message = 'Bad request') => {
  return res.status(400).json({
    success: false,
    error: message,
    errorType: 'BAD_REQUEST',
    timestamp: new Date().toISOString()
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return validationErrorResponse(res, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return conflictResponse(res, `${field} already exists`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return unauthorizedResponse(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return unauthorizedResponse(res, 'Token expired');
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return badRequestResponse(res, 'Invalid ID format');
  }

  // Default server error
  return serverErrorResponse(res, err);
};

// Request logger
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  tooManyRequestsResponse,
  paginatedResponse,
  createdResponse,
  updatedResponse,
  deletedResponse,
  noContentResponse,
  serverErrorResponse,
  badRequestResponse,
  asyncHandler,
  errorHandler,
  requestLogger
};
