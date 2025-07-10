// RBAC (Role-Based Access Control) Service for backend

// Define user roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  WAREHOUSE: 'warehouse',
  CASHIER: 'cashier',
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  EDITOR: 'editor'
};

// Define permissions
const PERMISSIONS = {
  // System Administration
  FULL_SYSTEM_ACCESS: '*',
  MANAGE_USERS: 'users.manage',
  MANAGE_ROLES: 'users.roles',
  VIEW_AUDIT_LOGS: 'audit.view',
  MANAGE_SYSTEM_CONFIG: 'system.config',
  VIEW_SYSTEM_REPORTS: 'reports.system.view',
  BULK_USER_OPERATIONS: 'users.bulk',
  
  // User Management
  USER_CREATE: 'users.create',
  USER_READ: 'users.read',
  USER_UPDATE: 'users.update',
  USER_DELETE: 'users.delete',
  USER_APPROVE: 'users.approve',
  USER_SUSPEND: 'users.suspend',
  
  // Inventory Management
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  INVENTORY_STOCK_IN: 'inventory.stock_in',
  INVENTORY_STOCK_OUT: 'inventory.stock_out',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_ANALYTICS: 'inventory.analytics',
  
  // Order Management
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_DELETE: 'order.delete',
  ORDER_APPROVE: 'order.approve',
  ORDER_CANCEL: 'order.cancel',
  ORDER_TRACK: 'order.track',
  ORDER_VIEW_ALL: 'order.view_all',
  
  // Delivery Management
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_CREATE: 'delivery.create',
  DELIVERY_UPDATE: 'delivery.update',
  DELIVERY_ASSIGN: 'delivery.assign',
  DELIVERY_TRACK: 'delivery.track',
  
  // Notification Management
  NOTIFICATION_VIEW: 'notification.view',
  NOTIFICATION_CREATE: 'notification.create',
  NOTIFICATION_SEND: 'notification.send',
  
  // Report Management
  REPORT_VIEW: 'report.view',
  REPORT_CREATE: 'report.create',
  REPORT_EXPORT: 'report.export',
  REPORT_ANALYTICS: 'report.analytics',
  
  // Profile Management
  PROFILE_VIEW: 'profile.view',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete'
};

// Role to permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.FULL_SYSTEM_ACCESS
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_TRACK,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.REPORT_VIEW
  ],
  
  [ROLES.WAREHOUSE]: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_STOCK_IN,
    PERMISSIONS.INVENTORY_STOCK_OUT,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_ANALYTICS,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_APPROVE,
    PERMISSIONS.DELIVERY_VIEW,
    PERMISSIONS.DELIVERY_CREATE,
    PERMISSIONS.DELIVERY_UPDATE,
    PERMISSIONS.DELIVERY_ASSIGN,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE
  ],
  
  [ROLES.CASHIER]: [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_APPROVE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.DELIVERY_VIEW,
    PERMISSIONS.DELIVERY_CREATE,
    PERMISSIONS.DELIVERY_UPDATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_APPROVE,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE
  ],
  
  [ROLES.CUSTOMER]: [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_TRACK,
    PERMISSIONS.DELIVERY_VIEW,
    PERMISSIONS.DELIVERY_TRACK,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE
  ],
  
  [ROLES.DRIVER]: [
    PERMISSIONS.DELIVERY_VIEW,
    PERMISSIONS.DELIVERY_UPDATE,
    PERMISSIONS.DELIVERY_TRACK,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE
  ],
  
  [ROLES.EDITOR]: [
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE
  ]
};

// Check if a role has a specific permission
const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Admin has full access
  if (permissions.includes(PERMISSIONS.FULL_SYSTEM_ACCESS)) {
    return true;
  }
  
  return permissions.includes(permission);
};

// Check if a role has any of the specified permissions
const hasAnyPermission = (userRole, permissionList) => {
  if (!userRole || !Array.isArray(permissionList)) return false;
  
  return permissionList.some(permission => hasPermission(userRole, permission));
};

// Check if a role has all of the specified permissions
const hasAllPermissions = (userRole, permissionList) => {
  if (!userRole || !Array.isArray(permissionList)) return false;
  
  return permissionList.every(permission => hasPermission(userRole, permission));
};

// Get all permissions for a role
const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// Check if a role can access a specific resource
const canAccessResource = (userRole, resource, action) => {
  const permission = `${resource}.${action}`;
  return hasPermission(userRole, permission);
};

// Check if user can manage another user based on roles
const canManageUser = (managerRole, targetRole) => {
  // Admin can manage everyone
  if (managerRole === ROLES.ADMIN) return true;
  
  // Cashier can manage customers
  if (managerRole === ROLES.CASHIER && targetRole === ROLES.CUSTOMER) return true;
  
  // Warehouse can manage drivers
  if (managerRole === ROLES.WAREHOUSE && targetRole === ROLES.DRIVER) return true;
  
  return false;
};

// Role hierarchy levels (higher number = more authority)
const ROLE_HIERARCHY = {
  [ROLES.CUSTOMER]: 1,
  [ROLES.DRIVER]: 2,
  [ROLES.USER]: 3,
  [ROLES.EDITOR]: 4,
  [ROLES.CASHIER]: 5,
  [ROLES.WAREHOUSE]: 6,
  [ROLES.ADMIN]: 10
};

// Check if one role has higher authority than another
const hasHigherAuthority = (role1, role2) => {
  const level1 = ROLE_HIERARCHY[role1] || 0;
  const level2 = ROLE_HIERARCHY[role2] || 0;
  return level1 > level2;
};

// Permission middleware factory
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        errorType: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission: permission,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Multiple permissions middleware (requires ANY of the permissions)
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        errorType: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// All permissions middleware (requires ALL of the permissions)
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        errorType: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: permissions,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Resource access middleware
const requireResourceAccess = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorType: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    if (!canAccessResource(req.user.role, resource, action)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to resource',
        errorType: 'RESOURCE_ACCESS_DENIED',
        resource,
        action,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessResource,
  canManageUser,
  hasHigherAuthority,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireResourceAccess
};
