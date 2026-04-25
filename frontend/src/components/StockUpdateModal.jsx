import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Package, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StockUpdateModal = ({ isOpen, onClose, onSave, material, loading }) => {
    const inputRef = useRef(null);
    const [formData, setFormData] = useState({
        type: 'IN',
        quantity: '',
        reason: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: 'IN',
                quantity: '',
                reason: ''
            });
            setError('');
            // Auto-focus after modal animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Continuous Validation
    useEffect(() => {
        if (formData.quantity === '') {
            setError('');
            return;
        }

        const qty = Number(formData.quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Enter a valid quantity');
        } else if (formData.type === 'OUT' && qty > (material?.quantity || 0)) {
            setError(`Insufficient stock. Available: ${material.quantity} ${material.unit}`);
        } else {
            setError('');
        }
    }, [formData.quantity, formData.type, material]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'quantity') {
            // Prevent negative signs or scientific notation if possible via regex
            // though type="number" handles most, this is a second layer
            if (value !== '' && Number(value) < 0) return;
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (error || formData.quantity === '') return;
        onSave(formData);
    };

    const isValid = formData.quantity !== '' && !error && !loading;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
                >
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <Package className="text-indigo-600" size={20} />
                            Update Stock level
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Material</p>
                            <p className="text-sm font-black text-slate-900">{material?.name}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Current Inventory</span>
                                <span className="text-xs font-black text-indigo-600 tracking-tight">{material?.quantity} {material?.unit}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Type Toggle */}
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Transaction Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'IN' }))}
                                        className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${
                                            formData.type === 'IN' 
                                            ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-100' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        <ArrowUpCircle size={16} />
                                        Stock IN
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'OUT' }))}
                                        className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all ${
                                            formData.type === 'OUT' 
                                            ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100' 
                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        <ArrowDownCircle size={16} />
                                        Stock OUT
                                    </button>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Adjustment Quantity</label>
                                <input 
                                    ref={inputRef}
                                    type="number" name="quantity" required min="1" step="any"
                                    className={`w-full bg-slate-50 border ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-100'} rounded-2xl py-4 px-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base font-black no-spinner`}
                                    placeholder="Enter quantity"
                                    value={formData.quantity} onChange={handleChange}
                                    onKeyDown={(e) => {
                                        // Prevent 'e', 'E', '-', and '+' in number input
                                        if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault();
                                    }}
                                />
                                {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 px-1">{error}</p>}
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Adjustment Reason (Required)</label>
                                <div className="relative">
                                    <Info className="absolute left-4 top-4 text-slate-400" size={16} />
                                    <textarea 
                                        name="reason"
                                        rows="2"
                                        required
                                        className={`w-full bg-slate-50 border ${formData.quantity !== '' && formData.reason.trim() === '' ? 'border-amber-400' : 'border-slate-100'} rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium resize-none`}
                                        placeholder="e.g. Stock Correction, Damaged Goods"
                                        value={formData.reason} onChange={handleChange}
                                    />
                                </div>
                                {formData.quantity !== '' && formData.reason.trim() === '' && (
                                    <p className="text-amber-600 text-[9px] font-black uppercase tracking-widest mt-2 px-1 flex items-center gap-1">
                                        <Info size={10} /> Please provide a valid justification for this manual change
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl text-slate-400 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest border border-slate-100"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" disabled={!isValid || formData.reason.trim() === ''}
                                className={`flex-1 ${formData.type === 'IN' ? 'bg-green-600' : 'bg-red-600'} hover:opacity-90 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl text-[11px] uppercase tracking-widest active:scale-[0.98] disabled:opacity-30 disabled:grayscale-[0.5] disabled:cursor-not-allowed`}
                            >
                                {loading ? 'Updating...' : `Confirm Stock ${formData.type}`}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
            <style>{`
                .no-spinner::-webkit-inner-spin-button, 
                .no-spinner::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .no-spinner { -moz-appearance: textfield; }
            `}</style>
        </AnimatePresence>
    );
};

export default StockUpdateModal;
