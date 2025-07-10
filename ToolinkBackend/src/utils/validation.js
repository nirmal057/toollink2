// Validation utilities
const validator = require('validator');

// Email validation
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Password validation
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Phone number validation
const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Username validation
const validateUsername = (username) => {
  if (!username) return false;
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// SKU validation
const validateSKU = (sku) => {
  if (!sku) return false;
  const skuRegex = /^[A-Z0-9]{3,20}$/;
  return skuRegex.test(sku);
};

// Order number validation
const validateOrderNumber = (orderNumber) => {
  if (!orderNumber) return false;
  const orderNumberRegex = /^TL\d{8}$/;
  return orderNumberRegex.test(orderNumber);
};

// MongoDB ObjectId validation
const validateObjectId = (id) => {
  return validator.isMongoId(id);
};

// Date validation
const validateDate = (date) => {
  return validator.isISO8601(date) || validator.isDate(date);
};

// URL validation
const validateURL = (url) => {
  return validator.isURL(url);
};

// Sanitization utilities
const sanitizeString = (str) => {
  if (!str) return '';
  return validator.escape(str.trim());
};

const sanitizeEmail = (email) => {
  if (!email) return '';
  return validator.normalizeEmail(email.trim().toLowerCase());
};

// Pagination validation
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  return {
    page: Math.max(1, isNaN(pageNum) ? 1 : pageNum),
    limit: Math.min(100, Math.max(1, isNaN(limitNum) ? 10 : limitNum))
  };
};

// Sort validation
const validateSort = (sortBy, sortOrder, allowedFields = []) => {
  const validSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'createdAt';
  const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
  
  return { sortBy: validSortBy, sortOrder: validSortOrder };
};

// File validation
const validateFileType = (filename, allowedTypes = []) => {
  const ext = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(ext);
};

const validateFileSize = (size, maxSizeInMB = 10) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
};

// Address validation
const validateAddress = (address) => {
  if (!address || typeof address !== 'object') return false;
  
  const required = ['street', 'city', 'state', 'zipCode'];
  return required.every(field => address[field] && address[field].trim().length > 0);
};

// Price validation
const validatePrice = (price) => {
  const priceNum = parseFloat(price);
  return !isNaN(priceNum) && priceNum >= 0;
};

// Quantity validation
const validateQuantity = (quantity) => {
  const quantityNum = parseInt(quantity);
  return !isNaN(quantityNum) && quantityNum >= 0;
};

// Role validation
const validateRole = (role) => {
  const validRoles = ['admin', 'user', 'warehouse', 'cashier', 'customer', 'driver', 'editor'];
  return validRoles.includes(role);
};

// Status validation
const validateOrderStatus = (status) => {
  const validStatuses = ['Pending', 'Processing', 'Confirmed', 'In Production', 'Ready', 'Delivered', 'Cancelled', 'Rejected'];
  return validStatuses.includes(status);
};

const validateDeliveryStatus = (status) => {
  const validStatuses = ['Scheduled', 'In Transit', 'Delivered', 'Failed', 'Cancelled', 'Rescheduled'];
  return validStatuses.includes(status);
};

// Priority validation
const validatePriority = (priority) => {
  const validPriorities = ['Low', 'Normal', 'High', 'Urgent'];
  return validPriorities.includes(priority);
};

// Coordinates validation
const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Time slot validation
const validateTimeSlot = (timeSlot) => {
  if (!timeSlot || !timeSlot.start || !timeSlot.end) return false;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeSlot.start) && timeRegex.test(timeSlot.end);
};

// Bulk validation utilities
const validateBulkOperation = (operation, allowedOperations = []) => {
  return allowedOperations.includes(operation);
};

const validateBulkData = (data, maxItems = 100) => {
  return Array.isArray(data) && data.length > 0 && data.length <= maxItems;
};

// Common validation middleware
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    Object.keys(schema).forEach(field => {
      const validator = schema[field];
      const value = req.body[field];
      
      if (validator.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
      } else if (value !== undefined && value !== null && value !== '') {
        if (validator.validate && !validator.validate(value)) {
          errors.push(validator.message || `${field} is invalid`);
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
        errorType: 'VALIDATION_ERROR',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername,
  validateSKU,
  validateOrderNumber,
  validateObjectId,
  validateDate,
  validateURL,
  sanitizeString,
  sanitizeEmail,
  validatePagination,
  validateSort,
  validateFileType,
  validateFileSize,
  validateAddress,
  validatePrice,
  validateQuantity,
  validateRole,
  validateOrderStatus,
  validateDeliveryStatus,
  validatePriority,
  validateCoordinates,
  validateTimeSlot,
  validateBulkOperation,
  validateBulkData,
  createValidationMiddleware
};
