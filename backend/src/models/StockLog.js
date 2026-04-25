const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    actionType: {
        type: String,
        enum: ['IN', 'OUT'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0.01
    },
    previousQuantity: {
        type: Number,
        required: true
    },
    newQuantity: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        trim: true,
        required: [true, 'Log reason is required']
    },
    logSource: {
        type: String,
        enum: ['ORDER', 'MANUAL', 'TASK'],
        required: true,
        default: 'MANUAL'
    },
    referenceId: {
        type: String,
        trim: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

stockLogSchema.index({ materialId: 1, createdAt: -1 });

module.exports = mongoose.model('StockLog', stockLogSchema);
