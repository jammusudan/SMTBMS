const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Material = require('./src/models/Material');
require('dotenv').config();

const backfillOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Order backfill...');

        const orders = await Order.find({ 
            $or: [
                { unitPrice: { $exists: false } },
                { totalAmount: 0 }
            ]
        });

        console.log(`Found ${orders.length} orders requiring financial backfill.`);

        for (const order of orders) {
            const material = await Material.findById(order.materialId);
            if (material) {
                order.unitPrice = material.price;
                order.totalAmount = order.quantity * material.price;
                await order.save();
                console.log(`Updated Order ${order._id} (Qty: ${order.quantity}, Price: ${material.price})`);
            } else {
                console.warn(`Material not found for Order ${order._id}. Skipping.`);
            }
        }

        console.log('Backfill complete.');
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
};

backfillOrders();
