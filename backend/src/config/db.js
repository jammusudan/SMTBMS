const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI || '';
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    
    try {
        console.log(`Connecting to: ${maskedUri}`);
        // Add a short timeout to trigger fallback if SRV lookup hangs or fails
        const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Fallback for DNS SRV resolution issues (ECONNREFUSED or Timeout)
        if ((error.message.includes('ECONNREFUSED') || error.message.includes('buffering timed out') || error.message.includes('selection timed out')) && uri.startsWith('mongodb+srv')) {
            console.log('⚠️ Primary connection failed or timed out. Attempting direct shard connection fallback...');
            try {
                // Hardcoded robust fallback for this specific cluster (smtmbs2)
                const userPass = uri.split('@')[0].replace('mongodb+srv://', '');
                const fallbackUri = `mongodb://${userPass}@ac-fzgqfl1-shard-00-00.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-01.zfjx8br.mongodb.net:27017,ac-fzgqfl1-shard-00-02.zfjx8br.mongodb.net:27017/test?ssl=true&replicaSet=atlas-or20t4-shard-0&authSource=admin&retryWrites=true&w=majority`;
                
                const conn = await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 10000 });
                console.log(`MongoDB Connected (via fallback): ${conn.connection.host}`);
                return;
            } catch (fallbackError) {
                console.error(`Fallback failed: ${fallbackError.message}`);
            }
        }
        console.error(`Error connecting to MongoDB: ${error.message}`);
    }
};

module.exports = { connectDB };
