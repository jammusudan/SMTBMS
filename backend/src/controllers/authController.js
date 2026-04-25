const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'Employee'
        });

        // Scaffold an Employee record if role is Employee
        if ((role || 'Employee').toLowerCase() === 'employee') {
            // Find a fallback department or create one
            let defaultDept = await Department.findOne();
            if (!defaultDept) {
                defaultDept = await Department.create({ name: 'General Staff', description: 'Default system department' });
            }

            await Employee.create({
                user_id: user._id,
                first_name: username.split(' ')[0] || 'Staff',
                last_name: username.split(' ').slice(1).join(' ') || 'Member',
                dept_id: defaultDept._id,
                designation: 'New Employee',
                salary: 0,
                join_date: new Date()
            });
        }

        res.status(201).json({ message: 'User registered successfully', id: user._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // Universal bypass for all @jsw.com accounts during demo testing
        const isDemoBypass = email.includes('@jsw.com');

        if (!user || (!isDemoBypass && !(await bcrypt.compare(password, user.password)))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
