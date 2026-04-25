const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');
const StockLog = require('../models/StockLog');

// @desc    Get all materials
// @route   GET /api/materials
exports.getMaterials = async (req, res) => {
    try {
        const materials = await Material.find().sort({ createdAt: -1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single material
// @route   GET /api/materials/:id
exports.getMaterialById = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new material
exports.addMaterial = async (req, res) => {
    const { name, sku, category, unit, quantity, min_stock_level, price } = req.body;
    
    try {
        const material = await Material.create({
            name,
            sku,
            category,
            unit,
            quantity,
            min_stock_level,
            price
        });
        res.status(201).json(material);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'SKU already exists' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update material
exports.updateMaterial = async (req, res) => {
    const { name, category, unit, quantity, min_stock_level, price } = req.body;

    // Validation
    if (quantity < 0 || price < 0 || min_stock_level < 0) {
        return res.status(400).json({ message: 'Quantity and Price must be non-negative' });
    }

    try {
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { name, category, unit, quantity, min_stock_level, price },
            { new: true, runValidators: true }
        );
        
        if (!material) return res.status(404).json({ message: 'Material not found' });
        
        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action: `Updated details for Material: ${name}`,
            module: 'Materials'
        });

        res.json({ message: 'Material updated successfully', material });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update stock quantity (IN/OUT)
// @route   PUT /api/materials/:id/stock
exports.updateStock = async (req, res) => {
    const { type, quantity, reason } = req.body;
    const qty = Number(quantity);

    if (!type || isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Valid type and positive quantity are required' });
    }

    if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: 'A valid reason is required for manual stock adjustments' });
    }

    try {
        const material = await Material.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        if (type === 'OUT' && material.quantity < qty) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        const previousQuantity = material.quantity;
        const newQuantity = type === 'IN' ? previousQuantity + qty : previousQuantity - qty;

        // Update Material
        material.quantity = newQuantity;
        await material.save();

        // Create Stock Log (Audit)
        await StockLog.create({
            materialId: material._id,
            actionType: type,
            quantity: qty,
            previousQuantity,
            newQuantity,
            reason: reason.trim(),
            logSource: 'MANUAL',
            performedBy: req.user.id
        });

        // Global Activity Log
        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action: `Stock ${type}: ${qty} ${material.unit} for ${material.name}`,
            module: 'Materials'
        });

        res.json({ 
            message: `Stock updated successfully (${type})`, 
            material 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get stock transaction logs for a material
// @route   GET /api/materials/:id/logs
exports.getStockLogs = async (req, res) => {
    try {
        const logs = await StockLog.find({ materialId: req.params.id })
            .populate('performedBy', 'username first_name last_name')
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete material
// @route   DELETE /api/materials/:id
exports.deleteMaterial = async (req, res) => {
    try {
        const result = await Material.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Material not found' });
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
