const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Employee = require('./src/models/Employee');
const Salary = require('./src/models/Salary');

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Find employees with no first_name or no user_id
        const invalidEmployees = await Employee.find({
            $or: [
                { first_name: { $exists: false } },
                { first_name: "" },
                { user_id: { $exists: false } }
            ]
        });

        console.log(`Found ${invalidEmployees.length} invalid employees.`);

        for (const emp of invalidEmployees) {
            console.log(`Removing employee: ${emp._id}`);
            // Also remove associated salaries
            const res = await Salary.deleteMany({ employee_id: emp._id });
            console.log(`Deleted ${res.deletedCount} associated salaries.`);
            await Employee.deleteOne({ _id: emp._id });
        }

        // Also find salaries where employee_id is null or invalid
        const orphanedSalaries = await Salary.find({ employee_id: null });
        console.log(`Found ${orphanedSalaries.length} orphaned salaries.`);
        for (const sal of orphanedSalaries) {
            console.log(`Removing orphaned salary: ${sal._id}`);
            await Salary.deleteOne({ _id: sal._id });
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
