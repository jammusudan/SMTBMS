import React, { useState, useEffect } from 'react';
import { X, Save, Package, Hash, Tag, Type, DollarSign, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MaterialModal = ({ isOpen, onClose, onSave, material, loading, existingCategories }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        unit: 'pcs',
        quantity: 0,
        min_stock_level: 10,
        price: 0
    });

    useEffect(() => {
        if (material) {
            setFormData(material);
        } else {
            setFormData({
                name: '',
                sku: '',
                category: '',
                unit: 'pcs',
                quantity: 0,
                min_stock_level: 10,
                price: 0
            });
        }
    }, [material, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl border border-slate-100"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Package className="text-indigo-600" />
                            {material ? 'Edit Material' : 'Add New Material'}
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="col-span-2">
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Material Name</label>
                                <div className="relative">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" name="name" required
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                        placeholder="e.g. Steel Rods"
                                        value={formData.name} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* SKU */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">SKU / Code</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" name="sku" required
                                        disabled={!!material}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:bg-slate-50"
                                        placeholder="STR-001"
                                        value={formData.sku} onChange={handleChange}
                                    />
                                </div>
                            </div>

                             {/* Category */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Category</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" name="category" list="category-list"
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                        placeholder="Construction"
                                        value={formData.category} onChange={handleChange}
                                        autoComplete="off"
                                    />
                                    <datalist id="category-list">
                                        {(existingCategories || []).map((cat, i) => (
                                            <option key={i} value={cat} />
                                        ))}
                                        {!existingCategories?.includes('Construction') && <option value="Construction" />}
                                        {!existingCategories?.includes('Electronics') && <option value="Electronics" />}
                                        {!existingCategories?.includes('Raw Material') && <option value="Raw Material" />}
                                        {!existingCategories?.includes('Hardware') && <option value="Hardware" />}
                                    </datalist>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Initial Stock</label>
                                <div className="relative">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="number" name="quantity" required min="0"
                                        disabled={!!material}
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium disabled:opacity-60 disabled:bg-slate-50"
                                        value={formData.quantity} onChange={handleChange}
                                    />
                                </div>
                                {!!material && (
                                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-2 px-1">
                                        Use "Update Stock" for existing materials
                                    </p>
                                )}
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Unit</label>
                                <select 
                                    name="unit"
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium appearance-none"
                                    value={formData.unit} onChange={handleChange}
                                >
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                    <option value="meters">Meters (m)</option>
                                    <option value="liters">Liters (L)</option>
                                    <option value="tons">Tons (t)</option>
                                </select>
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Unit Price ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="number" name="price" required min="0" step="0.01"
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                        value={formData.price} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Min Stock */}
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Min Stock Alert Level</label>
                                <input 
                                    type="number" name="min_stock_level" required min="1"
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                    value={formData.min_stock_level} onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" disabled={loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 text-sm active:scale-[0.98]"
                            >
                                <Save size={20} />
                                {loading ? 'Saving...' : 'Save Material'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MaterialModal;
