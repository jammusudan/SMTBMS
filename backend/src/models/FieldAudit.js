const mongoose = require('mongoose');

const fieldAuditSchema = new mongoose.Schema({
    sales_rep: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client_name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    visit_type: {
        type: String,
        enum: ['Site Inspection', 'Material Verification', 'Relationship Management', 'Issue Resolution'],
        default: 'Site Inspection'
    },
    materials_checked: [{
        name: String,
        quantity_at_site: Number,
        condition: {
            type: String,
            enum: ['Good', 'Damaged', 'Partially Used'],
            default: 'Good'
        }
    }],
    observation: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Flagged'],
        default: 'Completed'
    },
    visit_date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('FieldAudit', fieldAuditSchema);
