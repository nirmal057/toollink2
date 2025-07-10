// Test script to verify notification system is working with real database
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://iit21083:k1zTsck8hslcFiZm@cluster0.q0grz0.mongodb.net/toollink?retryWrites=true&w=majority&appName=Cluster0');

const testNotificationSystem = async () => {
  try {
    console.log('🔧 Testing notification system...');
    
    // 1. Find admin and cashier users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'cashier'] },
      isApproved: true 
    });
    
    console.log(`📋 Found ${adminUsers.length} admin/cashier users`);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin/cashier users found. Creating test notification for all users...');
      const allUsers = await User.find({ isApproved: true });
      
      if (allUsers.length === 0) {
        console.log('❌ No users found in database!');
        return;
      }
      
      // Create test notifications for all users
      const testNotifications = allUsers.map(user => ({
        title: 'System Test Notification',
        message: 'This is a test notification to verify the notification system is working correctly.',
        category: 'system',
        type: 'info',
        priority: 'normal',
        recipient: {
          userId: user._id,
          specific: true
        },
        sender: {
          system: true,
          name: 'System'
        },
        data: {
          testMessage: 'If you can see this notification, the system is working!',
          timestamp: new Date()
        }
      }));
      
      await Notification.insertMany(testNotifications);
      console.log(`✅ Created ${testNotifications.length} test notifications`);
    } else {
      // Create customer approval notification
      const customerApprovalNotifications = adminUsers.map(admin => ({
        title: 'New Customer Registration',
        message: 'A new customer "Test Customer" has registered and requires approval. This is a test notification.',
        category: 'user',
        type: 'info',
        priority: 'normal',
        recipient: {
          userId: admin._id,
          specific: true
        },
        sender: {
          system: true,
          name: 'System'
        },
        data: {
          customerId: 'test-customer-id',
          customerName: 'Test Customer',
          customerEmail: 'test@example.com'
        }
      }));
      
      await Notification.insertMany(customerApprovalNotifications);
      console.log(`✅ Created ${customerApprovalNotifications.length} customer approval notifications`);
      
      // Create low stock alert notification
      const lowStockNotifications = adminUsers.map(admin => ({
        title: 'Low Stock Alert',
        message: 'Steel Rods (SKU: STL001) is running low. Current stock: 5, Minimum required: 10. This is a test notification.',
        category: 'inventory',
        type: 'warning',
        priority: 'high',
        recipient: {
          userId: admin._id,
          specific: true
        },
        sender: {
          system: true,
          name: 'System'
        },
        data: {
          itemId: 'test-item-id',
          itemName: 'Steel Rods',
          sku: 'STL001',
          currentQuantity: 5,
          minimumQuantity: 10
        }
      }));
      
      await Notification.insertMany(lowStockNotifications);
      console.log(`✅ Created ${lowStockNotifications.length} low stock notifications`);
    }
    
    // 2. Check total notifications in database
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    
    console.log(`📊 Notification Summary:`);
    console.log(`   - Total notifications: ${totalNotifications}`);
    console.log(`   - Unread notifications: ${unreadNotifications}`);
    
    // 3. Get recent notifications for display
    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('recipient.userId', 'fullName username email');
    
    console.log(`📬 Recent notifications:`);
    recentNotifications.forEach((notif, index) => {
      const recipient = notif.recipient && notif.recipient.userId 
        ? notif.recipient.userId 
        : { fullName: 'Unknown', username: 'unknown', email: 'unknown' };
      console.log(`   ${index + 1}. ${notif.title} - ${notif.category} (${notif.status || 'sent'})`);
      console.log(`      To: ${recipient.fullName || recipient.username} (${recipient.email})`);
      console.log(`      Created: ${notif.createdAt.toLocaleString()}`);
    });
    
    console.log('✅ Notification system test completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Start the frontend: cd ../ToolLink && npm start');
    console.log('   3. Login with admin/cashier account to see notifications');
    console.log('   4. Check the notification dropdown in the header');
    console.log('   5. Visit /notifications page to see all notifications');
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    mongoose.connection.close();
  }
};

testNotificationSystem();
