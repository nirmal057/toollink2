import express from 'express';
import User from '../models/User.js';
import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail } from '../utils/emailService.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all drivers (Admin/Warehouse only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Check permissions
        if (!['admin', 'warehouse'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only admin and warehouse managers can view drivers.'
            });
        }

        const drivers = await User.find({ role: 'driver' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Get delivery stats for each driver
        const driversWithStats = await Promise.all(
            drivers.map(async (driver) => {
                const totalDeliveries = await Delivery.countDocuments({
                    driverId: driver._id,
                    status: 'delivered'
                });

                return {
                    id: driver._id,
                    fullName: driver.fullName,
                    email: driver.email,
                    phone: driver.phone,
                    licenseNumber: driver.licenseNumber || 'Not provided',
                    vehicleInfo: driver.vehicleInfo || {
                        type: 'Not specified',
                        plateNumber: 'Not provided',
                        capacity: 'Not specified'
                    },
                    status: driver.status || 'active',
                    createdAt: driver.createdAt,
                    totalDeliveries,
                    rating: driver.rating || 4.5
                };
            })
        );

        res.json({
            success: true,
            drivers: driversWithStats
        });

    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch drivers'
        });
    }
});

// Get unassigned deliveries (Admin/Warehouse only)
router.get('/unassigned', authenticateToken, async (req, res) => {
    try {
        // Check permissions
        if (!['admin', 'warehouse'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only admin and warehouse managers can view unassigned deliveries.'
            });
        }

        const deliveries = await Delivery.find({
            $or: [
                { driverId: { $exists: false } },
                { driverId: null },
                { status: 'pending' }
            ]
        })
            .populate('orderId', 'orderNumber items customerInfo')
            .sort({ createdAt: -1 });

        const formattedDeliveries = deliveries.map(delivery => ({
            id: delivery._id,
            orderId: delivery.orderId._id,
            customerName: delivery.customerName || delivery.orderId.customerInfo?.name || 'Unknown Customer',
            customerEmail: delivery.customerEmail || delivery.orderId.customerInfo?.email || 'No email',
            deliveryAddress: delivery.deliveryAddress,
            priority: delivery.priority || 'normal',
            specialInstructions: delivery.specialInstructions,
            createdAt: delivery.createdAt
        }));

        res.json({
            success: true,
            deliveries: formattedDeliveries
        });

    } catch (error) {
        console.error('Error fetching unassigned deliveries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch unassigned deliveries'
        });
    }
});

// Get driver-specific deliveries
router.get('/driver/:driverId', authenticateToken, async (req, res) => {
    try {
        const { driverId } = req.params;

        // Check if user is the driver or has management permissions
        if (req.user.id !== driverId && !['admin', 'warehouse'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only view your own deliveries.'
            });
        }

        const deliveries = await Delivery.find({
            driverId: driverId,
            status: { $in: ['assigned', 'out_from_warehouse', 'on_the_way'] }
        })
            .populate('orderId', 'orderNumber items customerInfo')
            .sort({ assignedDate: -1 });

        const formattedDeliveries = deliveries.map(delivery => ({
            id: delivery._id,
            orderId: delivery.orderId._id,
            customerName: delivery.customerName || delivery.orderId.customerInfo?.name || 'Unknown Customer',
            customerPhone: delivery.customerPhone || delivery.orderId.customerInfo?.phone || 'No phone',
            customerEmail: delivery.customerEmail || delivery.orderId.customerInfo?.email || 'No email',
            deliveryAddress: delivery.deliveryAddress,
            items: delivery.orderId.items || [],
            status: delivery.status,
            assignedDate: delivery.assignedDate,
            estimatedDelivery: delivery.estimatedDelivery,
            priority: delivery.priority || 'normal',
            specialInstructions: delivery.specialInstructions
        }));

        res.json({
            success: true,
            deliveries: formattedDeliveries
        });

    } catch (error) {
        console.error('Error fetching driver deliveries:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch deliveries'
        });
    }
});

