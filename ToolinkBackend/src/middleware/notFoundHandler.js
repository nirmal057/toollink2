export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        errorType: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /health',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/auth/me',
            'GET /api/users',
            'GET /api/inventory',
            'GET /api/orders',
            'GET /api/delivery',
            'GET /api/notifications',
            'GET /api/reports',
            'GET /api/feedback',
            'GET /api/activity',
            'GET /api/admin',
            'GET /api/predictions'
        ]
    });
};
