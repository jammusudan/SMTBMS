const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
    material_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    change_amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Purchase', 'Usage', 'Adjustment', 'Production']
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
