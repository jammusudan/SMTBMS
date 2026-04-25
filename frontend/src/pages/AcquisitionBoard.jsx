import React, { useState, useEffect } from 'react';
import { crmService } from '../services/api';
import { 
    LayoutDashboard, Plus, Search, Mail, Phone, Calendar, 
    Loader2, MoreVertical, ChevronRight, CheckCircle2,
    MoveRight, MoveLeft, Building2, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AcquisitionBoard = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const [newLeadData, setNewLeadData] = useState({
        name: '', email: '', phone: '', source: 'Website', notes: ''
    });

    const columns = [
        { id: 'New', title: 'New Opportunities', color: 'bg-indigo-600' },
        { id: 'Contacted', title: 'Contact Established', color: 'bg-amber-500' },
        { id: 'In Progress', title: 'Active Acquisition', color: 'bg-emerald-500' }
    ];

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data } = await crmService.getLeads();
            // Filter only acquisition stages
            setLeads(data.filter(l => ['New', 'Contacted', 'In Progress'].includes(l.status)));
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (leadId, newStatus) => {
        setActionLoading(leadId);
        try {
            await crmService.updateLeadStatus(leadId, newStatus);
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConvert = async (leadId) => {
        if (!window.confirm('Convert this lead to a Customer?')) return;
        setActionLoading(leadId);
        try {
            await crmService.convertLead(leadId);
            setLeads(prev => prev.filter(l => l.id !== leadId));
            alert('Lead converted to customer successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error converting lead');
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddLead = async (e) => {
        e.preventDefault();
        setActionLoading('new');
        try {
            await crmService.createLead(newLeadData);
            await fetchLeads();
            setIsAddModalOpen(false);
            setNewLeadData({ name: '', email: '', phone: '', source: 'Website', notes: '' });
        } catch (error) {
            alert('Error creating lead');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredLeads = leads.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const LeadCard = ({ lead }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <UserCircle size={24} />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-black text-slate-900 tracking-tight uppercase truncate max-w-[120px]">{lead.name}</h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.source}</span>
                    </div>
                </div>
                <button className="text-slate-300 hover:text-slate-600 p-1"><MoreVertical size={16} /></button>
            </div>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                    <Mail size={12} className="text-slate-300" />
                    <span className="truncate">{lead.email || 'No Email'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                    <Phone size={12} className="text-slate-300" />
                    <span>{lead.phone || 'No Phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-tighter mt-3">
                    <Calendar size={12} className="opacity-50" />
                    Captured {new Date(lead.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-1">
                    {lead.status !== 'New' && (
                        <button onClick={() => updateStatus(lead.id, lead.status === 'In Progress' ? 'Contacted' : 'New')} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Move Back">
                            <MoveLeft size={16} />
                        </button>
                    )}
                    {lead.status !== 'In Progress' && (
                        <button onClick={() => updateStatus(lead.id, lead.status === 'New' ? 'Contacted' : 'In Progress')} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Move Forward">
                            <MoveRight size={16} />
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => handleConvert(lead.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-100"
                >
                    <CheckCircle2 size={12} /> Convert
                </button>
            </div>

            {actionLoading === lead.id && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
                    <Loader2 className="animate-spin text-indigo-600" size={20} />
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="p-8 min-h-screen bg-[#f8fafc]">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <LayoutDashboard size={20} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Acquisition Board</h1>
                    </div>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest opacity-70 flex items-center gap-2">
                        Initial Stage Pipeline <ChevronRight size={14} /> Lead Management
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find leads..."
                            className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 w-full md:w-64 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest py-3.5 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} /> Quick Capture
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {columns.map(column => (
                    <div key={column.id} className="flex flex-col h-full bg-slate-100/40 rounded-[32px] p-2 border border-slate-100">
                        <div className="flex items-center justify-between p-4 mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
                                <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">{column.title}</h2>
                                <span className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400 border border-slate-200 shadow-sm">
                                    {filteredLeads.filter(l => l.status === column.id).length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar min-h-[500px]">
                            <AnimatePresence mode="popLayout">
                                {filteredLeads.filter(l => l.status === column.id).map(lead => (
                                    <LeadCard key={lead.id} lead={lead} />
                                ))}
                            </AnimatePresence>
                            
                            {filteredLeads.filter(l => l.status === column.id).length === 0 && !loading && (
                                <div className="border-2 border-dashed border-slate-200 rounded-[24px] h-32 flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest">
                                    Empty State
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Capture Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-8 border-4 border-white"
                        >
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quick Lead Capture</h2>
                                <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">Capture high-intent marketplace interest</p>
                            </div>

                            <form onSubmit={handleAddLead} className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                                    <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all" value={newLeadData.name} onChange={e => setNewLeadData({...newLeadData, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Work Email</label>
                                        <input type="email" required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all" value={newLeadData.email} onChange={e => setNewLeadData({...newLeadData, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Phone</label>
                                        <input required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all" value={newLeadData.phone} onChange={e => setNewLeadData({...newLeadData, phone: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Source</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:bg-white focus:border-indigo-100 transition-all appearance-none" value={newLeadData.source} onChange={e => setNewLeadData({...newLeadData, source: e.target.value})}>
                                            <option value="Website">Website</option>
                                            <option value="Email">Email</option>
                                            <option value="Referral">Referral</option>
                                            <option value="Direct">Direct Cash/Walk-in</option>
                                            <option value="Social Media">Social Media</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Stage</label>
                                        <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl py-4 px-5 text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center justify-center">
                                            New Opportunity
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    className="w-full bg-slate-900 text-white font-black text-[12px] uppercase tracking-widest py-5 rounded-[24px] shadow-2xl transition-all hover:bg-indigo-600 active:scale-95 disabled:bg-slate-200 mt-4"
                                    disabled={actionLoading === 'new'}
                                >
                                    {actionLoading === 'new' ? <Loader2 className="animate-spin mx-auto" /> : 'Initialize Acquisition'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};

export default AcquisitionBoard;
