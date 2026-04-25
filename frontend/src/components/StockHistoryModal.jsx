import React, { useState, useEffect } from 'react';
import { X, History, ArrowUpRight, ArrowDownRight, User, Calendar, Info, Loader2, Tag, ShoppingBag, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { materialService } from '../services/api';

const StockHistoryModal = ({ isOpen, onClose, material }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, ORDER, MANUAL

    useEffect(() => {
        if (isOpen && material) {
            fetchLogs();
        }
    }, [isOpen, material]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await materialService.getStockLogs(material.id || material._id);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching stock logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        return log.logSource === filter;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                <History className="text-indigo-600" size={20} />
                                Stock Audit Trail
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Traceability for {material?.name}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="px-6 py-4 bg-white border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'ALL', label: 'All Activities', icon: History },
                            { id: 'ORDER', label: 'Inventory Orders', icon: ShoppingBag },
                            { id: 'MANUAL', label: 'Manual Adjustments', icon: Settings }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilter(btn.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    filter === btn.id 
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                <btn.icon size={12} />
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Loader2 className="animate-spin mb-3 text-indigo-600" size={32} />
                                <span className="text-xs font-black uppercase tracking-widest">Scanning audit logs...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                    <Tag size={24} className="text-slate-200" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest block mb-1">No logic entries found</span>
                                <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">No records match the selected filter criteria.</p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log._id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 transition-all group relative overflow-hidden">
                                    {/* Source Ribbon/Badge */}
                                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest ${
                                        log.logSource === 'ORDER' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {log.logSource}
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${log.actionType === 'IN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                {log.actionType === 'IN' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-black tracking-tight ${log.actionType === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {log.actionType === 'IN' ? '+' : '-'}{log.quantity}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">units</span>
                                                </div>
                                                <p className="text-sm font-black text-slate-900 leading-none mt-1">{log.reason}</p>
                                            </div>
                                        </div>
                                        <div className="text-right pr-12">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Flow</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-xs font-bold text-slate-400">{log.previousQuantity}</span>
                                                <div className="w-3 h-[1px] bg-slate-200"></div>
                                                <span className="text-xs font-black text-slate-900">{log.newQuantity}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <User size={12} className="text-indigo-400" />
                                                <span>{log.performedBy?.username || 'System'}</span>
                                            </div>
                                            {log.referenceId && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                                    <Tag size={12} />
                                                    <span>Ref: {log.referenceId.slice(-6).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            Close Archive
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StockHistoryModal;
