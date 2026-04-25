/**
 * Calculates the stock status based on current quantity and minimum stock level.
 * 
 * @param {number} quantity - Current available quantity
 * @param {number} minStockLevel - Threshold for low stock
 * @returns {string} - 'Out of Stock' | 'Low Stock' | 'In Stock'
 */
export const calculateStockStatus = (quantity, minStockLevel) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < minStockLevel) return 'Low Stock';
    return 'In Stock';
};

/**
 * Returns the CSS classes for status badges based on the status string.
 * 
 * @param {string} status - The stock status
 * @returns {string} - Tailwind CSS classes for the badge
 */
export const getStockStatusClasses = (status) => {
    switch (status) {
        case 'In Stock':
            return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
        case 'Low Stock':
            return 'bg-amber-50 text-amber-600 border border-amber-100';
        case 'Out of Stock':
            return 'bg-rose-50 text-rose-600 border border-rose-100';
        default:
            return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
};
