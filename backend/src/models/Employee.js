const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    employeeCode: {
        type: String,
        unique: true,
        required: [true, 'Employee Code is required']
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    dept_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true
    },
    salary: {
        type: Number,
        required: true,
        min: [0, 'Salary cannot be negative']
    },
    join_date: {
        type: Date,
        required: true
    },
    leaveBalances: {
        sick: { type: Number, default: 10 },
        casual: { type: Number, default: 12 },
        privilege: { type: Number, default: 20 }
    },
    salaryStructure: {
        basicSalary: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        pfPercent: { type: Number, default: 12 },
        taxPercent: { type: Number, default: 0 }
    },
    bankDetails: {
        accountNo: String,
        bankName: String,
        ifsc: String
    }
}, { timestamps: true });

// Standardized EMPxxx code generator
employeeSchema.pre('validate', async function() {
    if (!this.employeeCode || this.employeeCode.includes('TBD') || this.employeeCode.startsWith('EMP-')) {
        try {
            const Employee = mongoose.model('Employee');
            const lastEmp = await Employee.findOne({ employeeCode: /^EMP\d+/ }).sort({ employeeCode: -1 });
            
            let nextNum = 1;
            if (lastEmp && lastEmp.employeeCode) {
                const lastNum = parseInt(lastEmp.employeeCode.replace('EMP', ''));
                if (!isNaN(lastNum)) nextNum = lastNum + 1;
            }
            
            this.employeeCode = `EMP${nextNum.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating employee code:', error);
        }
    }
});

module.exports = mongoose.model('Employee', employeeSchema);
