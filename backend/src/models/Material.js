const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    unit: {
        type: String,
        required: [true, 'Unit of measurement is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Quantity cannot be negative']
    },
    min_stock_level: {
        type: Number,
        required: true,
        default: 10,
        min: [0, 'Minimum stock level cannot be negative']
    },
    price: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Price cannot be negative']
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for low stock alert
materialSchema.virtual('isLowStock').get(function() {
    return this.quantity <= this.min_stock_level && this.quantity > 0;
});

materialSchema.virtual('isOutOfStock').get(function() {
    return this.quantity <= 0;
});

module.exports = mongoose.model('Material', materialSchema);
