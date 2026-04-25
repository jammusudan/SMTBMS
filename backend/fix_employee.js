const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/smtbms_mongo').then(async () => {
    const User = require('./src/models/User');
    const Employee = require('./src/models/Employee');
    const Department = require('./src/models/Department');

    let dept = await Department.findOne();
    if (!dept) {
        dept = await Department.create({ name: 'General Staff', description: 'Fallback dept' });
    }

    // Don't use $in strictly, just regex or find all and filter
    const users = await User.find();
    
    for (let u of users) {
        if (u.role.toLowerCase() === 'employee') {
            let emp = await Employee.findOne({ user_id: u._id });
            if (!emp) {
                console.log('Creating profile for', u.username);
                await Employee.create({
                    user_id: u._id,
                    first_name: u.username.split(' ')[0] || 'Staff',
                    last_name: u.username.split(' ')[1] || 'Member',
                    dept_id: dept._id,
                    designation: 'Standard Employee',
                    salary: 50000,
                    join_date: new Date()
                });
            }
        }
    }
    console.log('Done fixing profiles!');
    process.exit();
}).catch(console.error);