// Update delivery status (Driver only)
router.put('/:deliveryId/status', authenticateToken, async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { status, timestamp } = req.body;

        // Validate status
        const validStatuses = ['out_from_warehouse', 'on_the_way', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const delivery = await Delivery.findById(deliveryId)
            .populate('orderId', 'orderNumber customerInfo')
            .populate('driverId', 'fullName');

        if (!delivery) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found'
            });
        }

        // Check if user is the assigned driver
        if (req.user.id !== delivery.driverId._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own deliveries.'
            });
        }

        // Update delivery status
        delivery.status = status;
        delivery.lastUpdated = new Date(timestamp || Date.now());

        if (status === 'delivered') {
            delivery.deliveredAt = new Date();
        }

        await delivery.save();

        // Update order status if delivery is completed
        if (status === 'delivered') {
            await Order.findByIdAndUpdate(delivery.orderId._id, {
                status: 'delivered',
                deliveredAt: new Date()
            });
        }

        // Send email notification to customer
        try {
            const customer = delivery.orderId.customerInfo;
            let emailSubject, emailBody;

            switch (status) {
                case 'out_from_warehouse':
                    emailSubject = 'Your Order is Out for Delivery - ToolLink';
                    emailBody = `
            <h2>📦 Your Order is Out for Delivery!</h2>
            <p>Hi ${customer.name},</p>
            <p>Great news! Your order has left our warehouse and is on its way to you.</p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Order Details:</h3>
              <p><strong>Order Number:</strong> #${delivery.orderId.orderNumber}</p>
              <p><strong>Delivery Address:</strong> ${delivery.deliveryAddress}</p>
              <p><strong>Driver:</strong> ${delivery.driverId.fullName}</p>
            </div>

            <p>Your items will arrive soon. Please ensure someone is available to receive the delivery.</p>
            <p>Thank you for choosing ToolLink!</p>
          `;
                    break;

                case 'on_the_way':
                    emailSubject = 'Your Order is On the Way - ToolLink';
                    emailBody = `
            <h2>🚛 Your Order is On the Way!</h2>
            <p>Hi ${customer.name},</p>
            <p>Your order is currently on the way to your location.</p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Delivery Update:</h3>
              <p><strong>Order Number:</strong> #${delivery.orderId.orderNumber}</p>
              <p><strong>Delivery Address:</strong> ${delivery.deliveryAddress}</p>
              <p><strong>Driver:</strong> ${delivery.driverId.fullName}</p>
              <p><strong>Status:</strong> On the Way</p>
            </div>

            <p>Please be available to receive your delivery. Expected arrival: within the next few hours.</p>
            <p>Thank you for your patience!</p>
          `;
                    break;

                case 'delivered':
                    emailSubject = 'Order Delivered Successfully - ToolLink';
                    emailBody = `
            <h2>✅ Order Delivered Successfully!</h2>
            <p>Hi ${customer.name},</p>
            <p>Your order has been successfully delivered!</p>

            <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📦 Delivery Completed:</h3>
              <p><strong>Order Number:</strong> #${delivery.orderId.orderNumber}</p>
              <p><strong>Delivered To:</strong> ${delivery.deliveryAddress}</p>
              <p><strong>Delivered By:</strong> ${delivery.driverId.fullName}</p>
              <p><strong>Delivery Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>We hope you're satisfied with your purchase. If you have any issues or questions, please contact our support team.</p>
            <p>Thank you for choosing ToolLink!</p>
          `;
                    break;
            }

            await sendEmail({
                to: customer.email,
                subject: emailSubject,
                html: emailBody
            });

        } catch (emailError) {
            console.error('Failed to send customer notification email:', emailError);
            // Don't fail the whole request if email fails
        }

        res.json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery: {
                id: delivery._id,
                status: delivery.status,
                lastUpdated: delivery.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update delivery status'
        });
    }
});

