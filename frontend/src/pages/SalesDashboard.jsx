import React, { useState, useEffect } from 'react';
import { dashboardService, crmService, materialService, erpService } from '../services/api';
import { 
    TrendingUp, Users, Target, IndianRupee, 
    Calendar, CheckCircle2, AlertCircle, 
    Plus, ArrowRight, Phone, Mail, 
    Loader2, X, UserPlus, ShoppingBag, 
    Package, ShieldCheck, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SalesDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    
    // Success Toast State
    const [successMessage, setSuccessMessage] = useState('');

    const [leadForm, setLeadForm] = useState({ 
        customer_id: '', 
        source: 'Email', 
        context: '', 
        estimatedValue: '', 
        priority: 'Medium',
        reviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    const [saleForm, setSaleForm] = useState({ 
        customerId: '', 
        materialId: '', 
        quantity: '', 
        orderType: 'SALE',
        status: 'COMPLETED' 
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, custRes, matRes] = await Promise.all([
                dashboardService.getSalesStats(),
                crmService.getCustomers(),
                materialService.getAll()
            ]);
            setStats(statsRes.data);
            setCustomers(custRes.data);
            setMaterials(matRes.data);
        } catch (error) {
            console.error('Error fetching sales stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        
        if (!leadForm.context || !leadForm.estimatedValue) {
            alert('Business context and valuation are mandatory');
            return;
        }

        setActionLoading(true);
        try {
            await crmService.createLead(leadForm);
            fetchDashboardData();
            setIsLeadModalOpen(false);
            setLeadForm({ 
                customer_id: '', 
                source: 'Email', 
                context: '', 
                estimatedValue: '', 
                priority: 'Medium',
                reviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            showToast('Lead recorded successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating lead');
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleRecordInventorySale = async (e) => {
        e.preventDefault();
        setError('');
        
        const qty = Number(saleForm.quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity greater than zero.');
            return;
        }

        const selectedMat = materials.find(m => m._id === saleForm.materialId || m.id === saleForm.materialId);
        if (selectedMat && qty > selectedMat.quantity) {
            setError(`Insufficient stock. Only ${selectedMat.quantity} ${selectedMat.unit} available.`);
            return;
        }

        setActionLoading(true);
        try {
            // Backend handles atomicity (Order creation + Stock deduction)
            await erpService.createOrder(saleForm);
            
            // Mirror in CRM for legacy analytics trackers
            await crmService.recordSale({
                customer_id: saleForm.customerId,
                total_amount: qty * (selectedMat?.price || 0),
                date: new Date().toISOString().split('T')[0]
            });

            await fetchDashboardData();
            setIsSaleModalOpen(false);
            setSaleForm({ customerId: '', materialId: '', quantity: '', orderType: 'SALE', status: 'COMPLETED' });
            showToast('Sale completed successfully. Inventory updated.');
        } catch (error) {
            setError(error.response?.data?.message || 'Error processing inventory sale');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <Loader2 className="animate-spin mb-4 text-indigo-600" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Business Logic...</p>
            </div>
        );
    }

    const { all_time, monthly, upcoming_follow_ups } = stats || {};
    const selectedMaterial = materials.find(m => m._id === saleForm.materialId || m.id === saleForm.materialId);
    const isSaleValid = saleForm.materialId && saleForm.customerId && Number(saleForm.quantity) > 0 && (!selectedMaterial || Number(saleForm.quantity) <= selectedMaterial.quantity);

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen relative">
            {/* SUCCESS TOAST */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-4 left-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/20"
                    >
                        <CheckCircle size={20} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Sales Dashboard
                        </span>
                        <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">| {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {user.username}</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage leads, track customers, and execute finalized sales.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsLeadModalOpen(true)}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 font-black py-3.5 px-6 rounded-2xl transition-all shadow-sm active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                        <UserPlus size={18} /> New Lead
                    </button>
                    <button 
                        onClick={() => setIsSaleModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-emerald-100 active:scale-95 text-[11px] uppercase tracking-widest"
                    >
                        <ShoppingBag size={18} /> Finalize Sale
                    </button>
                </div>
            </header>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard title="Active Leads" value={monthly?.total_leads || 0} subtext={`All-time: ${all_time?.total_leads || 0}`} icon={Target} color="indigo" />
                <StatCard title="Confirmed Clients" value={all_time?.total_customers || 0} subtext="Client index" icon={Users} color="sky" />
                <StatCard title="Conversion Rate" value={`${monthly?.conversion_rate || 0}%`} subtext={`Target: 15% `} icon={TrendingUp} color="fuchsia" />
                <StatCard title="Period Revenue" value={`₹${monthly?.total_revenue?.toLocaleString() || 0}`} subtext={`All-time: ₹${all_time?.total_revenue?.toLocaleString() || 0}`} icon={IndianRupee} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Follow-up Queue */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Calendar className="text-indigo-600" size={24} />
                                Pending Engagements
                            </h3>
                            <Link to="/crm/leads" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors">Open Pipeline</Link>
                        </div>
                        
                        <div className="space-y-4">
                            {upcoming_follow_ups?.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/50 rounded-[32px] border border-slate-100 italic text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">
                                    Queue currently clear for {new Date().toLocaleDateString()}
                                </div>
                            ) : upcoming_follow_ups?.map(follow => (
                                <div key={follow.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[24px] bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black tracking-tight text-lg leading-none">{follow.customer_name}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                    <Calendar size={10} /> {new Date(follow.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                                    <Target size={10} /> {follow.phone || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.15em]">
                                        <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent px-4 py-3 rounded-xl active:scale-95">Postpone</button>
                                        <button className="text-white bg-indigo-600 px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Engage Now</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pipeline Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tight">
                             Execution Metrics
                        </h3>
                        <div className="flex-1 flex flex-col justify-center space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Deal Closure Index</span>
                                    <span className="text-indigo-600">{monthly?.conversion_rate}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${monthly?.conversion_rate}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-600"
                                    ></motion.div>
                                </div>
                            </div>

                            <div className="p-8 bg-indigo-50/30 rounded-[32px] border border-indigo-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-indigo-100 -mr-2 -mt-2 transform rotate-12 transition-transform group-hover:scale-125">
                                    <ShieldCheck size={64} />
                                </div>
                                <h4 className="text-[10px] font-black text-indigo-900 mb-2 uppercase tracking-widest relative z-10">Sales Intelligence</h4>
                                <p className="text-xs text-indigo-700/80 leading-relaxed font-bold relative z-10">System-wide inventory validation is active. All finalized sales automatically adjust warehouse levels.</p>
                            </div>
                        </div>
                        <Link to="/inventory/analytics" className="mt-8 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors group">
                            Operational Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {/* Redesigned Capture Lead Modal */}
            <AnimatePresence>
                {isLeadModalOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsLeadModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 text-left"
                        >
                            {/* Header */}
                            <div className="p-8 pb-6 flex justify-between items-start border-b border-slate-50 bg-slate-50/30">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                                            <Plus size={24} />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Capture Lead</h2>
                                    </div>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] ml-13">Marketplace Intelligence</p>
                                </div>
                                <button onClick={() => setIsLeadModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-300 hover:text-rose-500"><X size={20} /></button>
                            </div>

                            {/* Form Body */}
                            <form onSubmit={handleCreateLead} className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Section 1: Customer Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Customer Information</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Customer / Prospect <span className="text-rose-500">*</span></label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                            value={leadForm.customer_id} onChange={e => setLeadForm({...leadForm, customer_id: e.target.value})}
                                        >
                                            <option value="">+ Create New Prospect Profile</option>
                                            {customers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.email || 'N/A'})</option>)}
                                        </select>
                                    </div>

                                    {!leadForm.customer_id && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <input 
                                                    placeholder="Full Prospect Name / Business Identity"
                                                    required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                    value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    placeholder="Email Address" type="email"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                    value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    placeholder="Contact Number"
                                                    required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                    value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Section 2: Lead Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-l-4 border-emerald-600 pl-3">
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Requirement Details</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Requirement / Notes <span className="text-rose-500">*</span></label>
                                            <textarea 
                                                required rows="3" 
                                                placeholder="What is the customer looking for? e.g. 50 tons granite supply"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm resize-none"
                                                value={leadForm.context} onChange={e => setLeadForm({...leadForm, context: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Lead Source</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                value={leadForm.source} onChange={e => setLeadForm({...leadForm, source: e.target.value})}
                                            >
                                                <option value="Website">Website</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Cold Call">Cold Call</option>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Walk-in">Walk-in</option>
                                                <option value="Email">Email</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Value (₹) <span className="text-rose-500">*</span></label>
                                            <input 
                                                type="number" required placeholder="Value in ₹"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                value={leadForm.estimatedValue} onChange={e => setLeadForm({...leadForm, estimatedValue: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Priority</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                value={leadForm.priority} onChange={e => setLeadForm({...leadForm, priority: e.target.value})}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-2">Follow-up Date</label>
                                            <input 
                                                type="date" required 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                                value={leadForm.reviewDate} onChange={e => setLeadForm({...leadForm, reviewDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Footer Actions */}
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                                <button 
                                    type="button" onClick={() => setIsLeadModalOpen(false)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    DISCARD
                                </button>
                                <button 
                                    onClick={handleCreateLead}
                                    disabled={actionLoading}
                                    className={`flex-[2] text-white font-black text-[13px] uppercase tracking-widest py-5 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-xl ${
                                        actionLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                                    }`}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                    CONFIRM_LEAD
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Execute Inventory Sale Modal (REFINED) */}
            <AnimatePresence>
                {isSaleModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 uppercase tracking-tight">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><ShoppingBag className="text-emerald-600" size={20}/> Execute Inventory Sale</h2>
                                <button onClick={() => setIsSaleModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
                            </div>
                            <form onSubmit={handleRecordInventorySale} className="p-8 space-y-6">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600">
                                        <AlertCircle size={20} className="shrink-0" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Inventory Material</label>
                                        <select 
                                            required 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-black outline-none appearance-none cursor-pointer hover:border-indigo-200 transition-colors" 
                                            value={saleForm.materialId} 
                                            onChange={(e) => setSaleForm({...saleForm, materialId: e.target.value})}
                                        >
                                            <option value="">Select Stock Item...</option>
                                            {materials.map(m => (
                                                <option key={m.id || m._id} value={m.id || m._id}>{m.name} (₹{m.price} / unit)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Customer / Client</label>
                                        <select 
                                            required 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-black outline-none appearance-none cursor-pointer hover:border-indigo-200 transition-colors" 
                                            value={saleForm.customerId} 
                                            onChange={(e) => setSaleForm({...saleForm, customerId: e.target.value})}
                                        >
                                            <option value="">Select Customer...</option>
                                            {customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Enter Quantity</label>
                                        <input 
                                            type="number" required min="1" 
                                            className={`w-full bg-slate-50 border rounded-2xl p-4 text-xs font-black outline-none transition-all ${
                                                error?.includes('Insufficient') ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-slate-100 focus:border-emerald-500'
                                            }`} 
                                            value={saleForm.quantity} 
                                            onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})} 
                                            placeholder="Number of units"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        {selectedMaterial && (
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Stock:</span>
                                                <span className={`text-xs font-black ${selectedMaterial.quantity < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                                                    {selectedMaterial.quantity} {selectedMaterial.unit}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Price Evaluation */}
                                {saleForm.materialId && Number(saleForm.quantity) > 0 && (
                                    <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-2xl shadow-emerald-200">
                                        <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-4">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1 leading-none text-white/100">Sale Breakdown</p>
                                                <h4 className="text-sm font-black tracking-tight">{selectedMaterial?.name}</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-white/100">{saleForm.quantity} x ₹{selectedMaterial?.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/20 rounded-lg">
                                                    <IndianRupee size={20} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Net Sale Value</span>
                                            </div>
                                            <p className="text-2xl font-black tracking-tighter">₹{(Number(saleForm.quantity) * (selectedMaterial?.price || 0)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsSaleModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-slate-400 bg-white hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest border border-slate-100 font-mono active:scale-95">DISCARD_SALE</button>
                                    <button 
                                        type="submit" 
                                        disabled={actionLoading || !isSaleValid} 
                                        className="flex-1 bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 text-[11px] uppercase tracking-widest font-mono active:scale-95"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={16}/> : 'FINALIZE_TRANSACTION'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group transition-all"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 font-bold border border-${color}-100 transition-transform group-hover:scale-110`}>
                <Icon size={24} />
            </div>
        </div>
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
        <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{value}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{subtext}</p>
    </motion.div>
);

export default SalesDashboard;
