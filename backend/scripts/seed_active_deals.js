const mongoose = require('mongoose');
require('dotenv').config();
const Deal = require('../src/models/Deal');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const salesRepId = '69e7347d3a9e14297bc07a3e';
        const customerId = '69e895e73311a9566a502887';

        const activeDeals = [
            {
                customer_id: customerId,
                title: 'Building Material Bulk Order',
                amount: 75000,
                stage: 'Proposal',
                assigned_to: salesRepId,
                expected_close_date: new Date('2026-05-15')
            },
            {
                customer_id: customerId,
                title: 'Interior Renovation Pipeline',
                amount: 125000,
                stage: 'Negotiation',
                assigned_to: salesRepId,
                expected_close_date: new Date('2026-05-20')
            }
        ];

        await Deal.create(activeDeals);
        console.log('Active deals seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
