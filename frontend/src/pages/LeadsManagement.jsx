import React, { useState, useEffect } from 'react';
import { crmService, hrmsService, staffService } from '../services/api';
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
        notes: '',
        context: '',
        status: 'New',
        assigned_to: '',
        next_follow_up: getDefaultReviewDate(),
        reviewDate: getDefaultReviewDate(),
        priority: 'Medium',
        estimatedValue: ''
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
                staffService.getByRole('Sales')
            ]);
            setLeads(leadsRes.data || []);
            setCustomers(custRes.data || []);
            setSalesReps(staffRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        
        const isNewCustomer = !formData.customer_id;
        if (isNewCustomer && (!formData.name || !formData.phone)) {
            alert('Prospect name and contact number are required.');
            return;
        }

        if (!formData.context && !formData.notes) {
            alert('Requirement context is mandatory');
            return;
        }

        setActionLoading(true);
        try {
            await crmService.createLead(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData(initialFormData);
            alert('Lead captured successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating lead');
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (formData.customer_id) {
            const selected = customers.find(c => (c._id || c.id) === formData.customer_id);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    name: selected.name,
                    email: selected.email || '',
                    phone: selected.phone || ''
                }));
            }
        } else {
             setFormData(prev => ({
                ...prev,
                name: '',
                email: '',
                phone: ''
            }));
        }
    }, [formData.customer_id, customers]);

    const handleQualifyLead = async (id) => {
        setActionLoading(true);
        try {
            await crmService.updateLeadStatus(id, 'Qualified');
            alert('Lead status updated to Qualified!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error qualifying lead');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToDeal = async (id) => {
        if (!window.confirm('Convert this qualified lead to a formal Opportunity?')) return;
        setActionLoading(true);
        try {
            await crmService.convertLead(id);
            alert('Lead converted successfully!');
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error converting lead';
            alert(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Qualified': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'Lost': return 'text-rose-700 bg-rose-50 border-rose-100';
            case 'Contacted': return 'text-amber-700 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const isSubmitDisabled = !formData.notes || (!formData.customer_id && (!formData.name || !formData.phone));

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen bg-white">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] md:text-[11px] font-black px-3 md:px-4 py-1.5 rounded-full uppercase tracking-widest">Sales CRM</span>
                        <span className="text-slate-300 text-sm font-medium">/</span>
                        <span className="text-slate-500 text-[9px] md:text-[11px] font-black uppercase tracking-widest">Lead Intelligence</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight italic">Prospect Pipeline</h1>
                    <p className="text-slate-400 font-bold text-[11px] md:text-[13px] uppercase tracking-[0.2em] mt-3 opacity-80 leading-relaxed">Capture and nurture high-potential opportunities</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full lg:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] md:text-[13px] uppercase tracking-widest py-4 px-8 md:px-10 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> New Lead
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search leads..." 
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-[20px] py-4 pl-14 pr-6 text-sm font-black text-slate-700 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-[20px] text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prospect</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead Source</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Assignment</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="4" className="py-24 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                            ) : leads.length === 0 ? (
                                <tr><td colSpan="4" className="py-24 text-center text-slate-400 font-black uppercase text-[11px] tracking-widest">No leads captured yet</td></tr>
                            ) : leads.map((lead) => (
                                <tr key={lead.id || lead._id} className="group hover:bg-slate-50/30 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                                {lead.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-black text-[15px] tracking-tight">{lead.name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold tracking-tight"><Mail size={12} /> {lead.email || 'N/A'}</span>
                                                    <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold"><Phone size={12} /> {lead.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-slate-700 font-black text-[12px] uppercase tracking-widest">{lead.source}</p>
                                            <p className="text-indigo-600 font-black text-[13px]">Rs. {lead.estimatedValue?.toLocaleString() || 0}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <UserCheck size={12} className="text-indigo-400" /> {typeof lead.assigned_to === 'object' ? (lead.assigned_to?.username || 'Unassigned') : (lead.assigned_to || 'Unassigned')}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {lead.status !== 'Qualified' && lead.status !== 'Lost' && (
                                                <button 
                                                    onClick={() => handleQualifyLead(lead.id || lead._id)}
                                                    className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95"
                                                >
                                                    Qualify
                                                </button>
                                            )}
                                            {lead.status === 'Qualified' && (
                                                <button 
                                                    onClick={() => handleConvertToDeal(lead.id || lead._id)}
                                                    className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95"
                                                >
                                                    Convert
                                                </button>
                                            )}
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-lg transition-all shadow-sm hover:shadow-md">
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
                        >
                            <div className="p-10 pb-6 flex justify-between items-start border-b border-slate-50 bg-slate-50/30">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                                            <Plus size={24} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Capture Lead</h2>
                                    </div>
                                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] ml-13">New Prospect Acquisition Intelligence</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-300 hover:text-rose-500"><XCircle size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
                                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Customer Information</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Customer / Prospect *</label>
                                        <select 
                                            className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none shadow-sm"
                                            value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}
                                        >
                                            <option value="">+ Create New Prospect Profile</option>
                                            {customers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.email || 'N/A'})</option>)}
                                        </select>
                                    </div>

                                    {!formData.customer_id && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-5">
                                            <div className="col-span-2">
                                                <input 
                                                    placeholder="Full Prospect Name / Business Identity"
                                                    required className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm"
                                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    placeholder="Email Address" type="email"
                                                    required className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm"
                                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    placeholder="Contact Number"
                                                    required className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm"
                                                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-l-4 border-emerald-600 pl-4">
                                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Requirement Details</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Requirement / Notes *</label>
                                            <textarea 
                                                required rows="4" 
                                                placeholder="What is the customer looking for?"
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm resize-none"
                                                value={formData.context || formData.notes} onChange={e => setFormData({...formData, context: e.target.value, notes: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Lead Source</label>
                                            <select 
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none shadow-sm"
                                                value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}
                                            >
                                                <option value="Website">Website</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Cold Call">Cold Call</option>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Walk-in">Walk-in</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Lead Status</label>
                                            <select 
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none shadow-sm"
                                                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                            >
                                                <option value="New">New Lead</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Qualified">Qualified</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Estimated Value (Rs.)</label>
                                            <input 
                                                type="number" placeholder="Optional Value"
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm"
                                                value={formData.estimatedValue} onChange={e => setFormData({...formData, estimatedValue: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Lead Priority</label>
                                            <select 
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none shadow-sm"
                                                value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-l-4 border-amber-600 pl-4">
                                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Strategic Assignment</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Assigned Executive *</label>
                                            <select 
                                                required className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all appearance-none shadow-sm"
                                                value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                                            >
                                                <option value="">Select Sales Person...</option>
                                                {salesReps.map(rep => <option key={rep._id || rep.id} value={rep._id || rep.id}>{rep.name || rep.username}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 mb-3">Follow-up Date *</label>
                                            <input 
                                                type="date" required 
                                                className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl py-4.5 px-6 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-sm"
                                                value={formData.next_follow_up} onChange={e => setFormData({...formData, next_follow_up: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                                <button 
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-slate-200 text-slate-600 font-black text-[13px] uppercase tracking-widest py-5 rounded-3xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleCreateLead}
                                    disabled={actionLoading || isSubmitDisabled}
                                    className={`flex-[2] text-white font-black text-[13px] uppercase tracking-widest py-5 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-xl ${
                                        isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
                                    }`}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                    Create Lead
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeadsManagement;
