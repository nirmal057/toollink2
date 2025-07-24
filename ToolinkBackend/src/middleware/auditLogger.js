import AuditLog from '../models/AuditLog.js';

/**
 * Audit logging utility functions
 */
export class AuditLogger {

    /**
     * Create an audit log entry
     * @param {Object} logData - The audit log data
     * @param {string} logData.action - The action performed
     * @param {string} logData.userId - The user ID who performed the action
     * @param {string} logData.targetId - The target resource ID (optional)
     * @param {string} logData.targetType - The type of target resource (optional)
     * @param {Object} logData.details - Additional details (optional)
     * @param {string} logData.ipAddress - IP address
     * @param {string} logData.userAgent - User agent (optional)
     * @param {string} logData.status - Status: success, failure, warning (default: success)
     */
    static async log(logData) {
        try {
            await AuditLog.createLog(logData);
        } catch (error) {
            // Log to console if audit logging fails, but don't break the main operation
            console.error('Audit logging failed:', error);
        }
    }

    /**
     * Log user authentication events
     */
    static async logAuth(action, userId, req, status = 'success', details = {}) {
        await this.log({
            action,
            userId,
            targetType: 'auth',
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            status
        });
    }

    /**
     * Log user management events
     */
    static async logUserAction(action, performedBy, targetUserId, req, details = {}, status = 'success') {
        await this.log({
            action,
            userId: performedBy,
            targetId: targetUserId,
            targetType: 'user',
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            status
        });
    }

    /**
     * Log inventory management events
     */
    static async logInventoryAction(action, userId, inventoryId, req, details = {}, status = 'success') {
        await this.log({
            action,
            userId,
            targetId: inventoryId,
            targetType: 'inventory',
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            status
        });
    }

    /**
     * Log order management events
     */
    static async logOrderAction(action, userId, orderId, req, details = {}, status = 'success') {
        await this.log({
            action,
            userId,
            targetId: orderId,
            targetType: 'order',
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            status
        });
    }

    /**
     * Log system configuration events
     */
    static async logSystemAction(action, userId, req, details = {}, status = 'success') {
        await this.log({
            action,
            userId,
            targetType: 'system',
            details,
            ipAddress: this.getClientIP(req),
            userAgent: req.get('User-Agent'),
            status
        });
    }

    /**
     * Extract client IP address from request
     */
    static getClientIP(req) {
        return req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            'unknown';
    }
}

/**
 * Express middleware to automatically log API requests
 */
export const auditMiddleware = (action, targetType = null) => {
    return async (req, res, next) => {
        // Store original res.json to intercept responses
        const originalJson = res.json;

        res.json = function (data) {
            // Determine status based on response
            const status = res.statusCode >= 400 ? 'failure' : 'success';

            // Log the action after response
            if (req.user && req.user._id) {
                const logData = {
                    action,
                    userId: req.user._id,
                    targetType,
                    details: {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        ...(req.body && Object.keys(req.body).length > 0 ? { requestBody: req.body } : {}),
                        ...(status === 'failure' && data?.error ? { error: data.error } : {})
                    },
                    ipAddress: AuditLogger.getClientIP(req),
                    userAgent: req.get('User-Agent'),
                    status
                };

                // Add target ID if available
                if (req.params.id) {
                    logData.targetId = req.params.id;
                }

                // Don't await to avoid blocking the response
                AuditLogger.log(logData).catch(error => {
                    console.error('Audit middleware logging failed:', error);
                });
            }

            // Call original res.json
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Bulk audit logging for multiple actions
 */
export const bulkAuditLog = async (logs) => {
    try {
        await AuditLog.insertMany(logs);
    } catch (error) {
        console.error('Bulk audit logging failed:', error);
    }
};

export default AuditLogger;
