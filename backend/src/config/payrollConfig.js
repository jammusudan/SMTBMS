/**
 * HR Payroll Configuration Layer
 * Centralized business rules for tax, PF, and compliance metadata.
 */

const payrollConfig = {
    // Company Compliance Metadata
    COMPANY: {
        NAME: "SMTBMS Solutions Pvt Ltd",
        REG_OFFICE: "101, Tech Avenue, Industrial Estate, Chennai - 600032",
        GSTIN: "33AAAAA0000A1Z5",
        PAN: "ABCDE1234F",
        EMAIL: "finance@smtbms.com",
        WEBSITE: "www.smtbms.com"
    },

    // Statutory Components (Percentages)
    STATUTORY: {
        PF_RATE: 0.12,         // 12% of Basic
        ESI_RATE: 0.0075,      // 0.75% of Gross
        PT_THRESHOLD: 15000,   // Professional Tax threshold
        PT_AMOUNT: 200         // Monthly Professional Tax
    },

    // Tax Rules (Placeholder for slab logic)
    TAX: {
        CURRENCY: "INR",
        SYMBOL: "₹",
        ENABLED: true
    },

    // Operational Safeguards
    SAFEGUARDS: {
        MAX_BONUS_PERCENT: 0.50, // Max 50% of monthly gross
        ENABLE_SOFT_DELETE: true,
        BATCH_CHUNK_SIZE: 10     // Processing chunk for worker
    }
};

module.exports = payrollConfig;