// Assign delivery to driver (Admin/Warehouse only)
router.post('/:deliveryId/assign', authenticateToken, async (req, res) => {
    try {
        // Check permissions
        if (!['admin', 'warehouse'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only admin and warehouse managers can assign deliveries.'
            });
        }

        const { deliveryId } = req.params;
        const { driverId, assignedBy, assignedDate } = req.body;

        const delivery = await Delivery.findById(deliveryId)
            .populate('orderId', 'orderNumber customerInfo');

        const driver = await User.findById(driverId);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                error: 'Delivery not found'
            });
        }

        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }

        // Update delivery with driver assignment
        delivery.driverId = driverId;
        delivery.assignedBy = assignedBy;
        delivery.assignedDate = new Date(assignedDate);
        delivery.status = 'assigned';

        await delivery.save();

        // Send email notification to driver
        try {
            const emailSubject = 'New Delivery Assignment - ToolLink Driver Portal';
            const emailBody = `
        <h2>🚛 New Delivery Assignment</h2>
        <p>Hi ${driver.fullName},</p>
        <p>You have been assigned a new delivery.</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>📦 Delivery Details:</h3>
          <p><strong>Delivery ID:</strong> #${delivery._id.toString().slice(-6)}</p>
          <p><strong>Order Number:</strong> #${delivery.orderId.orderNumber}</p>
          <p><strong>Customer:</strong> ${delivery.customerName}</p>
          <p><strong>Address:</strong> ${delivery.deliveryAddress}</p>
          <p><strong>Assigned Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/driver-portal"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            🔗 Access Driver Portal
          </a>
        </div>

        <p>Please log in to the Driver Portal to view details and update delivery status.</p>
        <p>Safe driving!</p>
      `;

            await sendEmail({
                to: driver.email,
                subject: emailSubject,
                html: emailBody
            });

        } catch (emailError) {
            console.error('Failed to send driver notification email:', emailError);
        }

        res.json({
            success: true,
            message: 'Delivery assigned successfully',
            delivery: {
                id: delivery._id,
                driverId: delivery.driverId,
                assignedDate: delivery.assignedDate,
                status: delivery.status
            }
        });

    } catch (error) {
        console.error('Error assigning delivery:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign delivery'
        });
    }
});

// Get drivers availability for specific date and time slot
router.get('/availability', authenticateToken, async (req, res) => {
    try {
        // Check permissions
        if (!['admin', 'warehouse', 'cashier'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only admin, warehouse and cashier can check driver availability.'
            });
        }

        const { date, timeSlot } = req.query;

        if (!date || !timeSlot) {
            return res.status(400).json({
                success: false,
                error: 'Date and time slot are required'
            });
        }

        // Get all active drivers
        const drivers = await User.find({
            role: 'driver',
            isActive: true,
            isApproved: true
        }).select('-password');

        // Get deliveries for the specified date and time slot
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const scheduledDeliveries = await Delivery.find({
            scheduledDate: { $gte: startOfDay, $lte: endOfDay },
            scheduledTimeSlot: timeSlot,
            status: { $nin: ['cancelled', 'delivered'] }
        }).populate('driverId', 'fullName');

        // Create availability map
        const driversWithAvailability = drivers.map(driver => {
            const isAssigned = scheduledDeliveries.some(
                delivery => delivery.driverId && delivery.driverId._id.toString() === driver._id.toString()
            );

            return {
                id: driver._id,
                fullName: driver.fullName,
                email: driver.email,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber || 'Not provided',
                vehicleInfo: driver.vehicleInfo || {
                    type: 'Not specified',
                    plateNumber: 'Not provided',
                    capacity: 'Not specified'
                },
                status: driver.status || 'active',
                isAvailable: !isAssigned,
                currentDeliveries: scheduledDeliveries.filter(
                    delivery => delivery.driverId && delivery.driverId._id.toString() === driver._id.toString()
                ).length,
                rating: driver.rating || 4.5,
                totalDeliveries: 0 // Will be calculated later if needed
            };
        });

        // Sort by availability and rating
        driversWithAvailability.sort((a, b) => {
            if (a.isAvailable !== b.isAvailable) {
                return b.isAvailable ? 1 : -1; // Available drivers first
            }
            return b.rating - a.rating; // Higher rating first
        });

        res.json({
            success: true,
            drivers: driversWithAvailability,
            date,
            timeSlot,
            totalDrivers: driversWithAvailability.length,
            availableDrivers: driversWithAvailability.filter(d => d.isAvailable).length
        });

    } catch (error) {
        console.error('Check driver availability error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check driver availability'
        });
    }
});

export default router;
