import React, { useState, useEffect } from 'react';
import { crmService, materialService } from '../services/api';
import { 
    TrendingUp, Plus, Search, Filter, 
    Calendar, IndianRupee, Target, Loader2,
    ChevronRight, CheckCircle2, XCircle, MoreVertical,
    Briefcase, User, Info, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DealKanban from '../components/DealKanban';

const DealsManagement = () => {
    const [deals, setDeals] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [view, setView] = useState('kanban'); // Default to kanban for "wow" factor
    
    const [formData, setFormData] = useState({
        customer_id: '',
        lead_id: '',
        title: '',
        amount: '',
        materialId: '',
        quantity: '',
        stage: 'Prospecting',
        expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    });

    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        fetchData();
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const res = await materialService.getAll();
            setMaterials(res.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [dealsRes, custRes] = await Promise.all([
                crmService.getDeals(),
                crmService.getCustomers()
            ]);
            setDeals(dealsRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeal = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await crmService.createDeal(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ customer_id: '', title: '', amount: '', stage: 'Discovery', expected_close_date: new Date().toISOString().split('T')[0], notes: '' });
        } catch (error) {
            alert('Error creating deal');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStage = async (id, stage) => {
        let lost_reason = '';
        if (stage === 'Lost') {
            lost_reason = window.prompt('Select Lost Reason: Price, Competitor, No Need, Timing, Product Fit, Other');
            if (!lost_reason) return;
        }

        if (stage === 'Won') {
            if (!window.confirm('Finalizing this sale will automatically create a Customer profile and a Sales Order. Proceed?')) return;
        }

        setActionLoading(true);
        try {
            await crmService.updateDealStage(id, stage, lost_reason);
            alert(`Deal successfully moved to ${stage}`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating deal stage');
        } finally {
            setActionLoading(false);
        }
    };

    const getStageStyle = (stage) => {
        switch (stage) {
            case 'Won': return 'bg-emerald-600 text-white shadow-emerald-100';
            case 'Lost': return 'bg-rose-600 text-white shadow-rose-100';
            case 'Negotiation': return 'bg-indigo-600 text-white shadow-indigo-100';
            case 'Final': return 'bg-violet-600 text-white shadow-violet-100';
            case 'Prospecting': return 'bg-amber-600 text-white shadow-amber-100';
            default: return 'bg-slate-200 text-slate-700 shadow-slate-100';
        }
    };

    const totalPipeline = deals.reduce((acc, curr) => acc + (curr.stage !== 'Lost' ? curr.amount : 0), 0);

    return (
    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="bg-indigo-600 text-white text-[10px] md:text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">Revenue Pipeline</span>
                        <span className="text-slate-400 text-sm md:text-base font-bold">| Opportunity Tracking</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic">Deals Portfolio</h1>
                    <p className="text-slate-500 font-black text-[10px] md:text-[13px] uppercase tracking-[0.2em] mt-3 opacity-80">Strategic deal flow management and expected revenue forecasting</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-6">
                    <div className="text-left md:text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:bg-transparent md:p-0 md:border-0 md:shadow-none">
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">Total Weighted Pipeline</p>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">₹{totalPipeline.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
                            <button 
                                onClick={() => setView('table')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'table' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <List size={20} />
                            </button>
                            <button 
                                onClick={() => setView('kanban')}
                                className={`p-2.5 rounded-xl transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] md:text-[13px] uppercase tracking-widest py-4 px-6 md:px-10 rounded-2xl shadow-xl shadow-slate-100 transition-all active:scale-[0.98]"
                        >
                            <Plus size={18} /> Initialize
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {view === 'table' ? (
                    <motion.div 
                        key="table"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)]"
                    >
                        <table className="w-full text-left border-collapse">
                            {/* ... table content remains same ... */}
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Opportunity Intelligence</th>
                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th>
                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Financial Magnitude</th>
                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Pipeline Stage</th>
                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Strategic Pivot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                        ) : deals.length === 0 ? (
                            <tr><td colSpan="5" className="py-24 text-center text-slate-400 font-black uppercase tracking-widest text-xs">No Active Opportunities in Pipeline</td></tr>
                        ) : deals.map((deal) => (
                            <tr key={deal._id} className="group hover:bg-slate-50/80 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black text-[15px] tracking-tight">{deal.title}</p>
                                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                <Calendar size={12} /> Target: {new Date(deal.expected_close_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                 <td className="px-8 py-6">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px]">
                                             {(deal.customer_id?.name || deal.prospect_name || '?').charAt(0)}
                                         </div>
                                         <div>
                                             <p className="text-slate-700 font-black text-[13px] tracking-tight truncate max-w-[200px]">{deal.customer_id?.name || deal.prospect_name}</p>
                                             {deal.prospect_email && <p className="text-[10px] text-slate-400 font-bold tracking-tight">{deal.prospect_email}</p>}
                                         </div>
                                     </div>
                                 </td>
                                <td className="px-8 py-6">
                                    <p className="text-indigo-600 font-black text-lg tracking-tight">₹{deal.amount.toLocaleString()}</p>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Weighted Value</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${getStageStyle(deal.stage)}`}>
                                        {deal.stage}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        {deal.stage !== 'Won' && deal.stage !== 'Lost' && (
                                            <>
                                                 <button 
                                                     onClick={() => handleUpdateStage(deal._id, 'Won')}
                                                     className="px-4 py-2 text-emerald-600 hover:bg-emerald-600 hover:text-white bg-white border border-emerald-100 rounded-xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                                                     title="Finalize Sale"
                                                 >
                                                     <IndianRupee size={16} /> Finalize
                                                 </button>
                                                <button 
                                                    onClick={() => handleUpdateStage(deal._id, 'Lost')}
                                                    className="p-2.5 text-rose-600 hover:bg-rose-600 hover:text-white bg-white border border-rose-100 rounded-xl transition-all shadow-sm"
                                                    title="Close Lost"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                        </table>
                    </motion.div>
                ) : (
                    <motion.div
                        key="kanban"
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                    >
                        <DealKanban 
                            deals={deals} 
                            onUpdateStage={handleUpdateStage} 
                            actionLoading={actionLoading} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden p-12 border border-white"
                        >
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-indigo-600 text-white rounded-[20px] shadow-lg shadow-indigo-100">
                                    <Target size={30} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Initialize Opportunity</h2>
                                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Strategic Deal Onboarding</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateDeal} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Deal Identifier / Title</label>
                                        <input 
                                            required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            placeholder="e.g. Q3 Material Supply Contract"
                                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Client Association</label>
                                        <select 
                                            required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                            value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.filter(c => c.isApproved).map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Strategic Valuation (₹)</label>
                                        <input 
                                            type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            placeholder="50,000"
                                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                                        />
                                    </div>
                                     <div className="col-span-2">
                                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Material / Product</label>
                                         <select 
                                             required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                             value={formData.materialId} onChange={e => setFormData({...formData, materialId: e.target.value})}
                                         >
                                             <option value="">Select Material</option>
                                             {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.grade})</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Quantity</label>
                                         <input 
                                             type="number" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                             placeholder="100"
                                             value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})}
                                         />
                                     </div>
                                     <div>
                                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Expected Closure</label>
                                         <input 
                                             type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                             value={formData.expected_close_date} onChange={e => setFormData({...formData, expected_close_date: e.target.value})}
                                         />
                                     </div>
                                </div>
                                <button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] uppercase tracking-widest py-6 rounded-3xl shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                    Formalize Deal Initialization
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DealsManagement;
