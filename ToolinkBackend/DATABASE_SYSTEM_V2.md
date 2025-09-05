# ToolLink Database Connection System

## Overview

This document describes the new, clean database connection system implemented for ToolLink Backend. The old database connection code has been completely removed and replaced with a modern, robust solution.

## New Architecture

### 🏗️ Core Components

1. **Database Connection Class** (`src/config/database.js`)
   - Singleton pattern for single connection instance
   - Automatic retry logic with exponential backoff
   - Comprehensive error handling and logging
   - Health monitoring and status reporting
   - Graceful shutdown handling

2. **Environment Configuration** (`.env`)
   - Enhanced database configuration options
   - Timeout and pool size settings
   - Monitoring and retry parameters

3. **Server Integration** (`server.js`)
   - Clean separation of concerns
   - Database-aware health endpoints
   - Proper startup and shutdown sequences

## 🔧 Configuration

### Environment Variables

```env
# Primary Database Connection
MONGODB_URI=mongodb://localhost:27017/toollink
DATABASE_URL=mongodb://localhost:27017/toollink  # Fallback

# Connection Pool Settings
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=2

# Timeout Configuration
DB_CONNECTION_TIMEOUT=10000       # 10 seconds
DB_SOCKET_TIMEOUT=45000          # 45 seconds
DB_SERVER_SELECTION_TIMEOUT=10000 # 10 seconds
DB_HEARTBEAT_FREQUENCY=30000     # 30 seconds

# Retry Logic
DB_MAX_RETRIES=5
DB_RETRY_DELAY=5000

# Monitoring
DB_MONITORING_ENABLED=true
DB_MONITORING_INTERVAL=60000
```

### Connection Options

The new system automatically configures:
- Connection pooling (2-10 connections)
- Automatic retries for reads and writes
- IPv4 preference for compatibility
- Heartbeat monitoring every 30 seconds
- Proper timeout handling

## 🚀 Getting Started

### 1. Initialize Database

```bash
# Initialize database with default configuration
npm run db:init
```

### 2. Test Connection

```bash
# Run comprehensive database tests
npm run db:test
```

### 3. Check Health

```bash
# Quick health check
npm run db:health
```

### 4. Start Server

```bash
# Start development server
npm run dev
```

## 📊 Monitoring & Health Checks

### Health Endpoints

- **Server Health**: `GET /health`
  - Overall server status
  - Database connection status
  - Memory usage and uptime

- **Database Health**: `GET /health/database`
  - Detailed database statistics
  - Connection performance metrics
  - Error diagnostics

### Status Codes

- `200` - Healthy (database connected and operational)
- `503` - Unhealthy (database disconnected or error)
- `500` - Server error

### Example Response

```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "status": "connected",
    "name": "toollink",
    "host": "localhost:27017",
    "test": {
      "success": true,
      "message": "Database connection healthy",
      "stats": {
        "collections": 8,
        "dataSize": "245 KB",
        "indexSize": "156 KB"
      }
    }
  },
  "timestamp": "2025-09-04T10:30:00.000Z"
}
```

## 🔄 Connection Lifecycle

### 1. Startup Sequence

1. Load environment configuration
2. Initialize database connection class
3. Attempt initial connection with retry logic
4. Setup event handlers for monitoring
5. Create default admin user
6. Start HTTP server
7. Enable connection monitoring

### 2. Runtime Monitoring

- Automatic connection status logging
- Health check endpoints
- Reconnection on disconnect
- Performance metrics tracking

### 3. Shutdown Sequence

1. Receive shutdown signal (SIGTERM/SIGINT)
2. Stop accepting new requests
3. Close HTTP server
4. Gracefully close database connection
5. Exit process

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```
   Error: Server selection timed out
   ```
   - Check network connectivity
   - Verify MongoDB server is running
   - Increase `DB_SERVER_SELECTION_TIMEOUT`

2. **Authentication Failed**
   ```
   Error: Authentication failed
   ```
   - Verify username/password in `MONGODB_URI`
   - Check database user permissions
   - Ensure database exists

3. **Network Error**
   ```
   Error: ENOTFOUND or connection refused
   ```
   - Check MongoDB server status
   - Verify host/port in connection string
   - Check firewall settings

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

### Connection Testing

Run the comprehensive test suite:
```bash
npm run db:test
```

This will test:
- Environment configuration
- Connection establishment
- Basic CRUD operations
- Performance metrics
- Error handling

## 🔧 Development

### Adding New Models

1. Create model file in `src/models/`
2. Import in `init-database.js`
3. Run `npm run db:init` to update database

### Custom Connection Options

Modify `src/config/database.js` to add custom options:

```javascript
this.connectionOptions = {
    // Add your custom options here
    customOption: value,
    ...this.connectionOptions
};
```

### Event Handling

The connection class emits standard Mongoose events:
- `connected` - Initial connection established
- `error` - Connection error occurred
- `disconnected` - Connection lost
- `reconnected` - Reconnection successful
- `close` - Connection closed

## 📈 Performance Optimization

### Connection Pooling

Optimized for:
- **Development**: 2-10 connections
- **Production**: 10-50 connections (adjustable)

### Timeout Settings

- **Connection**: 10 seconds (fast feedback)
- **Socket**: 45 seconds (prevents hanging)
- **Server Selection**: 10 seconds (quick failover)

### Monitoring

- Automatic health checks every 60 seconds
- Performance metrics collection
- Connection state logging

## 🔒 Security Features

- Credential masking in logs
- Secure connection handling
- Environment variable validation
- Graceful error handling
- Process signal handling

## 📝 Migration Notes

### Removed Components

- Old `connectDB()` function
- Manual event handlers
- Hardcoded connection options
- Mongoose connection middleware
- Legacy error handling

### New Features

- Singleton connection pattern
- Automatic retry logic
- Comprehensive health checks
- Performance monitoring
- Enhanced logging
- Graceful shutdown

## 🎯 Next Steps

1. **Test the new system**: Run `npm run db:test`
2. **Initialize database**: Run `npm run db:init`
3. **Start server**: Run `npm run dev`
4. **Monitor health**: Check `/health` endpoints
5. **Review logs**: Monitor console output

## 📞 Support

For issues with the database connection system:

1. Check the troubleshooting guide above
2. Run `npm run db:test` for diagnostics
3. Review server logs for error details
4. Verify environment configuration

---

*Last updated: September 4, 2025*
*Version: 2.0.0*
