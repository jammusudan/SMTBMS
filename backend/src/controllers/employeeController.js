const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all employees (Filtered for Task Dispatch)
// @route   GET /api/employees
exports.getEmployees = async (req, res) => {
    try {
        const { operationalOnly } = req.query;
        let query = {};

        // Fetch all employees to filter by their User Role
        const employees = await Employee.find(query)
            .populate('dept_id', 'name')
            .populate({
                path: 'user_id',
                select: 'email role username'
            })
            .sort({ createdAt: -1 });

        let filtered = employees;

        // If operationalOnly is requested, filter out managers and admins
        if (operationalOnly === 'true') {
            const operationalRoles = ['Employee', 'employee', 'Sales Team', 'Staff'];
            filtered = employees.filter(emp => 
                emp.user_id && operationalRoles.some(role => emp.user_id.role.toLowerCase() === role.toLowerCase())
            );
        }

        const formatted = filtered.map(emp => ({
            _id: emp._id,
            id: emp._id,
            user_id: emp.user_id?._id,
            email: emp.user_id?.email,
            role: emp.user_id?.role,
            username: emp.user_id?.username,
            first_name: emp.first_name,
            last_name: emp.last_name,
            dept_id: emp.dept_id?._id,
            department_name: emp.dept_id?.name,
            designation: emp.designation,
            employeeCode: emp.employeeCode,
            join_date: emp.join_date
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current employee profile
// @route   GET /api/employees/profile
exports.getProfile = async (req, res) => {
    try {
        const employee = await Employee.findOne({ user_id: req.user.id })
            .populate('dept_id', 'name')
            .populate('user_id', 'username email role');

        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const formatted = {
            id: employee._id,
            user_id: employee.user_id._id,
            username: employee.user_id.username,
            email: employee.user_id.email,
            role: employee.user_id.role,
            first_name: employee.first_name,
            last_name: employee.last_name,
            dept_id: employee.dept_id?._id,
            department_name: employee.dept_id?.name,
            designation: employee.designation,
            salary: employee.salary,
            employeeCode: employee.employeeCode,
            join_date: employee.join_date
        };

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add or Update employee profile (Onboarding)
// @route   POST /api/employees
exports.upsertEmployee = async (req, res) => {
    const { 
        email, password, role, // User data
        first_name, last_name, dept_id, designation, salary, join_date // Employee data
    } = req.body;
    
    try {
        let userId = req.body.user_id;

        // If no user_id, it's a new onboarding
        if (!userId) {
            // Validate user inputs
            if (!email || !password || !role) {
                return res.status(400).json({ message: 'Email, password and role are required for new employees' });
            }

            // Check if email exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create User
            const newUser = await User.create({
                username: `${first_name} ${last_name}`,
                email,
                password: hashedPassword,
                role
            });
            userId = newUser._id;
        }

        // Create or update employee profile
        let employee = await Employee.findOne({ user_id: userId });

        if (employee) {
            employee.first_name = first_name;
            employee.last_name = last_name;
            employee.dept_id = dept_id;
            employee.designation = designation;
            employee.salary = salary;
            employee.join_date = join_date || new Date();
            
            // Sync basicSalary if not explicitly set or if performing a basic update
            if (employee.salaryStructure) {
                employee.salaryStructure.basicSalary = Number(salary) || 0;
            }
        } else {
            employee = new Employee({
                user_id: userId,
                first_name,
                last_name,
                dept_id,
                designation,
                salary,
                join_date: join_date || new Date(),
                salaryStructure: {
                    basicSalary: Number(salary) || 0,
                    hra: 0,
                    allowances: 0,
                    bonus: 0,
                    pfPercent: 12,
                    taxPercent: 0
                }
            });
        }

        await employee.save();

        res.status(201).json({ 
            id: employee._id, 
            message: 'Employee successfully onboarded',
            employee 
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message || 'Error saving employee' });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        
        // Optionally delete the user too?
        // await User.findByIdAndDelete(employee.user_id);
        
        res.json({ message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update employee salary structure
// @route   PUT /api/employees/:id/salary
exports.updateSalaryStructure = async (req, res) => {
    const { 
        basicSalary, hra, allowances, bonus, pfPercent, taxPercent 
    } = req.body;

    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Force identity generation if missing to bypass schema validation errors
        if (!employee.employeeCode) {
            employee.employeeCode = `EMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }

        employee.salaryStructure = {
            basicSalary: Number(basicSalary),
            hra: Number(hra) || 0,
            allowances: Number(allowances) || 0,
            bonus: Number(bonus) || 0,
            pfPercent: Number(pfPercent) || 12,
            taxPercent: Number(taxPercent) || 0
        };

        // Also sync the main 'salary' field with the total gross for consistency
        employee.salary = Number(basicSalary) + (Number(hra) || 0) + (Number(allowances) || 0) + (Number(bonus) || 0);

        await employee.save();

        res.json({ message: 'Salary structure updated successfully', salaryStructure: employee.salaryStructure });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
