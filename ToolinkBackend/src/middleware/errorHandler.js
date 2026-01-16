import logger from '../utils/logger.js';

export const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal server error';
    let errorType = 'SERVER_ERROR';

    // Log the error
    logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user._id : null
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        errorType = 'VALIDATION_ERROR';
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        errorType = 'INVALID_ID';
    } else if (error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate resource';
        errorType = 'DUPLICATE_RESOURCE';
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorType = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorType = 'TOKEN_EXPIRED';
    } else if (error.name === 'MongoError') {
        statusCode = 500;
        message = 'Database error';
        errorType = 'DATABASE_ERROR';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        errorType,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.message
        })
    });
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Resource not found',
        errorType: 'NOT_FOUND',
        path: req.originalUrl
    });
};

export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.http('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user._id : null
        });
    });

    next();
};
