import React, { useState, useEffect } from 'react';
import { crmService } from '../services/api';
import { 
    Filter, Plus, Search, Loader2, Mail, Phone, 
    MessageSquare, Edit2, CheckCircle2, AlertCircle, 
    TrendingUp, UserPlus, MoreVertical, Calendar,
    ArrowRight, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesPipeline = () => {
    const [leads, setLeads] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        customer_id: '',
        source: 'Email',
        notes: '',
        next_follow_up: ''
    });

    const columns = [
        { id: 'New', title: 'New Leads', color: 'indigo' },
        { id: 'Contacted', title: 'In Discussion', color: 'sky' },
        { id: 'Converted', title: 'Closed Won', color: 'emerald' },
        { id: 'Lost', title: 'Closed Lost', color: 'rose' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leadRes, custRes] = await Promise.all([
                crmService.getLeads(),
                crmService.getCustomers()
            ]);
            setLeads(leadRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await crmService.createLead(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ customer_id: '', source: 'Email', notes: '', next_follow_up: '' });
        } catch (error) {
            alert('Error creating lead');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await crmService.updateLeadStatus(id, status);
            // Optimistic update for smooth feel
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        } catch (error) {
            console.error('Error updating status:', error);
            fetchData();
        }
    };

    const getSourceIcon = (source) => {
        switch (source) {
            case 'Social Media': return <TrendingUp size={14} />;
            case 'Email': return <Mail size={14} />;
            case 'Call': return <Phone size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <div className="p-8 min-h-screen bg-[#f8fafc]">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <TrendingUp className="text-indigo-600" size={32} />
                        Sales Pipeline
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your business opportunities and conversion flow.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-200 active:scale-95"
                >
                    <Plus size={20} />
                    Create Admission
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 text-slate-400">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                    <p className="text-lg font-bold tracking-tight">Loading Pipeline Infrastructure...</p>
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                    {columns.map(column => (
                        <div key={column.id} className="flex-shrink-0 w-80 snap-start">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full bg-${column.color}-500 shadow-[0_0_10px_rgba(var(--tw-color-${column.color}-500),0.5)]`}></span>
                                    <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">{column.title}</h3>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {leads.filter(l => l.status === column.id).length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 transition-colors"><Plus size={16}/></button>
                            </div>

                            <div className="space-y-4 min-h-[600px] rounded-[32px] bg-slate-100/50 p-4 border border-slate-200/50 border-dashed">
                                <AnimatePresence mode='popLayout'>
                                    {leads.filter(l => l.status === column.id).map((lead) => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            key={lead.id} 
                                            className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl group hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 transition-all cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{lead.customer_name}</h4>
                                                <div className="text-slate-300 group-hover:text-slate-400 transition-colors"><MoreVertical size={16}/></div>
                                            </div>
                                            
                                            <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-4 italic">"{lead.notes || 'Interested in bulk tracking...'}"</p>
                                            
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                                    {getSourceIcon(lead.source)} {lead.source}
                                                </span>
                                                {lead.next_follow_up && (
                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md uppercase tracking-wider">
                                                        <Calendar size={10} /> {new Date(lead.next_follow_up).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex -space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600 uppercase">
                                                        {lead.assigned_to ? lead.assigned_to[0] : '?'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {column.id !== 'Converted' && (
                                                        <button 
                                                            onClick={() => handleStatusUpdate(lead.id, column.id === 'New' ? 'Contacted' : 'Converted')}
                                                            className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Promote Stage"
                                                        >
                                                            {column.id === 'New' ? 'Discuss' : 'Close Deal'} <ChevronRight size={14}/>
                                                        </button>
                                                    )}
                                                    {column.id === 'Converted' && <CheckCircle2 className="text-emerald-500" size={16}/>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {leads.filter(l => l.status === column.id).length === 0 && (
                                    <div className="text-center py-20 text-slate-300 font-medium text-xs italic">
                                        Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <UserPlus size={20} className="text-indigo-600"/> 
                                    Create Opportunity
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateLead} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Target Customer</label>
                                    <select 
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none shadow-sm"
                                        value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                    >
                                        <option value="">Select Target</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Capture Source</label>
                                        <select 
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none shadow-sm"
                                            value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}
                                        >
                                            <option value="Email">Email Thread</option>
                                            <option value="Social Media">Social Platform</option>
                                            <option value="Call">Direct Call</option>
                                            <option value="Referral">Referral</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">First Follow-up</label>
                                        <input 
                                            type="date" required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium shadow-sm"
                                            value={formData.next_follow_up} onChange={(e) => setFormData({...formData, next_follow_up: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Discovery Insights</label>
                                    <textarea 
                                        rows="3" required
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none shadow-sm"
                                        placeholder="What does this customer need most?"
                                        value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="flex gap-4 pt-4 mt-6 border-t border-slate-100">
                                    <button 
                                        disabled={actionLoading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 text-sm active:scale-[0.98]"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Onboard as Opportunity'}
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

export default SalesPipeline;
