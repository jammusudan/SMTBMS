const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const { connectDB } = require('./src/config/db');
require('dotenv').config();

const seedData = async () => {
    try {
        await connectDB();

        console.log('MongoDB connection successful for seeding.');

        // Clear existing data
        await User.deleteMany({});
        await Department.deleteMany({});

        // Seed Departments (Units)
        const units = [
            { name: 'Production Unit' },
            { name: 'Quality Control' },
            { name: 'Logistics & Supply' },
            { name: 'Maintenance' },
            { name: 'Administration' },
            { name: 'HR & Payroll' },
            { name: 'Sales & Marketing' }
        ];

        const createdDepts = await Department.insertMany(units);
        console.log('✅ Seeded Departments (Units)');

        const hashedPassword = await bcrypt.hash('123456', 10);

        const users = [
            { email: 'admin@jsw.com', username: 'JSW Admin', role: 'Admin', password: hashedPassword },
            { email: 'hr@jsw.com', username: 'HR Dept', role: 'HR', password: hashedPassword },
            { email: 'manager@jsw.com', username: 'General Manager', role: 'Manager', password: hashedPassword },
            { email: 'employee@jsw.com', username: 'Staff Member', role: 'Employee', password: hashedPassword },
            { email: 'sales@jsw.com', username: 'Sales Rep', role: 'Sales', password: hashedPassword }
        ];

        await User.insertMany(users);
        console.log('✅ Seeded Test Users');
        
        console.log('Successfully seeded database with Units and Test Accounts.');
        process.exit();
    } catch (err) {
        console.error('Failed to seed MongoDB:', err);
        process.exit(1);
    }
};

seedData();
