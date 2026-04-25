const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Customer = require('../src/models/Customer');

const seedCustomers = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined in .env');
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for Customer seeding...');

        const customers = [
            {
                "name": "Walk-in Customer",
                "email": "walkin@smtbm.com",
                "phone": "0000000000",
                "address": "Counter Sale"
            },
            {
                "name": "ABC Constructions",
                "email": "abc@gmail.com",
                "phone": "9876543210",
                "address": "123 Build Ave, City Center"
            },
            {
                "name": "XYZ Builders",
                "email": "xyz@gmail.com",
                "phone": "9123456780",
                "address": "456 Project Blvd, Industrial Zone"
            },
            {
                "name": "LMN Infra",
                "email": "lmn@infra.com",
                "phone": "9000000001",
                "address": "789 Structure St, Tech Park"
            }
        ];

        for (const cust of customers) {
            await Customer.findOneAndUpdate(
                { name: cust.name },
                cust,
                { upsert: true, new: true }
            );
            console.log(`Seeded/Updated Customer: ${cust.name}`);
        }

        console.log('Customer seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedCustomers();
