const Order = require('../models/Order');
const Material = require('../models/Material');
const StockLog = require('../models/StockLog');
const ActivityLog = require('../models/ActivityLog');
const Lead = require('../models/Lead');
const { generateNotification } = require('./notificationController');

// @desc    Get all orders
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('vendorId', 'name')
            .populate('customerId', 'name')
            .populate('materialId', 'name unit')
            .populate('processedBy', 'username')
            .populate('createdByUserId', 'username')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new order (Starts as PENDING)
exports.createOrder = async (req, res) => {
    const { materialId, quantity, orderType, vendorId, customerId, status = 'PENDING' } = req.body;
    const qty = Number(quantity);

    if (!materialId || !qty || qty <= 0 || !orderType) {
        return res.status(400).json({ message: 'Missing required order fields' });
    }

    try {
        const material = await Material.findById(materialId);
        if (!material) return res.status(404).json({ message: 'Material not found' });

        // If creating as COMPLETED, handle stock update immediately
        if (status === 'COMPLETED') {
            const previousQuantity = material.quantity;
            let newQuantity;

            if (orderType === 'PURCHASE') {
                newQuantity = previousQuantity + qty;
            } else {
                if (qty > previousQuantity) return res.status(400).json({ message: 'Insufficient stock in inventory for this sale.' });
                newQuantity = previousQuantity - qty;
            }

            material.quantity = newQuantity;
            await material.save();

            // Create the order first to get ID for logs
            const order = await Order.create({
                materialId,
                quantity: qty,
                orderType,
                vendorId: orderType === 'PURCHASE' ? vendorId : undefined,
                customerId: orderType === 'SALE' ? (customerId || undefined) : undefined,
                unitPrice: material.price,
                totalAmount: qty * material.price,
                createdByUserId: req.user.id,
                createdByRole: req.user.role?.toUpperCase() || 'SYSTEM',
                processedBy: req.user.id,
                status: 'COMPLETED'
            });

            // Update Lead status to 'Won' if this is a sale related to an existing customer
            if (orderType === 'SALE' && customerId) {
                await Lead.findOneAndUpdate(
                    { customer_id: customerId, status: { $ne: 'Won' } },
                    { status: 'Won' }
                );
            }

            await StockLog.create({
                materialId,
                actionType: orderType === 'PURCHASE' ? 'IN' : 'OUT',
                quantity: qty,
                previousQuantity,
                newQuantity,
                reason: `Order ${orderType} (#${order._id.toString().slice(-6).toUpperCase()})`,
                logSource: 'ORDER',
                referenceId: order._id.toString(),
                performedBy: req.user.id
            });

            await ActivityLog.create({
                user_id: req.user.id,
                username: req.user.username || 'System',
                action: `${orderType} Close - Material: ${material.name}`,
                module: 'SALES'
            });

            return res.status(201).json({ message: 'Order completed and inventory updated.', order });
        }

        const order = await Order.create({
            materialId,
            quantity: qty,
            orderType,
            vendorId: orderType === 'PURCHASE' ? vendorId : undefined,
            customerId: orderType === 'SALE' ? (customerId || undefined) : undefined,
            unitPrice: material.price,
            totalAmount: qty * material.price,
            createdByUserId: req.user.id,
            createdByRole: req.user.role?.toUpperCase() || 'SYSTEM',
            processedBy: req.user.id,
            status: 'PENDING'
        });

        res.status(201).json({ message: 'Order created successfully (Pending)', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status (Fulfillment or Cancellation with Reversal)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!['COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status update' });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const oldStatus = order.status;
        
        // Locking: COMPLETED orders are read-only
        if (oldStatus === 'COMPLETED') {
            return res.status(400).json({ message: 'Order is COMPLETED and locked. No further status changes allowed.' });
        }
        
        if (oldStatus === 'CANCELLED') return res.status(400).json({ message: 'Order already cancelled' });
        if (oldStatus === status) return res.status(400).json({ message: `Order already ${status}` });

        const material = await Material.findById(order.materialId);
        if (!material) return res.status(404).json({ message: 'Linked material not found' });

        // CASE 1: PENDING -> COMPLETED (Update Stock)
        if (oldStatus === 'PENDING' && status === 'COMPLETED') {
            const previousQuantity = material.quantity;
            let newQuantity;

            if (order.orderType === 'PURCHASE') {
                newQuantity = previousQuantity + order.quantity;
            } else {
                if (order.quantity > previousQuantity) return res.status(400).json({ message: 'Insufficient stock' });
                newQuantity = previousQuantity - order.quantity;
            }

            material.quantity = newQuantity;
            await material.save();

            await StockLog.create({
                materialId: order.materialId,
                actionType: order.orderType === 'PURCHASE' ? 'IN' : 'OUT',
                quantity: order.quantity,
                previousQuantity,
                newQuantity,
                reason: `Order ${order.orderType} (#${order._id.toString().slice(-6).toUpperCase()})`,
                logSource: 'ORDER',
                referenceId: order._id.toString(),
                performedBy: req.user.id
            });
        }

        // CASE 2: COMPLETED -> CANCELLED (Reverse Stock)
        if (oldStatus === 'COMPLETED' && status === 'CANCELLED') {
            const previousQuantity = material.quantity;
            let newQuantity;

            // Reverse logic: If it was PURCHASE (IN), we subtract. If it was SALE (OUT), we add.
            if (order.orderType === 'PURCHASE') {
                if (previousQuantity < order.quantity) return res.status(400).json({ message: 'Cannot reverse purchase: insufficient stock currently in inventory' });
                newQuantity = previousQuantity - order.quantity;
            } else {
                newQuantity = previousQuantity + order.quantity;
            }

            material.quantity = newQuantity;
            await material.save();

            await StockLog.create({
                materialId: order.materialId,
                actionType: order.orderType === 'PURCHASE' ? 'OUT' : 'IN',
                quantity: order.quantity,
                previousQuantity,
                newQuantity,
                reason: `Order Cancelled Reversal (#${order._id.toString().slice(-6).toUpperCase()})`,
                logSource: 'ORDER',
                referenceId: order._id.toString(),
                performedBy: req.user.id
            });
        }

        order.status = status;
        await order.save();

        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action: `Order #${order._id.toString().slice(-6).toUpperCase()} ${status}`,
            module: 'ERP'
        });

        res.json({ message: `Order ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('vendorId', 'name')
            .populate('customerId', 'name text phone email')
            .populate('materialId', 'name sku unit category price')
            .populate('processedBy', 'username')
            .populate('createdByUserId', 'username');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
exports.updatePaymentStatus = async (req, res) => {
    const { paymentStatus } = req.body;
    const orderId = req.params.id;

    if (!['PENDING', 'PAID', 'PARTIAL'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.paymentStatus = paymentStatus;
        if (paymentStatus === 'PAID') {
            order.paidAt = new Date();
        }

        await order.save();

        await ActivityLog.create({
            user_id: req.user.id,
            username: req.user.username || 'System',
            action: `Order #${order._id.toString().slice(-6).toUpperCase()} Payment: ${paymentStatus}`,
            module: 'ERP'
        });

        res.json({ message: `Payment status updated to ${paymentStatus}`, order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
