const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Material = require('../models/Material');
const StockLog = require('../models/StockLog');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// @desc    Get all tasks (Admin/Manager views all, Employees view only theirs)
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
    try {
        let query = {};
        const role = req.user.role.toUpperCase();

        if (role === 'EMPLOYEE') {
            const employeeProfile = await Employee.findOne({ user_id: req.user.id });
            if (!employeeProfile) return res.json([]);
            query.assignedTo = employeeProfile._id;
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'first_name last_name designation')
            .populate('assignedBy', 'username')
            .populate({
                path: 'dealId',
                select: 'title amount stage materialId quantity',
                populate: { path: 'materialId', select: 'name unit' }
            })
            .populate('customerId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Admin/Manager
exports.createTask = async (req, res) => {
    try {
        const { title, description, assignedTo, due_date, dealId, customerId, taskType, priority } = req.body;

        // STRICT MANDATORY FIELD VALIDATION
        if (!dealId || !customerId || !assignedTo || !title || !due_date) {
            return res.status(400).json({ 
                message: 'Dispatch error: Mission must have Title, Deadline, Assigned Resource, Linked Deal and Customer.' 
            });
        }

        const task = await Task.create({
            title,
            description,
            taskType,
            priority,
            assignedTo,
            assignedBy: req.user.id,
            dealId,
            customerId,
            due_date,
            status: 'Assigned'
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update task status (Role-restricted workflow)
// @route   PUT /api/tasks/:id/status
exports.updateTaskStatus = async (req, res) => {
    const { status, remarks } = req.body;
    const role = req.user.role.toUpperCase();

    try {
        const task = await Task.findById(req.params.id).populate('assignedTo');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // STRICT STATE TRANSITION MAPPING
        const transitions = {
            'Assigned': ['In Progress'],
            'In Progress': ['Completed'],
            'Completed': ['Approved', 'Rejected'],
            'Approved': [],
            'Rejected': ['In Progress']
        };

        // ROLE-BASED RESTRICTIONS
        if (role === 'EMPLOYEE') {
            if (!['In Progress', 'Completed'].includes(status)) {
                return res.status(403).json({ message: 'Employees can only transition to In Progress or Completed' });
            }
            // Enforce sequential order
            if (!transitions[task.status].includes(status)) {
                return res.status(400).json({ message: `Illegal transition from ${task.status} to ${status}` });
            }
        }

        if (role === 'MANAGER' || role === 'ADMIN') {
            if (status === 'Approved' && task.status !== 'Completed') {
                return res.status(400).json({ message: 'Task must be Completed before Verification' });
            }
        }

        // Handle Rejection
        if (status === 'Rejected') {
            task.status = 'In Progress';
            task.description += `\n\n[REJECTED BY MANAGER]: ${remarks || 'Needs further work'}`;
        } else {
            task.status = status;
        }

        await task.save();
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Manager Approval (with strictly Idempotent Inventory Reduction)
// @route   PUT /api/tasks/:id/approve
exports.approveTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        console.log('[APPROVE_TASK] Initiating approval for ID:', taskId);

        const task = await Task.findById(taskId).populate('dealId');

        if (!task) {
            console.log('[APPROVE_TASK] Error: Task not found');
            return res.status(404).json({ message: 'Task not found' });
        }

        console.log('[APPROVE_TASK] Current Task Status:', task.status);

        if (task.status === 'Approved' || task.stockUpdated) {
            console.log('[APPROVE_TASK] Error: Already processed');
            return res.status(400).json({ 
                message: 'Task is already approved. Inventory has already been processed.',
                task 
            });
        }

        if (task.taskType === 'Delivery' && task.dealId?.materialId && task.dealId?.quantity > 0) {
            console.log('[APPROVE_TASK] Processing Inventory Reduction...');
            const material = await Material.findById(task.dealId.materialId);
            
            if (!material) {
                console.log('[APPROVE_TASK] Error: Material missing');
                throw new Error('Associated material not found in registry');
            }

            const reductionQty = task.dealId.quantity;
            console.log('[APPROVE_TASK] Material:', material.name, 'Req:', reductionQty, 'Avail:', material.quantity);

            if (material.quantity < reductionQty) {
                console.log('[APPROVE_TASK] Error: Insufficient stock');
                throw new Error(`Insufficient stock for ${material.name}. Required: ${reductionQty}, Available: ${material.quantity}`);
            }

            const previousQuantity = material.quantity;
            material.quantity -= reductionQty;
            await material.save();

            await StockLog.create({
                materialId: material._id,
                actionType: 'OUT',
                quantity: reductionQty,
                previousQuantity,
                newQuantity: material.quantity,
                reason: `Delivery Mission Approved (#${task.title})`,
                logSource: 'TASK',
                referenceId: task._id.toString(),
                performedBy: req.user.id
            });

            await ActivityLog.create({
                user_id: req.user.id,
                username: req.user.username || 'Manager',
                action: `Inventory Reduced: ${reductionQty} ${material.unit} of ${material.name} for Dispatch Approved`,
                module: 'Dashboard'
            });

            task.stockUpdated = true;
        }

        task.status = 'Approved';
        await task.save();

        console.log('[APPROVE_TASK] Success: Mission Sealed');

        res.json({ 
            message: 'Mission Approved and Sealed.', 
            task 
        });

    } catch (error) {
        console.log('[APPROVE_TASK] Execution Failed:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete/Revoke task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await task.deleteOne();
        res.json({ message: 'Task has been revoked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
