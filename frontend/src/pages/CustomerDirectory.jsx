import React, { useState, useEffect } from 'react';
import { crmService, erpService } from '../services/api';
import { 
    Users, Plus, Search, Loader2, Mail, Phone, 
    MapPin, Edit2, User, Globe, Briefcase, 
    IndianRupee, Filter, MoreVertical, ChevronRight, XCircle,
    CheckCircle2, Info, Target, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CustomerDirectory = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [deals, setDeals] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [custRes, dealsRes, ordersRes, leadsRes] = await Promise.all([
                crmService.getCustomers(),
                crmService.getDeals(),
                erpService.getOrders(),
                crmService.getLeads()
            ]);
            setCustomers(custRes.data);
            setDeals(dealsRes.data);
            setOrders(ordersRes.data);
            setLeads(leadsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer = null) => {
        setSelectedCustomer(customer);
        if (customer) setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address
        });
        else setFormData({ name: '', email: '', phone: '', address: '' });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const id = selectedCustomer?.id || selectedCustomer?._id;
            if (id) await crmService.updateCustomer(id, formData);
            else await crmService.addCustomer(formData);
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Error saving customer');
        } finally {
            setActionLoading(false);
        }
    };

    const getCustomerStats = (customerId) => {
        // Count Deals
        const custDeals = deals.filter(d => (d.customer_id?._id || d.customer_id) === customerId);
        
        // Sum Revenue from Completed Orders (Primary Source of Revenue)
        const custOrders = orders.filter(o => 
            (o.customerId?._id || o.customerId) === customerId && 
            o.orderType === 'SALE' && 
            o.status === 'COMPLETED'
        );
        const orderRev = custOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        
        // Include Won Deals for legacy support if needed, but per f39e459d, Orders are the source of truth
        // I will sum BOTH to ensure all recorded revenue shows up.
        const dealRev = custDeals.reduce((acc, curr) => acc + (curr.stage === 'Won' ? curr.amount : 0), 0);
        
        return { count: custDeals.length, revenue: orderRev + dealRev };
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-white">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-slate-100 text-slate-700 text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Client Ecosystem</span>
                        <span className="text-slate-400 text-base font-bold">| Enterprise Directory</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Customer Management</h1>
                    <p className="text-slate-500 font-black text-[13px] uppercase tracking-[0.2em] mt-3 opacity-80">Maintain deep client profiles and historical purchase intelligence</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] uppercase tracking-widest py-4 px-10 rounded-2xl shadow-xl shadow-slate-100 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> New Profile
                </button>
            </header>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by name, email, or domain..." 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-slate-700 focus:outline-none focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-6 bg-white border border-slate-100 rounded-2xl text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    <Filter size={16} /> Data Sort
                </button>
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client Profile</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Deal Volume</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">LTV Valuation</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="5" className="py-24 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                        ) : filteredCustomers.map((customer) => {
                            const { count, revenue } = getCustomerStats(customer._id || customer.id);
                            return (
                                <tr key={customer._id || customer.id} className="group hover:bg-slate-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-black text-[15px] tracking-tight">{customer.name}</p>
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ref: CUST-{String(customer._id || customer.id).slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                                                <Mail size={14} className="text-slate-300" /> {customer.email || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
                                                <Phone size={14} className="text-slate-300" /> {customer.phone || 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[11px]">
                                            <Briefcase size={12} /> {count} Deals
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                         <p className="text-slate-900 font-black text-lg">₹{revenue.toLocaleString()}</p>
                                         <div className="flex flex-col items-end gap-1">
                                             <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest leading-none">Gross Revenue</p>
                                             <div className="mt-1.5 flex items-center gap-1.5">
                                                 {!customer.adminApproved ? (
                                                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded uppercase tracking-tighter">Admin Pending</span>
                                                 ) : !customer.managerApproved ? (
                                                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded uppercase tracking-tighter">Manager Pending</span>
                                                 ) : (
                                                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded uppercase tracking-tighter">Verified Active</span>
                                                 )}
                                             </div>
                                         </div>
                                     </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 rounded-xl transition-all shadow-sm font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
                                                title="View Acquisition Intel"
                                            >
                                                <Target size={14} /> VIEW INTEL
                                            </button>

                                            {/* ADMIN APPROVAL BUTTON */}
                                            {user?.role?.toUpperCase() === 'ADMIN' && !customer.adminApproved && (
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm(`Approve ${customer.name} for Manager verification?`)) {
                                                            try {
                                                                await crmService.adminApproveCustomer(customer._id || customer.id);
                                                                fetchData();
                                                            } catch (e) { alert('Admin approval failed'); }
                                                        }
                                                    }}
                                                    className="p-2.5 text-amber-600 hover:bg-amber-600 hover:text-white bg-white border border-amber-100 rounded-xl transition-all shadow-sm"
                                                    title="Admin Approve"
                                                >
                                                    <ShieldCheck size={16} />
                                                </button>
                                            )}

                                            {/* MANAGER APPROVAL BUTTON */}
                                            {user?.role?.toUpperCase() === 'MANAGER' && customer.adminApproved && !customer.managerApproved && (
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm(`Perform final Manager approval for ${customer.name}?`)) {
                                                            try {
                                                                await crmService.managerApproveCustomer(customer._id || customer.id);
                                                                fetchData();
                                                            } catch (e) { alert('Manager approval failed'); }
                                                        }
                                                    }}
                                                    className="p-2.5 text-emerald-600 hover:bg-emerald-600 hover:text-white bg-white border border-emerald-100 rounded-xl transition-all shadow-sm"
                                                    title="Manager Seal"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => handleOpenModal(customer)}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Acquisition Detail Modal */}
            <AnimatePresence>
                {isDetailModalOpen && selectedCustomer && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsDetailModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-white"
                        >
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Acquisition Intelligence</h2>
                                        <p className="text-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] mt-1">{selectedCustomer.name}</p>
                                    </div>
                                    <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"><XCircle className="text-slate-300" /></button>
                                </div>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-10">
                                {leads.filter(l => (l.converted_customer_id?._id || l.converted_customer_id || l.customer_id?._id || l.customer_id) === (selectedCustomer._id || selectedCustomer.id)).length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                                            <Info size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-loose">
                                            This customer was created directly.<br/>No historical lead acquisition data found.
                                        </p>
                                    </div>
                                ) : leads.filter(l => (l.converted_customer_id?._id || l.converted_customer_id || l.customer_id?._id || l.customer_id) === (selectedCustomer._id || selectedCustomer.id)).map((lead, idx) => (
                                    <div key={lead.id || lead._id} className="relative pl-8 border-l-2 border-indigo-100 pb-2">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm shadow-indigo-100" />
                                        <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="bg-white border border-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                                    Event #{idx + 1} | {new Date(lead.created_at || lead.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    lead.priority === 'High' ? 'bg-rose-100 text-rose-700' : 
                                                    lead.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {lead.priority || 'Medium'} Priority
                                                </span>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Deal Context</label>
                                                <p className="text-slate-800 text-[15px] font-bold leading-relaxed italic pr-6 group">
                                                    "{lead.context || 'No specific context requirement recorded for this acquisition.'}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Globe size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Source</p>
                                                        <p className="text-[11px] font-black text-slate-700">{lead.source}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee size={16}/></div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Valuation</p>
                                                        <p className="text-[11px] font-black text-slate-700">₹{lead.estimatedValue?.toLocaleString() || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-slate-50/50 border-t border-slate-50 flex justify-end">
                                <button 
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest py-4 px-10 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 hover:bg-slate-800"
                                >
                                    Dismiss Intel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stats section updated with approval status */}
            {filteredCustomers.some(c => !c.isApproved) && (
                <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-[32px] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-amber-900 font-bold">
                        <Info className="text-amber-500" />
                        <div>
                            <p className="text-[13px] uppercase tracking-widest font-black">Audit Pending</p>
                            <p className="text-[11px] opacity-70">Some profiles require administrative validation before deal processing.</p>
                        </div>
                    </div>
                </div>
            )}

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
                            className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden p-10 border border-white"
                        >
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight italic mb-8">Profile Management</h2>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name / Entity Name</label>
                                        <input 
                                            required className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Communication Email</label>
                                        <input 
                                            type="email" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Primary Contact</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner"
                                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Corporate Address</label>
                                        <textarea 
                                            rows="3" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-800 focus:outline-none focus:border-indigo-100 focus:bg-white transition-all shadow-inner resize-none"
                                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin text-white" /> : <Plus size={20} />}
                                    Preserve Customer Records
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomerDirectory;
