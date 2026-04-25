const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/smtbms_mongo').then(async () => {
    const Employee = require('./src/models/Employee');
    
    const employees = await Employee.find({ $or: [{ employeeCode: { $exists: false } }, { employeeCode: '' }] });
    console.log(`Found ${employees.length} employees missing employeeCode`);

    for (let emp of employees) {
        // Generate code manually for the fix script
        const lastEmp = await Employee.findOne({ employeeCode: /^EMP\d+/ }).sort({ employeeCode: -1 });
        let nextNum = 1;
        if (lastEmp && lastEmp.employeeCode) {
            const lastNum = parseInt(lastEmp.employeeCode.replace('EMP', ''));
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const newCode = `EMP${nextNum.toString().padStart(3, '0')}`;
        
        emp.employeeCode = newCode;
        await emp.save();
        console.log(`Fixed ${emp.first_name}: Assigned ${newCode}`);
    }

    console.log('Done fixing employee codes!');
    process.exit();
}).catch(console.error);
