import React, { useState, useEffect } from 'react';
import { crmService, hrmsService } from '../services/api';
import { 
    UserCheck, Plus, Search, Filter, MoreVertical, 
    Mail, Phone, Calendar, Loader2, Link as LinkIcon,
    CheckCircle2, XCircle, Clock, Trash2, Edit2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeadsManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Default review date = current + 2 days
    const getDefaultReviewDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    };

    const initialFormData = {
        customer_id: '',
        name: '',
        email: '',
        phone: '',
        source: 'Website',
        context: '',
        estimatedValue: '',
        priority: 'Medium',
        assigned_to: '',
        reviewDate: getDefaultReviewDate(),
        notes: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leadsRes, custRes, staffRes] = await Promise.all([
                crmService.getLeads(),
                crmService.getCustomers(),
                hrmsService.getStaff('sales')
            ]);
            setLeads(leadsRes.data);
            setCustomers(custRes.data);
            setSalesReps(staffRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        
        // Strict Validation
        if (!formData.context || !formData.estimatedValue || (!formData.name && !formData.customer_id)) {
            alert('Please fill all mandatory business fields.');
            return;
        }

        setActionLoading(true);
        try {
            await crmService.createLead(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData(initialFormData);
            alert('Prospect acquisition successful!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating lead');
        } finally {
            setActionLoading(false);
        }
    };

    // Auto-fill customer details if existing selected
    useEffect(() => {
        if (formData.customer_id) {
            const selected = customers.find(c => (c._id || c.id) === formData.customer_id);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    name: selected.name,
                    email: selected.email,
                    phone: selected.phone
                }));
            }
        }
    }, [formData.customer_id, customers]);

    const handleConvertLead = async (id) => {
        if (!window.confirm('Convert this lead to a formal Customer profile?')) return;
        setActionLoading(true);
        try {
            await crmService.convertLead(id);
            alert('Lead converted successfully!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error converting lead');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Won': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'Lost': return 'text-rose-700 bg-rose-50 border-rose-100';
            case 'Negotiation': return 'text-indigo-700 bg-indigo-50 border-indigo-100';
            case 'Contacted': return 'text-amber-700 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const isSubmitDisabled = !formData.context || !formData.estimatedValue || (!formData.name && !formData.customer_id);

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-white">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-700 text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Marketplace Acquisition</span>
                        <span className="text-slate-400 text-base font-bold">| Pipeline Management</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Leads Repository</h1>
                    <p className="text-slate-500 font-black text-[13px] uppercase tracking-[0.2em] mt-3 opacity-80">Track prospects and convert high-intent interest into growth</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] uppercase tracking-widest py-4 px-10 rounded-2xl shadow-xl shadow-slate-100 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> Capture New Lead
                </button>
            </header>

            {/* Filter Bar */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or source..." 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-700 focus:outline-none focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-400"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 bg-white border border-slate-100 rounded-2xl text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    <Filter size={16} /> Filter Status
                </button>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Prospect Intelligence</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Valuation & Priority</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status & Assignment</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Strategic Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                        ) : leads.map((lead) => (
                            <tr key={lead.id || lead._id} className="group hover:bg-slate-50/50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black text-[15px] tracking-tight">{lead.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold tracking-tight"><Mail size={12} /> {lead.email}</span>
                                                <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold"><Clock size={12} /> {lead.reviewDate ? new Date(lead.reviewDate).toLocaleDateString() : 'No Review'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <p className="text-indigo-600 font-black text-[15px] tracking-tight">₹{lead.estimatedValue?.toLocaleString() || 0}</p>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                            lead.priority === 'High' ? 'bg-rose-100 text-rose-700' : 
                                            lead.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {lead.priority || 'Medium'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-2">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(lead.status)}`}>
                                            {lead.status}
                                        </span>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <UserCheck size={12} className="opacity-50" /> {lead.assigned_to?.username || 'Unassigned'}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        {(!lead.converted_customer_id && lead.status !== 'Won' && lead.status !== 'Lost') && (
                                            <button 
                                                onClick={() => handleConvertLead(lead.id || lead._id)}
                                                className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                                            >
                                                Convert <ChevronRight size={14} />
                                            </button>
                                        )}
                                        <button className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
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
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-y-auto max-h-[90vh] p-12 border border-white"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Prospect Acquisition</h2>
                                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Marketplace Lead Intelligence</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XCircle className="text-slate-300" /></button>
                            </div>

                            <form onSubmit={handleCreateLead} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Customer Association</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                            value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}
                                        >
                                            <option value="">-- Capture New Individual / Entity --</option>
                                            {customers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.email || 'No Email'})</option>)}
                                        </select>
                                    </div>

                                    {!formData.customer_id && (
                                        <>
                                            <div className="col-span-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name / Prospect Identity</label>
                                                <input 
                                                    required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                                                <input 
                                                    type="email" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                                                <input 
                                                    required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Deal Context & Requirements <span className="text-rose-500">*</span></label>
                                        <textarea 
                                            required rows="3" 
                                            placeholder="Enter material type, quantity, and requirement details (e.g., 10 tons granite for monthly supply)"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner resize-none"
                                            value={formData.context} onChange={e => setFormData({...formData, context: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Lead Source</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                            value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}
                                        >
                                            <option value="Website">Website</option>
                                            <option value="Email">Email</option>
                                            <option value="Phone Call">Phone Call</option>
                                            <option value="Referral">Referral</option>
                                            <option value="Walk-in">Walk-in</option>
                                            <option value="Social Media">Social Media</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Strategic Valuation (₹) <span className="text-rose-500">*</span></label>
                                        <input 
                                            type="number" required 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Acquisition Priority</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                            value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                                        >
                                            <option value="High">High Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="Low">Low Priority</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Strategic Review Date</label>
                                        <input 
                                            type="date" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            value={formData.reviewDate} onChange={e => setFormData({...formData, reviewDate: e.target.value})}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Assign Executive (Sales)</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none"
                                            value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                                        >
                                            <option value="">Default (Current User)</option>
                                            {salesReps.map(rep => <option key={rep._id || rep.id} value={rep._id || rep.id}>{rep.name || rep.username}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    className={`w-full text-white font-black text-[13px] uppercase tracking-widest py-6 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-2xl ${
                                        isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-[0.98]'
                                    }`}
                                    disabled={actionLoading || isSubmitDisabled}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                    Formalize Lead Acquisition
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeadsManagement;
