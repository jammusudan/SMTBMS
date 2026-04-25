import React, { useState, useEffect } from 'react';
import { erpService } from '../services/api';
import { Truck, Plus, Trash2, Edit2, Search, Loader2, Mail, Phone, MapPin, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VendorManagement = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const { data } = await erpService.getVendors();
            setVendors(data || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vendor = null) => {
        setSelectedVendor(vendor);
        if (vendor) {
            setFormData(vendor);
        } else {
            setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (selectedVendor) {
                await erpService.updateVendor(selectedVendor.id, formData);
            } else {
                await erpService.addVendor(formData);
            }
            fetchVendors();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Save error details:', error.response?.data || error.message);
            alert(error.response?.data?.message || 'Error saving vendor. Please check your connection.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this vendor?')) return;
        try {
            await erpService.deleteVendor(id);
            fetchVendors();
        } catch (error) {
            console.error('Error deleting vendor:', error);
        }
    };

    const filteredVendors = vendors.filter(v => 
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Truck className="text-indigo-600" size={32} />
                        Vendor Management
                    </h1>
                    <p className="text-slate-600 mt-1">Manage and track your materials suppliers.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} />
                    Add Vendor
                </button>
            </header>

            {/* List */}
            <div className="bg-white p-4 rounded-2xl flex items-center gap-4 mb-6 border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by company or contact person..." 
                    className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-slate-500"><Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" /> Loading...</div>
                ) : filteredVendors.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-500 font-medium">No vendors found.</div>
                ) : filteredVendors.map((vendor) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={vendor._id} 
                        className="bg-white border border-slate-200 shadow-sm p-6 rounded-[24px] group relative hover:shadow-md hover:border-indigo-200 transition-all"
                    >
                        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{vendor.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-4 font-medium">
                            <span className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg"><User size={14} /></span> {vendor.contact_person}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                <Mail size={16} className="text-slate-400" /> {vendor.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                <Phone size={16} className="text-slate-400" /> {vendor.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                                <MapPin size={16} className="text-slate-400" /> {vendor.address || 'N/A'}
                            </div>
                        </div>

                        <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(vendor)} className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(vendor.id)} className="p-2 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 shadow-sm"><Trash2 size={16} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900">{selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors"><LogOut size={20} className="rotate-180" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Company Name</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        placeholder="e.g. Steel Quality Inc."
                                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Contact Person</label>
                                        <input 
                                            type="text" required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Phone</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Email Address</label>
                                    <input 
                                        type="email"
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Address</label>
                                    <textarea 
                                        rows="2"
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none"
                                        value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    ></textarea>
                                </div>
                                <div className="flex gap-4 pt-4 mt-6 border-t border-slate-100">
                                    <button 
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        disabled={actionLoading}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 text-sm active:scale-[0.98]"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Save Vendor Info'}
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

export default VendorManagement;
