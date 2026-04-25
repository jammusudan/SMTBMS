const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../src/models/Employee');
const Salary = require('../src/models/Salary');
const PayrollJob = require('../src/models/PayrollJob');

const archiveDir = path.join(__dirname, '../archives');
if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir);
}

const runBackup = async () => {
    try {
        console.log('🚀 Initiating Emergency Data Archive...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(archiveDir, `backup_${timestamp}`);
        fs.mkdirSync(backupPath);

        const collections = [
            { name: 'employees', model: Employee },
            { name: 'salaries', model: Salary },
            { name: 'payroll_jobs', model: PayrollJob }
        ];

        for (const col of collections) {
            console.log(`📦 Archiving ${col.name}...`);
            const data = await col.model.find({});
            fs.writeFileSync(
                path.join(backupPath, `${col.name}.json`), 
                JSON.stringify(data, null, 2)
            );
        }

        console.log(`✅ Disaster Recovery Archive completed: ${backupPath}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Backup Failed:', error);
        process.exit(1);
    }
};

runBackup();
