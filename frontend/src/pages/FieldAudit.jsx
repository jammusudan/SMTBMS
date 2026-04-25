import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { 
    ShieldCheck, Search, Loader2, ClipboardCheck, 
    AlertTriangle, Package, ShoppingBag, Activity,
    Save, History, ChevronRight, CheckCircle2,
    XCircle, Info, Filter, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FieldAudit = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [auditHistory, setAuditHistory] = useState([]);
    
    // Baseline data from system
    const [baseline, setBaseline] = useState({ materials: [], orders: [], tasks: [] });
    
    // Working state for the current audit
    const [inventoryAudit, setInventoryAudit] = useState([]);
    const [salesAudit, setSalesAudit] = useState([]);
    const [activityAudit, setActivityAudit] = useState([]);
    const [summary, setSummary] = useState('');

    useEffect(() => {
        fetchBaseline();
    }, []);

    const fetchBaseline = async () => {
        setLoading(true);
        try {
            const { data } = await auditService.getBaseline();
            setBaseline(data);
            
            // Initialize working state
            setInventoryAudit(data.materials.map(m => ({
                materialId: m._id,
                name: m.name,
                system_qty: m.quantity,
                physical_qty: m.quantity,
                discrepancy: 0,
                notes: ''
            })));
            
            setSalesAudit(data.orders.map(o => {
                const deal = data.deals.find(d => d.customerId === o.customerId?._id && d.materialId === o.materialId?._id);
                const payment = data.transactions.find(t => t.customerId === o.customerId?._id && (t.dealId === deal?._id || t.deal_id === deal?._id));

                let auditStatus = 'FAILED'; // Default to FAILED for strict audit
                let auditReason = 'Manual verification required';

                if (o.totalAmount === 0) {
                    auditStatus = 'BLOCKED';
                    auditReason = 'No delivery completed';
                } else if (o.totalAmount < (deal?.amount || 0)) {
                    auditStatus = 'FAILED';
                    auditReason = 'Partial delivery';
                } else if (payment?.status !== 'Completed') {
                    auditStatus = 'FAILED';
                    auditReason = 'Payment not completed';
                } else if (o.status === 'COMPLETED' && payment?.status === 'Completed') {
                    auditStatus = 'PASSED';
                    auditReason = 'Delivery and payment verified';
                }

                return {
                    orderId: o._id,
                    dealId: deal?._id,
                    customer: o.customerId?.name || 'Data Error',
                    amount: deal?.amount || o.totalAmount, // Deal Value
                    delivered_value: o.totalAmount, // Delivered Value
                    payment_status: payment?.status || 'Pending',
                    status: o.status, // Delivery Status
                    auditStatus,
                    auditReason,
                    is_verified: auditStatus === 'PASSED',
                    mismatch_flag: auditStatus !== 'PASSED',
                    notes: ''
                };
            }));
            
            setActivityAudit(data.tasks.map(t => ({
                taskId: t._id,
                employee: (t.assignedTo?.first_name && t.assignedTo?.last_name) 
                    ? `${t.assignedTo.first_name} ${t.assignedTo.last_name}` 
                    : (t.assignedTo?.username || 'Data Error'),
                task_name: t.title,
                status: t.status,
                is_verified: false
            })));
            
        } catch (error) {
            console.error('Error fetching baseline:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await auditService.getHistory();
            setAuditHistory(data);
            setHistoryOpen(true);
        } catch (error) {
            alert('Error fetching history');
        }
    };

    const handleQtyChange = (index, val) => {
        const updated = [...inventoryAudit];
        const physical = parseFloat(val) || 0;
        updated[index].physical_qty = physical;
        updated[index].discrepancy = physical - updated[index].system_qty;
        setInventoryAudit(updated);
    };

    const toggleSalesVerify = (index, field) => {
        const updated = [...salesAudit];
        updated[index][field] = !updated[index][field];
        setSalesAudit(updated);
    };

    const toggleActivityVerify = (index) => {
        const updated = [...activityAudit];
        updated[index].is_verified = !updated[index].is_verified;
        setActivityAudit(updated);
    };

    const handleSubmitAudit = async () => {
        if (!window.confirm('Submit this verification report? All discrepancies will be logged.')) return;
        setSubmitting(true);
        try {
            await auditService.submit({
                inventory_items: inventoryAudit.map(i => ({
                    ...i,
                    notes: i.notes.trim() || 'No issues found during verification'
                })),
                sales_items: salesAudit.map(s => ({
                    ...s,
                    notes: s.notes.trim() || 'No fulfillment issues found'
                })),
                activity_items: activityAudit,
                summary: summary.trim() || 'Executive seal applied with standard protocols.'
            });
            alert('Audit report submitted successfully!');
            fetchBaseline();
        } catch (error) {
            alert('Error submitting report');
        } finally {
            setSubmitting(false);
        }
    };

    const totalDiscrepancies = inventoryAudit.filter(i => i.discrepancy !== 0).length + 
                             salesAudit.filter(s => s.mismatch_flag).length;

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin text-indigo-600 mb-4 mx-auto" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Synchronizing System Data...</p>
            </div>
        </div>
    );

    return (
        <div className="p-8 min-h-screen bg-[#f8fafc] pb-32">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-lg">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Integrity Audit</h1>
                    </div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest opacity-70 flex items-center gap-2">
                        Verification Layer <ChevronRight size={14} /> Cross-Reference Engine
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={fetchHistory}
                        className="bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <History size={16} /> Audit Logs
                    </button>
                    <button 
                        onClick={handleSubmitAudit}
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Seal Report</>}
                    </button>
                </div>
            </header>

            {/* Dashboard Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Assets</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">{inventoryAudit.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ShoppingBag size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Verification</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">{salesAudit.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">{activityAudit.length}</p>
                    </div>
                </div>
                <div className={`p-6 rounded-[32px] border transition-all flex items-center gap-4 ${totalDiscrepancies > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50'}`}>
                    <div className={`p-3 rounded-2xl ${totalDiscrepancies > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
                        {totalDiscrepancies > 0 ? <AlertTriangle size={24} /> : <ClipboardCheck size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Discrepancies</p>
                        <p className="text-xl font-black tracking-tighter">{totalDiscrepancies} Found</p>
                    </div>
                </div>
            </div>

            {/* Tabbed Interface */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex border-b border-slate-100 p-3 bg-slate-50/50">
                    {[
                        { id: 'inventory', label: 'Inventory Audit', icon: Package },
                        { id: 'sales', label: 'Sales Verification', icon: ShoppingBag },
                        { id: 'activity', label: 'Activity Check', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-indigo-600 shadow-md shadow-slate-100 scale-[1.02]' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'inventory' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        Stock Cross-Reference <Info size={16} className="text-slate-300" />
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input real-world physical count</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-50">
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Material Identity</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">System Qty</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Physical Qty</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 text-center">Variance</th>
                                                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Executive Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {inventoryAudit.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-5 px-4 font-bold text-slate-800 tracking-tight">{item.name}</td>
                                                    <td className="py-5 px-4 font-black text-slate-400 text-sm">{item.system_qty}</td>
                                                    <td className="py-5 px-4 w-32">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-slate-100 border-none rounded-xl py-2 px-3 text-sm font-black text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-center"
                                                            value={item.physical_qty}
                                                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="py-5 px-4 text-center">
                                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                            item.discrepancy === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                        }`}>
                                                            {item.discrepancy === 0 ? 'Verified Match' : `${item.discrepancy > 0 ? '+' : ''}${item.discrepancy} Units`}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <input 
                                                            placeholder="Add internal note..."
                                                            className="w-full bg-transparent border-b border-transparent focus:border-slate-200 py-1 text-xs font-medium text-slate-500 outline-none"
                                                            value={item.notes}
                                                            onChange={(e) => {
                                                                const updated = [...inventoryAudit];
                                                                updated[idx].notes = e.target.value;
                                                                setInventoryAudit(updated);
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'sales' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">Order Fulfillment Review</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify physical delivery vs system status</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {salesAudit.map((item, idx) => (
                                        <div key={idx} className={`p-6 rounded-[32px] border transition-all flex items-center justify-between ${item.is_verified ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.is_verified ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                                                    <ShoppingBag size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 tracking-tight">{item.customer}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">₹{item.amount.toLocaleString()} • {item.status}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => toggleSalesVerify(idx, 'mismatch_flag')}
                                                    className={`p-2.5 rounded-xl transition-all ${item.mismatch_flag ? 'bg-rose-500 text-white scale-110 shadow-lg shadow-rose-100' : 'bg-slate-100 text-slate-300 hover:text-rose-400'}`}
                                                    title="Flag Mismatch"
                                                >
                                                    <AlertTriangle size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleSalesVerify(idx, 'is_verified')}
                                                    className={`p-2.5 rounded-xl transition-all ${item.is_verified ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-300 hover:text-indigo-600'}`}
                                                    title="Verify Order"
                                                >
                                                    {item.is_verified ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'activity' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">Field Activity Audit</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify completion of assigned field tasks</p>
                                </div>
                                <div className="space-y-4">
                                    {activityAudit.map((item, idx) => (
                                        <div key={idx} className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[28px] hover:shadow-xl hover:shadow-slate-100 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-[10px]">
                                                    {item.employee.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{item.task_name}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Assigned to: {item.employee} • System Status: {item.status}</p>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => toggleActivityVerify(idx)}
                                                className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    item.is_verified 
                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                                                    : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'
                                                }`}
                                            >
                                                {item.is_verified ? 'Execution Verified' : 'Verify Execution'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Summary Section */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Overall Forensic Summary</label>
                    <textarea 
                        rows={3} 
                        className="w-full bg-white border border-slate-100 rounded-[32px] p-6 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none shadow-inner"
                        placeholder="Detail any major discrepancies, observed anomalies, or audit conclusions for management review..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                    />
                </div>
            </div>

            {/* Float Bottom Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg z-[1000]">
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-[40px] p-4 flex items-center justify-between border border-white/10 shadow-2xl">
                    <div className="pl-6">
                        <p className="text-white font-black text-lg tracking-tighter flex items-center gap-2">
                             Verification Pulse <span className={`w-2 h-2 rounded-full animate-pulse bg-emerald-500`}></span>
                        </p>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Active Audit Session</p>
                    </div>
                    <button 
                        onClick={handleSubmitAudit}
                        className="bg-white text-slate-900 font-black text-[11px] uppercase tracking-widest py-4 px-8 rounded-[30px] hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
                    >
                        Submit Report
                    </button>
                </div>
            </div>

            {/* Audit History Modal */}
            <AnimatePresence>
                {historyOpen && (
                    <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setHistoryOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border-4 border-white"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Archive</h2>
                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">Verified historical integrity scans</p>
                                </div>
                                <button onClick={() => setHistoryOpen(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><XCircle size={32} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {auditHistory.map((report, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-3xl bg-slate-50 text-slate-900 border border-slate-100">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-xl font-black leading-none">{new Date(report.createdAt).getDate()}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 tracking-tight uppercase tracking-widest text-xs">Auditor: {report.auditor?.username}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                            report.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                            report.status === 'Review Required' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {report.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className={`text-xl font-black tracking-tighter ${report.total_discrepancies > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>{report.total_discrepancies}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discrepancies</p>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedReport(report)}
                                                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                    title="View Detailed Report"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                            <p className="text-xs font-medium text-slate-500 italic">"{report.summary || 'Initial system baseline seal.'}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Detailed View Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedReport(null)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col"
                        >
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Deep-Dive</h2>
                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                        Ref: #{selectedReport._id.substring(18)} <span className="w-1 h-1 rounded-full bg-slate-300"></span> Sealed on {new Date(selectedReport.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedReport(null)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-full shadow-sm transition-all"><XCircle size={28} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                {/* Inventory Discrepancy Table */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={18} /></div>
                                            Physical Asset Verification
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">
                                            {selectedReport.inventory_items.length} Items Audited
                                        </span>
                                    </div>
                                    <div className="overflow-hidden border border-slate-100 rounded-[32px]">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Identity</th>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Qty</th>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Physical Qty</th>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Difference</th>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Variance</th>
                                                    <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditor Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {selectedReport.inventory_items.map((item, i) => (
                                                    <tr key={i} className={item.discrepancy !== 0 ? 'bg-rose-50/20' : ''}>
                                                        <td className="py-5 px-8">
                                                            <p className="text-sm font-black text-slate-800">{item.name || 'Data Error'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">#{item.materialId?.substring(18) || 'ERR'}</p>
                                                        </td>
                                                        <td className="py-5 px-8 text-center text-sm font-bold text-slate-500">{item.system_qty}</td>
                                                        <td className="py-5 px-8 text-center text-sm font-black text-slate-900">{item.physical_qty}</td>
                                                        <td className="py-5 px-8 text-center text-sm font-bold text-slate-500">
                                                            {item.system_qty - item.physical_qty}
                                                        </td>
                                                        <td className="py-5 px-8 text-center">
                                                            <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                                item.discrepancy === 0 ? 'text-emerald-500 bg-emerald-50' : 
                                                                item.discrepancy < 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                                            }`}>
                                                                {item.discrepancy === 0 ? 'MATCH' : 
                                                                 item.discrepancy < 0 ? `SHORTAGE (${Math.abs(item.discrepancy)})` : `EXCESS (${item.discrepancy})`}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 px-8 text-xs font-medium text-slate-600 italic max-w-xs truncate">
                                                            {item.notes || (item.discrepancy === 0 ? 'No issues found during verification' : `Audit flag: ${item.discrepancy < 0 ? 'Physical count below system baseline' : 'Overstock detected in bin'}`)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Sales Integrity Section */}
                                <section>
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
                                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ShoppingBag size={18} /></div>
                                        Order Fulfillment Integrity
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedReport.sales_items.map((sale, i) => (
                                            <div key={i} className={`p-6 rounded-[32px] border ${sale.mismatch_flag ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'} flex items-center justify-between`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                        sale.auditStatus === 'BLOCKED' ? 'bg-rose-600' : 
                                                        (sale.auditStatus === 'PASSED' ? 'bg-emerald-500' : 'bg-amber-500')
                                                    } text-white shadow-lg`}>
                                                        {sale.auditStatus === 'BLOCKED' ? <AlertTriangle size={18} /> : (sale.auditStatus === 'PASSED' ? <CheckCircle2 size={18} /> : <Info size={18} />)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{sale.customer || 'Data Error'}</h4>
                                                        <div className="flex flex-wrap gap-2 mt-1.5 focus:outline-none">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded">Deal: ₹{sale.amount.toLocaleString()}</span>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${sale.delivered_value >= sale.amount ? 'text-indigo-500 border-indigo-100' : 'text-rose-500 border-rose-100'}`}>Delivered: ₹{sale.delivered_value.toLocaleString()}</span>
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${sale.payment_status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>Pay: {sale.payment_status}</span>
                                                            
                                                            <div className="flex gap-1">
                                                                {sale.status === 'COMPLETED' ? <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded tracking-tighter">✔ Completed</span> : <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded tracking-tighter">✘ {sale.status}</span>}
                                                                {sale.payment_status === 'Completed' ? <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded tracking-tighter">✔ Paid</span> : <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded tracking-tighter">✘ Unpaid</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                        sale.auditStatus === 'BLOCKED' ? 'bg-rose-600 text-white animate-pulse' : 
                                                        sale.auditStatus === 'FAILED' ? 'bg-amber-500 text-white' : 
                                                        'bg-emerald-500 text-white'
                                                    }`}>
                                                        {sale.auditStatus}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <p className={`text-[9px] font-black uppercase tracking-tighter ${
                                                            sale.auditStatus === 'BLOCKED' ? 'text-rose-600' : 
                                                            sale.auditStatus === 'FAILED' ? 'text-amber-600' : 
                                                            'text-emerald-500'
                                                        }`}>
                                                            {sale.auditReason}
                                                        </p>
                                                        <div className="mt-2 flex flex-col gap-1 items-end">
                                                            {sale.auditStatus === 'BLOCKED' && (
                                                                <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase">Execution blocked due to audit failure</span>
                                                            )}
                                                            {sale.auditStatus === 'FAILED' && (
                                                                <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase">Manager action required</span>
                                                            )}
                                                            {sale.auditStatus === 'PASSED' && (
                                                                <button className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase hover:bg-emerald-600 hover:text-white transition-all">Finalize Sale</button>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-300 mt-2">Ref: {sale.dealId?.substring(18) || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Final Verification Summary & Metadata */}
                                <section className="p-8 bg-slate-900 rounded-[40px] text-white">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <ShieldCheck className="text-emerald-400" size={32} />
                                            <div>
                                                <h4 className="text-lg font-black tracking-tight">Executive Forensic Conclusion</h4>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Final Audit Seal & Report Status</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sealed By</p>
                                            <p className="text-sm font-black text-white">{selectedReport.auditor?.username}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{new Date(selectedReport.createdAt).toLocaleString()} (IST)</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                                            {selectedReport.summary}
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}</style>
        </div>
    );
};

export default FieldAudit;
