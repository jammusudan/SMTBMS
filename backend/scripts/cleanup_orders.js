const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Order = require('../src/models/Order');

async function cleanupOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for cleanup...');

        // 1. Identify orders with missing or invalid materialId
        // Orders created with the old structure (items array) or missing materialId
        const totalOrders = await Order.countDocuments();
        
        // Remove orders that don't have the new materialId field
        const result = await Order.deleteMany({ materialId: { $exists: false } });
        console.log(`Removed ${result.deletedCount} orders with legacy structure (missing materialId).`);

        // 2. We can also check if materialId points to a non-existent material, 
        // but that requires fetching all and checking. Let's start with the structure fix.

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupOrders();
