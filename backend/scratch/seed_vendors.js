const mongoose = require('mongoose');
const Vendor = require('../src/models/Vendor');
const dotenv = require('dotenv');

dotenv.config();

const seedVendors = async () => {
    try {
        const uri = process.env.MONGO_URI;
        let connected = false;

        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            connected = true;
        } catch (error) {
            const userPass = uri.split('@')[0].replace('mongodb+srv://', '');
            const fallbackUri = `mongodb://${userPass}@ac-fzgqfl1-shard-00-00.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-01.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-02.zfjx8br.mongodb.net:27017/test?ssl=true&replicaSet=atlas-or20t4-shard-0&authSource=admin&retryWrites=true&w=majority`;
            await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 10000 });
            connected = true;
        }

        if (connected) {
            const vendors = [
                { name: 'Global Logistics Solutions', contact_person: 'John Doe', email: 'john@global.com', phone: '9876543210', address: '123 Logistics Park' },
                { name: 'Prime Material Suppliers', contact_person: 'Jane Smith', email: 'jane@prime.com', phone: '9876543211', address: '456 Supply Ave' },
                { name: 'Elite Hardware Hub', contact_person: 'Mike Johnson', email: 'mike@elite.com', phone: '9876543212', address: '789 Tool Street' }
            ];

            console.log('Seeding vendors...');
            await Vendor.insertMany(vendors);
            console.log('Vendors seeded successfully.');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedVendors();
