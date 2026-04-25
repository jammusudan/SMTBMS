const Department = require('../models/Department');

// @desc    Get all departments
// @route   GET /api/departments
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        const formatted = departments.map(d => ({
            _id: d._id,
            id: d._id,
            name: d.name
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new department
// @route   POST /api/departments
exports.addDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        const department = await Department.create({ name });
        res.status(201).json(department);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Department already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        if (!department) return res.status(404).json({ message: 'Department not found' });
        res.json({ message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
