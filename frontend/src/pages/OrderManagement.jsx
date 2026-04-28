import React, { useState, useEffect } from 'react';
import { erpService, materialService, crmService } from '../services/api';
import { ShoppingCart, Plus, Search, Loader2, CheckCircle, Package, ArrowUpRight, ArrowDownRight, User, XCircle, AlertCircle, Eye, Calendar, Tag, ShieldCheck, IndianRupee, Wallet, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const OrderManagement = () => {
    const { user } = useAuth();
    const isEmployee = user?.role?.toUpperCase() === 'EMPLOYEE';
    const isManager = user?.role?.toUpperCase() === 'MANAGER';
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    
    const [orders, setOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        materialId: '',
        quantity: '',
        orderType: 'PURCHASE',
        vendorId: '',
        customerId: '',
        totalAmount: 0
    });

    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orderRes, vendorRes, matRes, custRes] = await Promise.all([
                erpService.getOrders(),
                erpService.getVendors(),
                materialService.getAll(),
                crmService.getCustomers()
            ]);
            setOrders(orderRes.data);
            setVendors(vendorRes.data);
            setMaterials(matRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await erpService.createOrder(formData);
            await fetchData();
            setIsModalOpen(false);
            setFormData({ materialId: '', quantity: '', orderType: 'PURCHASE', vendorId: '', customerId: '', totalAmount: 0 });
        } catch (error) {
            setError(error.response?.data?.message || 'Error creating order');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        const confirmMsg = status === 'COMPLETED' 
            ? 'Process fulfillment? This will update warehouse inventory level.' 
            : 'Cancel this order? If completed, stock will be reversed to previous levels.';
        
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            await erpService.updateOrderStatus(id, status);
            await fetchData();
            if (isViewModalOpen) setIsViewModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'CANCELLED': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getRoleStyles = (role) => {
        switch (role?.toUpperCase()) {
            case 'ADMIN': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'SALES': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'MANAGER': return 'text-purple-600 bg-purple-50 border-purple-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const formatCurrency = (val) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const filteredOrders = (orders || []).filter(o => 
        (o.materialId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.orderType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.createdByRole || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShoppingCart className="text-indigo-600" size={32} />
                        Order Registry
                    </h1>
                    <p className="text-slate-600 mt-1 uppercase text-[10px] font-black tracking-widest">Full lifecycle audit for procurement & sales.</p>
                </div>
                {!isManager && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200"
                    >
                        <Plus size={20} />
                        New Entry
                    </button>
                )}
            </header>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl flex items-center gap-4 mb-6 border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by material, type, status or creator role..." 
                    className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 w-full font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4 font-black">Reference</th>
                                <th className="px-6 py-4 font-black">Type & Origin</th>
                                <th className="px-6 py-4 font-black">Subject Material</th>
                                <th className="px-6 py-4 font-black text-center">Qty</th>
                                <th className="px-6 py-4 font-black text-right">Total Value</th>
                                <th className="px-6 py-4 font-black text-center">Status</th>
                                <th className="px-6 py-4 font-black text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-20 text-slate-500"><Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" /> Indexing records...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-20 text-slate-500 font-black uppercase tracking-widest text-[10px]">Registry is empty.</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 text-slate-400 font-mono text-[11px] font-black uppercase tracking-tighter">#{order._id.toString().slice(-10)}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${order.orderType === 'PURCHASE' ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                {order.orderType === 'PURCHASE' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                {order.orderType}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] border w-fit ${getRoleStyles(order.createdByRole)}`}>
                                                <UserCog size={10} />
                                                {order.createdByRole || 'SYSTEM'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {order.materialId ? (
                                            <>
                                                <div className="font-black text-slate-900">{order.materialId.name}</div>
                                                <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{order.materialId.unit}</div>
                                            </>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 border border-rose-200 font-mono">D_ERR</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center font-black text-slate-900">{order.quantity}</td>
                                    <td className="px-6 py-5 text-right font-black text-slate-900">
                                        <span className="text-[10px] text-slate-400 mr-1">₹</span>
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-10">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleViewOrder(order)}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all shadow-sm group/btn"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {order.status === 'PENDING' && (isAdmin || !isEmployee) && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(order._id, 'COMPLETED')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 bg-white border border-emerald-100 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                                    title="Process Complete"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {order.status !== 'CANCELLED' && (isAdmin || !isEmployee) && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(order._id, 'CANCELLED')}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 bg-white border border-transparent hover:border-rose-100 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95"
                                                    title="Cancel Order"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Order Detailed Modal */}
            <AnimatePresence>
                {isViewModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                        <Package className="text-indigo-600" size={20} />
                                        Order Breakdown
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global ID: {selectedOrder._id}</p>
                                </div>
                                <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1"><XCircle size={20} /></button>
                            </div>

                            <div className="px-8 py-6 space-y-6">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <DetailItem icon={<Package size={12}/>} label="Material" value={selectedOrder.materialId?.name || 'Manual Reference'} />
                                    <DetailItem icon={<Tag size={12}/>} label="Type" value={selectedOrder.orderType} isType type={selectedOrder.orderType} />
                                    <DetailItem icon={<User size={12}/>} label="Entity" value={selectedOrder.orderType === 'PURCHASE' ? (selectedOrder.vendorId?.name || 'Direct / Internal') : (selectedOrder.customerId?.name || 'Walk-in Customer')} />
                                    <DetailItem icon={<AlertCircle size={12}/>} label="Status" value={selectedOrder.status} isStatus styles={getStatusStyles(selectedOrder.status)} />
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><IndianRupee size={12}/> Unit Price</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">₹{formatCurrency(selectedOrder.unitPrice || 0)}</p>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[24px]">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Wallet size={12}/> Total Amount</p>
                                        <p className="text-xl font-black text-indigo-600 tracking-tight">₹{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                                    </div>
                                </div>

                                {/* Creator Section */}
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border ${getRoleStyles(selectedOrder.createdByRole)}`}>
                                            <UserCog size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Originator</p>
                                            <p className="text-xs font-black text-slate-900 mt-1">{selectedOrder.createdByUserId?.username || 'System Administrator'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getRoleStyles(selectedOrder.createdByRole)}`}>
                                        {selectedOrder.createdByRole || 'SYSTEM'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12}/> Created On</p>
                                        <p className="text-[11px] font-bold text-slate-600">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-end"><User size={12}/> Fulfillment By</p>
                                        <p className="text-[11px] font-black text-slate-900">{selectedOrder.processedBy?.username || 'Manual'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {selectedOrder.status === 'PENDING' && (isAdmin || !isEmployee) && (
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedOrder._id, 'COMPLETED')}
                                            disabled={actionLoading}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-95 font-mono"
                                        >
                                            FULFILL_ENTRY
                                        </button>
                                    )}
                                    {selectedOrder.status !== 'CANCELLED' && (isAdmin || !isEmployee) && (
                                        <button 
                                            onClick={() => handleUpdateStatus(selectedOrder._id, 'CANCELLED')}
                                            disabled={actionLoading}
                                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-95 font-mono"
                                        >
                                            TERMINATE_ORDER
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Order Modal ... omitted for brevity as it hasn't changed much but I'll keep the full file to be safe ... */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
                                    <Plus className="text-indigo-600" size={20} />
                                    New Inventory Entry
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-1"><XCircle size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleCreateOrder} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Flow Direction</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, orderType: 'PURCHASE', vendorId: '', customerId: '' }));
                                                    setError('');
                                                }}
                                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all ${
                                                    formData.orderType === 'PURCHASE' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100'
                                                }`}
                                            >
                                                Purchase (IN)
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, orderType: 'SALE', vendorId: '', customerId: '' }));
                                                    setError('');
                                                }}
                                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border font-black text-[11px] uppercase tracking-widest transition-all ${
                                                    formData.orderType === 'SALE' ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-100' : 'bg-white text-slate-400 border-slate-100'
                                                }`}
                                            >
                                                Sale (OUT)
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Reference Material</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black appearance-none"
                                            value={formData.materialId} onChange={(e) => setFormData({...formData, materialId: e.target.value})}
                                        >
                                            <option value="">Select Target...</option>
                                            {materials.map(m => (
                                                <option key={m.id || m._id} value={m.id || m._id}>
                                                    {m.name} (₹{formatCurrency(m.price)} / unit)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Transaction Quantity</label>
                                        <input 
                                            type="number" required min="1"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-black"
                                            placeholder="Quantity"
                                            value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">{formData.orderType === 'PURCHASE' ? 'Service Vendor' : 'Customer Entity'}</label>
                                        <select 
                                            required={formData.orderType === 'PURCHASE'}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-xs font-black appearance-none"
                                            value={formData.orderType === 'PURCHASE' ? formData.vendorId : formData.customerId} 
                                            onChange={(e) => setFormData({...formData, [formData.orderType === 'PURCHASE' ? 'vendorId' : 'customerId']: e.target.value})}
                                        >
                                            <option value="">Select Entity...</option>
                                            {formData.orderType === 'PURCHASE' 
                                                ? (vendors.length > 0 ? vendors.map(v => <option key={v.id || v._id} value={v.id || v._id}>{v.name}</option>) : <option disabled>No vendors found</option>)
                                                : (customers.length > 0 ? customers.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name} {c.status === 'PENDING' ? '(Pending Approval)' : ''}</option>) : <option disabled>No customers found</option>)
                                            }
                                        </select>
                                    </div>
                                </div>

                                {/* Financial Estimation Preview */}
                                {formData.materialId && formData.quantity > 0 && (
                                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-indigo-600">
                                            <IndianRupee size={20} />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest leading-none">Estimated Total Value</p>
                                                <p className="text-xl font-black tracking-tight leading-none mt-1">₹{formatCurrency(formData.quantity * (materials.find(m => m._id === formData.materialId || m.id === formData.materialId)?.price || 0))}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 mt-4">
                                        <XCircle size={18} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                                    </div>
                                )}
                                
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl text-slate-400 bg-white hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest border border-slate-100 active:scale-95"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={actionLoading}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl text-[11px] uppercase tracking-widest active:scale-[0.98]"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                                        Initialize Order
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

const DetailItem = ({ icon, label, value, isType, type, isStatus, styles }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</p>
        {isStatus ? (
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block ${styles}`}>
                {value}
            </span>
        ) : (
            <p className={`text-xs font-black uppercase tracking-wide ${isType ? (type === 'PURCHASE' ? 'text-indigo-600' : 'text-orange-600') : 'text-slate-900'}`}>
                {value}
            </p>
        )}
    </div>
);

export default OrderManagement;
