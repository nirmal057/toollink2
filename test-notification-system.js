// Test script to verify notification system is working with real database
const mongoose = require('mongoose');
const Notification = require('./ToolinkBackend/src/models/Notification');
const User = require('./ToolinkBackend/src/models/User');

// Connect to MongoDB
mongoose.connect('mongodb+srv://toollink:EbmZMI5P8fNjxtU6@cluster0.daqkn.mongodb.net/toollink?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
        userId: user._id,
        title: 'System Test Notification',
        message: 'This is a test notification to verify the notification system is working correctly.',
        category: 'system',
        type: 'system-test',
        priority: 'normal',
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
        userId: admin._id,
        title: 'New Customer Registration',
        message: 'A new customer "Test Customer" has registered and requires approval. This is a test notification.',
        category: 'user',
        type: 'customer-approval',
        priority: 'normal',
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
        userId: admin._id,
        title: 'Low Stock Alert',
        message: 'Steel Rods (SKU: STL001) is running low. Current stock: 5, Minimum required: 10. This is a test notification.',
        category: 'inventory',
        type: 'low-stock',
        priority: 'high',
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
      .populate('userId', 'fullName username email');
    
    console.log(`📬 Recent notifications:`);
    recentNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.category} (${notif.isRead ? 'read' : 'unread'})`);
      console.log(`      To: ${notif.userId.fullName || notif.userId.username} (${notif.userId.email})`);
      console.log(`      Created: ${notif.createdAt.toLocaleString()}`);
    });
    
    console.log('✅ Notification system test completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend server: cd ToolinkBackend && npm start');
    console.log('   2. Start the frontend: npm start');
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
