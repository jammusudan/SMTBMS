import React, { useState, useEffect } from 'react';
import { erpService, materialService, crmService } from '../services/api';
import { ShoppingCart, Plus, Search, Loader2, CheckCircle, Package, ArrowUpRight, ArrowDownRight, User, XCircle, AlertCircle, Eye, Calendar, Tag, ShieldCheck, IndianRupee, Wallet, UserCog, TrendingUp, Filter, ArrowUpDown, Award, Star, TrendingDown } from 'lucide-react';
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
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, PAID, PENDING_PAYMENT, HIGH_VALUE
    const [sortBy, setSortBy] = useState('DATE_DESC'); // DATE_DESC, DATE_ASC, AMOUNT_DESC, AMOUNT_ASC

    const [paymentFormData, setPaymentFormData] = useState({
        paymentStatus: 'PAID',
        paidAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'UPI'
    });

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

    const handleUpdatePayment = (order) => {
        setSelectedOrder(order);
        setPaymentFormData({
            paymentStatus: 'PAID',
            paidAmount: order.totalAmount,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMode: 'UPI'
        });
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        
        if (paymentFormData.paidAmount > selectedOrder.totalAmount) {
            alert(`Error: Paid amount cannot exceed total order value (₹${selectedOrder.totalAmount})`);
            return;
        }

        setActionLoading(true);
        try {
            await erpService.updatePaymentDetails(selectedOrder._id, paymentFormData);
            await fetchData();
            setIsPaymentModalOpen(false);
            if (isViewModalOpen) setIsViewModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error recording payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
    };

    const handleGenerateInvoice = (order) => {
        setSelectedOrder(order);
        setIsInvoiceModalOpen(true);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'CANCELLED': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getPaymentStyles = (status) => {
        switch (status) {
            case 'PAID': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'PARTIAL': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'PENDING': return 'text-slate-400 bg-slate-50 border-slate-100';
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

    const formatCurrency = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    // Financial Aggregations
    const kpis = {
        totalOrders: orders.length,
        totalRevenue: orders.filter(o => o.orderType === 'SALE' && o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        totalPaid: orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (o.paidAmount || 0), 0),
        totalPending: orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0)
    };

    // Business Intelligence Analytics
    const getAnalytics = () => {
        if (orders.length === 0) return { topProduct: 'N/A', topCustomer: 'N/A' };
        
        const productStats = {};
        const customerStats = {};
        
        orders.forEach(o => {
            if (o.status === 'CANCELLED') return;
            
            // Product Stats
            const pName = o.materialId?.name || 'Unknown';
            productStats[pName] = (productStats[pName] || 0) + (o.quantity || 0);
            
            // Customer Stats
            if (o.orderType === 'SALE') {
                const cName = o.customerId?.name || 'Walk-in';
                customerStats[cName] = (customerStats[cName] || 0) + (o.totalAmount || 0);
            }
        });

        const topProduct = Object.entries(productStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        const topCustomer = Object.entries(customerStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        return { topProduct, topCustomer };
    };

    const analytics = getAnalytics();

    const filteredOrders = (orders || [])
        .filter(o => {
            // Search filter
            const matchesSearch = (o.materialId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.orderType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.createdByRole || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            // Tab filter
            if (activeFilter === 'PAID') return o.paymentStatus === 'PAID';
            if (activeFilter === 'PENDING_PAYMENT') return o.paymentStatus !== 'PAID';
            if (activeFilter === 'HIGH_VALUE') return o.totalAmount > 50000;
            
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'DATE_DESC') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'DATE_ASC') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'AMOUNT_DESC') return (b.totalAmount || 0) - (a.totalAmount || 0);
            if (sortBy === 'AMOUNT_ASC') return (a.totalAmount || 0) - (b.totalAmount || 0);
            return 0;
        });

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <KpiCard title="Total Registry" value={kpis.totalOrders} subtitle="Order Volume" icon={Package} color="indigo" />
                <KpiCard title="Gross Revenue" value={`₹${formatCurrency(kpis.totalRevenue)}`} subtitle="Sales Pipeline" icon={TrendingUp} color="emerald" />
                <KpiCard title="Settled Amount" value={`₹${formatCurrency(kpis.totalPaid)}`} subtitle="Recovered Funds" icon={ShieldCheck} color="blue" />
                <KpiCard title="Outstanding" value={`₹${formatCurrency(kpis.totalPending)}`} subtitle="Payment Lag" icon={AlertCircle} color="rose" />
            </div>

            {/* Strategic Intelligence Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 flex items-center gap-4 border-r border-slate-100 pr-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Award size={24} /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Selling Product</p>
                            <p className="text-sm font-black text-slate-900">{analytics.topProduct}</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-4 border-r border-slate-100 pr-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Star size={24} /></div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prime Customer</p>
                            <p className="text-sm font-black text-slate-900">{analytics.topCustomer}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl">
                        <TrendingUp size={20} className="text-emerald-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Growth Phase Active</p>
                    </div>
                </div>

                <div className="bg-indigo-600 p-6 rounded-[32px] shadow-lg shadow-indigo-100 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                    <div className="relative z-10">
                        <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">High Value Alert</p>
                        <p className="text-2xl font-black text-white tracking-tighter italic">₹{formatCurrency(kpis.totalRevenue / (kpis.totalOrders || 1))} <span className="text-xs font-normal opacity-70 ml-1">AVG_DEAL</span></p>
                    </div>
                    <ArrowUpRight className="text-white opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" size={32} />
                </div>
            </div>

            {/* Filter & Search Hub */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 mb-6">
                <div className="flex-1 bg-white p-2.5 rounded-2xl flex items-center gap-4 border border-slate-200 shadow-sm transition-all focus-within:border-indigo-100 focus-within:ring-4 focus-within:ring-indigo-50">
                    <Search className="text-slate-400 ml-2" size={20} />
                    <input 
                        type="text" 
                        placeholder="Scan registry by material, type, or role..." 
                        className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-300 w-full font-black text-xs uppercase tracking-wider"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    {[
                        { id: 'ALL', label: 'All Orders', icon: ShoppingCart },
                        { id: 'PAID', label: 'Paid Only', icon: ShieldCheck },
                        { id: 'PENDING_PAYMENT', label: 'Debt Tracking', icon: AlertCircle },
                        { id: 'HIGH_VALUE', label: 'Whale Deals', icon: TrendingUp }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeFilter === tab.id 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                                : 'text-slate-500 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative group">
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-black text-[10px] uppercase tracking-widest text-slate-600">
                        <ArrowUpDown size={14} className="text-indigo-600" />
                        Sort: 
                        <select 
                            className="bg-transparent border-none outline-none text-slate-900 cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="DATE_DESC">Newest First</option>
                            <option value="DATE_ASC">Oldest First</option>
                            <option value="AMOUNT_DESC">Highest Value</option>
                            <option value="AMOUNT_ASC">Lowest Value</option>
                        </select>
                    </div>
                </div>
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
                                <th className="px-6 py-4 font-black text-center">Payment</th>
                                <th className="px-6 py-4 font-black text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="8" className="text-center py-20 text-slate-500"><Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" /> Indexing records...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-20 text-slate-500 font-black uppercase tracking-widest text-[10px]">No orders matching your criteria found.</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr 
                                    key={order._id} 
                                    className={`transition-colors group ${
                                        order.paymentStatus !== 'PAID' && order.status === 'COMPLETED' ? 'bg-amber-50/30 hover:bg-amber-50/50' : 
                                        order.totalAmount > 50000 ? 'bg-indigo-50/10 hover:bg-indigo-50/30' : 'hover:bg-slate-50/50'
                                    }`}
                                >
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
                                    <td className={`px-6 py-5 text-right font-black ${order.totalAmount > 50000 ? 'text-indigo-600 text-sm italic' : 'text-slate-900'}`}>
                                        <span className="text-[10px] text-slate-400 mr-1 italic">₹</span>
                                        {formatCurrency(order.totalAmount)}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPaymentStyles(order.paymentStatus)}`}>
                                            {order.paymentStatus || 'PENDING'}
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
                                            {isAdmin && order.paymentStatus !== 'PAID' && order.status === 'COMPLETED' && (
                                                <button 
                                                    onClick={() => handleUpdatePayment(order)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 bg-white border border-blue-100 rounded-xl shadow-sm transition-all"
                                                    title="Record Payment"
                                                >
                                                    <Wallet size={18} />
                                                </button>
                                            )}
                                            {order.status === 'PENDING' && (isAdmin || !isEmployee) && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(order._id, 'COMPLETED')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 bg-white border border-emerald-100 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                                    title="Process Complete"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {order.status === 'PENDING' && (isAdmin || !isEmployee) && (
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
                                    <DetailItem icon={<Wallet size={12}/>} label="Payment Status" value={selectedOrder.paymentStatus || 'PENDING'} isStatus styles={getPaymentStyles(selectedOrder.paymentStatus)} />
                                    {selectedOrder.paidAmount > 0 && <DetailItem icon={<IndianRupee size={12}/>} label="Paid Amount" value={`₹${formatCurrency(selectedOrder.paidAmount)}`} />}
                                    {selectedOrder.paymentDate && <DetailItem icon={<Calendar size={12}/>} label="Payment Date" value={new Date(selectedOrder.paymentDate).toLocaleDateString()} />}
                                    {selectedOrder.paymentMode && <DetailItem icon={<ShieldCheck size={12}/>} label="Payment Mode" value={selectedOrder.paymentMode} />}
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
                                    {isAdmin && selectedOrder.paymentStatus !== 'PAID' && selectedOrder.status === 'COMPLETED' && (
                                        <button 
                                            onClick={() => handleUpdatePayment(selectedOrder)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg text-[11px] uppercase tracking-widest disabled:opacity-50 active:scale-95 font-mono"
                                        >
                                            RECORD_PAYMENT
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleGenerateInvoice(selectedOrder)}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg text-[11px] uppercase tracking-widest active:scale-95 font-mono"
                                    >
                                        GENERATE_INVOICE
                                    </button>
                                    {selectedOrder.status === 'PENDING' && (isAdmin || !isEmployee) && (
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

            {/* Payment Details Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
                        >
                            <div className="bg-blue-600 p-8 text-white">
                                <h3 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-3">
                                    <Wallet size={24} />
                                    Payment Settlement
                                </h3>
                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mt-2">Order Ref: #{selectedOrder._id.toString().slice(-6).toUpperCase()}</p>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="p-10 space-y-6">
                                <div>
                                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Payment Status</label>
                                    <select 
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-xs font-black appearance-none"
                                        value={paymentFormData.paymentStatus} 
                                        onChange={(e) => setPaymentFormData({...paymentFormData, paymentStatus: e.target.value})}
                                    >
                                        <option value="PAID">Full Payment (PAID)</option>
                                        <option value="PARTIAL">Partial Payment (PARTIAL)</option>
                                        <option value="PENDING">Clear / Reset (PENDING)</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Paid Amount (₹)</label>
                                        <input 
                                            type="number" required min="1"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-black"
                                            value={paymentFormData.paidAmount} 
                                            onChange={(e) => setPaymentFormData({...paymentFormData, paidAmount: Number(e.target.value)})}
                                        />
                                        <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest px-1">Total Due: ₹{formatCurrency(selectedOrder.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Payment Date</label>
                                        <input 
                                            type="date" required
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-black"
                                            value={paymentFormData.paymentDate} 
                                            onChange={(e) => setPaymentFormData({...paymentFormData, paymentDate: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Cash', 'UPI', 'Bank Transfer'].map(mode => (
                                            <button 
                                                key={mode}
                                                type="button"
                                                onClick={() => setPaymentFormData({...paymentFormData, paymentMode: mode})}
                                                className={`py-3 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                                                    paymentFormData.paymentMode === mode ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-100'
                                                }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button" onClick={() => setIsPaymentModalOpen(false)}
                                        className="flex-1 px-8 py-5 rounded-3xl text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 border border-slate-100"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={actionLoading}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 transition-all shadow-xl text-[11px] uppercase tracking-widest active:scale-95"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                                        Save Settlement
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invoice Modal */}
            <AnimatePresence>
                {isInvoiceModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
                        >
                            {/* Invoice Header */}
                            <div className="bg-slate-900 p-10 text-white flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-indigo-600 p-2.5 rounded-xl">
                                            <Package size={24} />
                                        </div>
                                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">SMTBMS_INVOICE</h1>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Transaction Document</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice ID</p>
                                    <p className="text-lg font-mono font-black text-indigo-400">#INV-{selectedOrder._id.toString().slice(-6).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Invoice Body */}
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Billing Information</h4>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 mb-1">
                                                {selectedOrder.orderType === 'PURCHASE' ? selectedOrder.vendorId?.name : selectedOrder.customerId?.name}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                                {selectedOrder.orderType === 'PURCHASE' ? 'Service Partner' : 'Customer Entity'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 text-right">Transaction Details</h4>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Placed On</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="border border-slate-100 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50">
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="px-6 py-4">Item Description</th>
                                                <th className="px-6 py-4 text-center">Qty</th>
                                                <th className="px-6 py-4 text-right">Unit Price</th>
                                                <th className="px-6 py-4 text-right pr-8">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <tr className="text-slate-900">
                                                <td className="px-6 py-5">
                                                    <p className="font-black text-sm">{selectedOrder.materialId?.name}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedOrder.materialId?.unit}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center font-black">{selectedOrder.quantity}</td>
                                                <td className="px-6 py-5 text-right font-black">₹{formatCurrency(selectedOrder.unitPrice || 0)}</td>
                                                <td className="px-6 py-5 text-right pr-8 font-black text-indigo-600">₹{formatCurrency(selectedOrder.totalAmount || 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total and Footer */}
                                <div className="flex justify-between items-end">
                                    <div className="space-y-3">
                                        <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest inline-block ${getPaymentStyles(selectedOrder.paymentStatus)}`}>
                                            Payment: {selectedOrder.paymentStatus || 'PENDING'}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 max-w-[240px] leading-relaxed italic uppercase">This is a system generated document. No signature required for validation.</p>
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[32px] text-right min-w-[240px] shadow-2xl shadow-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Grand Total Amount</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">₹{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 no-print">
                                    <button 
                                        onClick={() => setIsInvoiceModalOpen(false)}
                                        className="flex-1 px-8 py-5 rounded-3xl text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95"
                                    >
                                        Close Preview
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-2 transition-all shadow-xl text-[11px] uppercase tracking-widest active:scale-95"
                                    >
                                        Print Document
                                    </button>
                                </div>
                            </div>
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

const KpiCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-all bg-${color === 'rose' ? 'red' : color}-500`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl border bg-${color === 'rose' ? 'red' : color}-50 border-${color === 'rose' ? 'red' : color}-100 text-${color === 'rose' ? 'red' : color}-600`}>
                <Icon size={20} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-${color === 'rose' ? 'red' : color}-50 text-${color === 'rose' ? 'red' : color}-600`}>{subtitle}</span>
        </div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">{value}</h3>
    </div>
);

export default OrderManagement;
