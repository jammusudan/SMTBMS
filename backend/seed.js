const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connection successful for seeding.');

        // Delete existing users to prevent duplicates during testing
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash('123456', 10);

        const users = [
            { email: 'admin@jsw.com', username: 'JSW Admin', role: 'Admin', password: hashedPassword },
            { email: 'hr@jsw.com', username: 'HR Dept', role: 'HR', password: hashedPassword },
            { email: 'manager@jsw.com', username: 'General Manager', role: 'Manager', password: hashedPassword },
            { email: 'employee@jsw.com', username: 'Staff Member', role: 'Employee', password: hashedPassword },
            { email: 'sales@jsw.com', username: 'Sales Rep', role: 'Sales', password: hashedPassword }
        ];

        await User.insertMany(users);
        console.log('Successfully seeded local MongoDB with test accounts.');
        process.exit();
    } catch (err) {
        console.error('Failed to seed MongoDB:', err);
        process.exit(1);
    }
};

seedUsers();
