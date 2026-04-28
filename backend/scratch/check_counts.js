const mongoose = require('mongoose');
const Vendor = require('../src/models/Vendor');
const Customer = require('../src/models/Customer');
const dotenv = require('dotenv');

dotenv.config();

const checkData = async () => {
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
            const v = await Vendor.countDocuments();
            const c = await Customer.countDocuments();
            console.log({vendors: v, customers: c});
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
