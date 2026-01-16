# ToolLink Backend

A comprehensive backend API for the ToolLink Management System built with Node.js, Express, and MongoDB.

## Features

- **User Management**: Complete user registration, authentication, and role-based access control
- **Inventory Management**: Full CRUD operations for inventory items with stock tracking
- **Order Management**: Order creation, tracking, and status management
- **Delivery Management**: Delivery scheduling and tracking
- **Notifications**: Real-time notification system
- **Reports**: Comprehensive reporting system
- **Admin Dashboard**: Administrative interface with statistics and system management
- **Security**: JWT authentication, password hashing, rate limiting, and audit logging

## User Roles

- **Admin**: Full system access and management
- **Warehouse**: Inventory and delivery management
- **Cashier**: Order processing and customer management
- **Customer**: Order placement and tracking
- **Driver**: Delivery management
- **Editor**: Content management

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy the `.env` file and update the values:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/toollink
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   ```

3. **Start MongoDB**:
   Make sure MongoDB is running on your system.

4. **Run the server**:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/low-stock` - Get low stock items

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/my-orders` - Get current user's orders
- `PATCH /api/orders/:id/status` - Update order status

### Deliveries
- `GET /api/delivery` - Get all deliveries
- `GET /api/delivery/:id` - Get delivery by ID
- `POST /api/delivery` - Create delivery
- `PUT /api/delivery/:id` - Update delivery
- `PATCH /api/delivery/:id/status` - Update delivery status

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/reports` - Get system reports
- `GET /api/admin/config` - Get system configuration
- `PUT /api/admin/config` - Update system configuration

## Default Users

The system creates a default admin user on first startup:
- **Email**: admin@toollink.com
- **Password**: admin123

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- Audit logging
- Role-based access control

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/toollink
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@toollink.com
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:5173
```

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Production Deployment

1. Set NODE_ENV=production
2. Use a production MongoDB instance
3. Set secure JWT secrets
4. Configure proper CORS origins
5. Use a process manager like PM2
6. Set up logging and monitoring

## License

MIT License - see LICENSE file for details
