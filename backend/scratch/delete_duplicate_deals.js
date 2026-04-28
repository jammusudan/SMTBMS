const mongoose = require('mongoose');
const Deal = require('../src/models/Deal');
const dotenv = require('dotenv');

dotenv.config();

const deleteDuplicates = async () => {
    try {
        const uri = process.env.MONGO_URI;
        let connected = false;

        try {
            console.log('Attempting primary connection...');
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            console.log('Connected to MongoDB (Primary)');
            connected = true;
        } catch (error) {
            console.log('Primary connection failed. Attempting fallback...');
            const userPass = uri.split('@')[0].replace('mongodb+srv://', '');
            const fallbackUri = `mongodb://${userPass}@ac-fzgqfl1-shard-00-00.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-01.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-02.zfjx8br.mongodb.net:27017/test?ssl=true&replicaSet=atlas-or20t4-shard-0&authSource=admin&retryWrites=true&w=majority`;
            
            await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 10000 });
            console.log('Connected to MongoDB (Fallback)');
            connected = true;
        }

        if (connected) {
            const titleToFind = 'Opportunity: Ravi Electronics';
            const deals = await Deal.find({ title: titleToFind }).sort({ createdAt: 1 });

            console.log(`Found ${deals.length} deals with title "${titleToFind}"`);

            if (deals.length > 1) {
                // Keep the first one, delete the rest
                const dealsToDelete = deals.slice(1);
                const idsToDelete = dealsToDelete.map(d => d._id);

                console.log(`Deleting ${idsToDelete.length} duplicate deals...`);
                const result = await Deal.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`Successfully deleted ${result.deletedCount} deals.`);
            } else {
                console.log('No duplicates found.');
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

deleteDuplicates();
