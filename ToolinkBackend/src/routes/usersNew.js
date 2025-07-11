import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { body, validationResult } from 'express-validator';
import User from '../models/UserNew.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Validation rules
const userValidation = [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['Admin', 'Warehouse Manager', 'Cashier', 'Customer']).withMessage('Invalid role'),
    body('status').optional().isIn(['Active', 'Inactive', 'Approved', 'Pending']).withMessage('Invalid status')
];

// GET /api/users - Get all users
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            status,
            search = '',
            sort = 'name'
        } = req.query;

        // Build filter
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password')
            .sort({ [sort]: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

        logger.info(`Users fetched: ${users.length} users returned`);
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// POST /api/users - Create a new user
router.post('/', userValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { name, email, password, role, status } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            role,
            status: status || 'Active'
        });

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });

        logger.info(`User created: ${email} with role ${role}`);
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// PUT /api/users/:id - Update a user by ID
router.put('/:id', userValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { name, email, password, role, status } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
        }

        // Update user fields
        user.name = name;
        user.email = email;
        if (password) user.password = password; // Will be hashed by pre-save hook
        user.role = role;
        user.status = status;

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse
        });

        logger.info(`User updated: ${email}`);
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

        logger.info(`User deleted: ${user.email}`);
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// POST /api/users/upload-excel - Upload Excel file and insert users
router.post('/upload-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is empty or has no valid data'
            });
        }

        // Validate and transform data
        const usersToInsert = [];
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowIndex = i + 1;

            try {
                // Map Excel columns to our schema
                const user = {
                    name: row.Name || row.name,
                    email: row.Email || row.email,
                    password: row.password || row.Password || 'default123',
                    role: row.Role || row.role || 'Customer',
                    status: 'Active'
                };

                // Parse last login if present
                if (row['Last Login'] || row.lastLogin) {
                    const lastLoginStr = row['Last Login'] || row.lastLogin;
                    if (lastLoginStr && lastLoginStr !== '') {
                        user.lastLogin = new Date(lastLoginStr);
                    }
                }

                // Validate required fields
                if (!user.name || !user.email) {
                    errors.push(`Row ${rowIndex}: Name and Email are required`);
                    continue;
                }

                // Validate role
                if (!['Admin', 'Warehouse Manager', 'Cashier', 'Customer'].includes(user.role)) {
                    errors.push(`Row ${rowIndex}: Invalid role "${user.role}"`);
                    continue;
                }

                // Check for duplicate email in the file
                const duplicateInFile = usersToInsert.find(u => u.email === user.email);
                if (duplicateInFile) {
                    errors.push(`Row ${rowIndex}: Duplicate email "${user.email}" in file`);
                    continue;
                }

                // Check if user already exists in database
                const existingUser = await User.findOne({ email: user.email });
                if (existingUser) {
                    errors.push(`Row ${rowIndex}: User with email "${user.email}" already exists`);
                    continue;
                }

                usersToInsert.push(user);
            } catch (error) {
                errors.push(`Row ${rowIndex}: ${error.message}`);
            }
        }

        if (errors.length > 0 && usersToInsert.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid users to insert',
                errors
            });
        }

        // Insert users
        let insertedUsers = [];
        if (usersToInsert.length > 0) {
            insertedUsers = await User.insertMany(usersToInsert);
        }

        res.json({
            success: true,
            message: `Successfully processed Excel file`,
            data: {
                totalRows: data.length,
                inserted: insertedUsers.length,
                errors: errors.length,
                insertedUsers: insertedUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }))
            },
            errors: errors.length > 0 ? errors : undefined
        });

        logger.info(`Excel upload processed: ${insertedUsers.length} users inserted, ${errors.length} errors`);
    } catch (error) {
        logger.error('Error processing Excel upload:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing Excel file',
            error: error.message
        });
    }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'Active' });
        const inactiveUsers = await User.countDocuments({ status: 'Inactive' });
        const pendingUsers = await User.countDocuments({ status: 'Pending' });

        const roleStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total: totalUsers,
                active: activeUsers,
                inactive: inactiveUsers,
                pending: pendingUsers,
                byRole: roleStats.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        logger.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
});

export default router;
