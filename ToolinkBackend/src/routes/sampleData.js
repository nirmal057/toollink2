import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Create sample data for driver workflow testing
router.post('/create-sample-data', async (req, res) => {
    try {
        // Create sample drivers
        const driversData = [
            {
                username: 'driver1',
                email: 'driver1@toollink.com',
                password: await bcrypt.hash('password123', 12),
                fullName: 'Kamal Perera',
                role: 'driver',
                phone: '+94771234567',
                isActive: true,
                isApproved: true,
                emailVerified: true,
                licenseNumber: 'DL123456789',
                vehicleInfo: {
                    type: 'Pickup Truck',
                    plateNumber: 'CAR-1234',
                    capacity: '1 Ton'
                },
                rating: 4.8
            },
            {
                username: 'driver2',
                email: 'driver2@toollink.com',
                password: await bcrypt.hash('password123', 12),
                fullName: 'Nimal Silva',
                role: 'driver',
                phone: '+94771234568',
                isActive: true,
                isApproved: true,
                emailVerified: true,
                licenseNumber: 'DL987654321',
                vehicleInfo: {
                    type: 'Van',
                    plateNumber: 'VAN-5678',
                    capacity: '1.5 Tons'
                },
                rating: 4.6
            },
            {
                username: 'driver3',
                email: 'driver3@toollink.com',
                password: await bcrypt.hash('password123', 12),
                fullName: 'Sunil Fernando',
                role: 'driver',
                phone: '+94771234569',
                isActive: true,
                isApproved: true,
                emailVerified: true,
                licenseNumber: 'DL555666777',
                vehicleInfo: {
                    type: 'Lorry',
                    plateNumber: 'LOR-9999',
                    capacity: '3 Tons'
                },
                rating: 4.9
            }
        ];

        // Create drivers
        const createdDrivers = [];
        for (const driverData of driversData) {
            const existingDriver = await User.findOne({ email: driverData.email });
            if (!existingDriver) {
                const driver = new User(driverData);
                await driver.save();
                createdDrivers.push(driver);
            }
        }

        // Create sample orders
        const ordersData = [
            {
                orderNumber: 'ORD-2025-001',
                customerInfo: {
                    name: 'Chaminda Rajapaksa',
                    email: 'chaminda@email.com',
                    phone: '+94771111111'
                },
                items: [
                    { name: 'Cement Bags', quantity: 50, unit: 'bags' },
                    { name: 'Steel Bars (12mm)', quantity: 20, unit: 'pieces' }
                ],
                status: 'confirmed',
                totalAmount: 75000
            },
            {
                orderNumber: 'ORD-2025-002',
                customerInfo: {
                    name: 'Sanduni Wickramasinghe',
                    email: 'sanduni@email.com',
                    phone: '+94772222222'
                },
                items: [
                    { name: 'River Sand', quantity: 1000, unit: 'kg' },
                    { name: 'Red Bricks', quantity: 500, unit: 'pieces' }
                ],
                status: 'confirmed',
                totalAmount: 45000
            },
            {
                orderNumber: 'ORD-2025-003',
                customerInfo: {
                    name: 'Mahesh Gunasekara',
                    email: 'mahesh@email.com',
                    phone: '+94773333333'
                },
                items: [
                    { name: 'White Paint', quantity: 20, unit: 'liters' },
                    { name: 'Electrical Wire', quantity: 100, unit: 'meters' }
                ],
                status: 'confirmed',
                totalAmount: 32000
            }
        ];

        // Create orders
        const createdOrders = [];
        for (const orderData of ordersData) {
            const existingOrder = await Order.findOne({ orderNumber: orderData.orderNumber });
            if (!existingOrder) {
                const order = new Order(orderData);
                await order.save();
                createdOrders.push(order);
            }
        }

        // Create sample deliveries
        const deliveriesData = [
            {
                orderId: createdOrders[0]?._id,
                customerName: 'Chaminda Rajapaksa',
                customerPhone: '+94771111111',
                customerEmail: 'chaminda@email.com',
                deliveryAddress: 'No. 45, Galle Road, Bambalapitiya, Colombo 04',
                status: 'pending',
                priority: 'urgent',
                specialInstructions: 'Call before delivery. Gate access required.'
            },
            {
                orderId: createdOrders[1]?._id,
                customerName: 'Sanduni Wickramasinghe',
                customerPhone: '+94772222222',
                customerEmail: 'sanduni@email.com',
                deliveryAddress: 'No. 123, Kandy Road, Malabe, Colombo',
                status: 'pending',
                priority: 'normal'
            },
            {
                orderId: createdOrders[2]?._id,
                customerName: 'Mahesh Gunasekara',
                customerPhone: '+94773333333',
                customerEmail: 'mahesh@email.com',
                deliveryAddress: 'No. 78, High Level Road, Nugegoda',
                status: 'pending',
                priority: 'normal',
                specialInstructions: 'Fragile items. Handle with care.'
            }
        ];

        // Create deliveries
        const createdDeliveries = [];
        for (const deliveryData of deliveriesData) {
            if (deliveryData.orderId) {
                const existingDelivery = await Delivery.findOne({ orderId: deliveryData.orderId });
                if (!existingDelivery) {
                    const delivery = new Delivery(deliveryData);
                    await delivery.save();
                    createdDeliveries.push(delivery);
                }
            }
        }

        res.json({
            success: true,
            message: 'Sample data created successfully',
            data: {
                drivers: createdDrivers.length,
                orders: createdOrders.length,
                deliveries: createdDeliveries.length
            },
            testCredentials: {
                drivers: [
                    { email: 'driver1@toollink.com', password: 'password123', name: 'Kamal Perera' },
                    { email: 'driver2@toollink.com', password: 'password123', name: 'Nimal Silva' },
                    { email: 'driver3@toollink.com', password: 'password123', name: 'Sunil Fernando' }
                ]
            }
        });

    } catch (error) {
        console.error('Error creating sample data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create sample data: ' + error.message
        });
    }
});

export default router;
