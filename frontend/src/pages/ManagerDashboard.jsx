import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { crmService, dashboardService, erpService, notificationService, hrmsService } from '../services/api';
import { 
    Users, ClipboardList, ShoppingCart, 
    AlertTriangle, CheckCircle2, Clock, 
    Calendar, Package, Activity, Bell, Info, ShieldCheck, Eye, ArrowUpRight, ArrowDownRight, IndianRupee, Wallet, XCircle, Tag, User as UserIcon
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingVerifications, setPendingVerifications] = useState(0);
    const [pendingLeaves, setPendingLeaves] = useState(0);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING_PAYMENT, HIGH_VALUE, COMPLETED
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notifRes, custRes, orderRes, leaveRes] = await Promise.all([
                    dashboardService.getStats(),
                    notificationService.getAll(),
                    crmService.getCustomers(),
                    erpService.getOrders(),
                    hrmsService.getLeaves({ status: 'Pending' })
                ]);
                setStats(statsRes.data || {});
                setNotifications(notifRes.data || []);
                setOrders(orderRes.data || []);
                
                // Count customers awaiting Manager approval
                const pending = custRes.data.filter(c => c.adminApproved && !c.managerApproved).length;
                setPendingVerifications(pending);
                setPendingLeaves(leaveRes.data?.filter(l => l.status === 'Pending').length || 0);
            } catch (error) {
                console.error('Error fetching manager dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] text-slate-400">
                <div className="animate-spin mr-3 border-4 border-indigo-200 border-t-indigo-600 rounded-full w-8 h-8"></div>
                <span className="text-lg font-medium tracking-tight">Syncing Team Data...</span>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, link, subtext, highlight }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-6 rounded-[24px] border relative overflow-hidden group transition-all shadow-sm hover:shadow-md ${
                highlight ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-slate-200'
            }`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-colors ${
                highlight ? 'bg-white/10' : `bg-${color}-500/5 group-hover:bg-${color}-500/10`
            }`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl font-bold border ${
                    highlight ? 'bg-white/10 text-white border-white/20' : `bg-${color}-50 text-${color}-600 border-${color}-100`
                }`}>
                    <Icon size={24} />
                </div>
            </div>
            <h4 className={`${highlight ? 'text-indigo-100' : 'text-slate-500'} text-[11px] font-bold uppercase tracking-widest mb-1`}>{title}</h4>
            <h3 className={`text-4xl font-black mb-2 tracking-tight ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
            <div className={`flex justify-between items-center mt-4 pt-4 border-t ${highlight ? 'border-white/10' : 'border-slate-50'}`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${highlight ? 'text-indigo-200' : 'text-slate-400'}`}>{subtext}</span>
                <Link to={link} className={`text-xs font-bold hover:underline px-3 py-1 rounded-full ${
                    highlight ? 'bg-white text-indigo-600 shadow-xl' : `text-${color}-600 bg-${color}-50`
                }`}>View Hub</Link>
            </div>
        </motion.div>
    );

    if (!stats || !stats.employees || !stats.materials) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <AlertTriangle className="mb-4 text-rose-500" size={48} />
                <span className="text-lg font-black tracking-tight text-slate-900 uppercase">Manager Intelligence Offline</span>
                <p className="text-xs font-bold mt-2 uppercase tracking-widest text-slate-400">Unable to load operational metrics.</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retry Connection</button>
            </div>
        );
    }

    const activeEmpCount = stats.employees.attendance_today?.find(a => a.status === 'Present')?.count || 0;
    
    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Manager Portal
                        </span>
                        <span className="text-slate-400 text-sm font-medium">| {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Welcome back, {user.username}!
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Here is a quick overview of your team and material operations today.</p>
                </div>
            </header>

            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Active Floor" 
                    value={activeEmpCount}
                    icon={Clock} highlight link="/attendance" 
                    subtext="Clocked in today"
                />
                <StatCard 
                    title="Pending Leaves" 
                    value={pendingLeaves}
                    icon={Calendar} color="indigo" link="/leaves" 
                    subtext="Awaiting Approval"
                />
                <StatCard 
                    title="Pending Tasks" 
                    value={stats.employees.pending_tasks || 0}
                    icon={ClipboardList} color="amber" link="/tasks" 
                    subtext="Awaiting completion"
                />
                <StatCard 
                    title="Active Orders" 
                    value={orders.filter(o => o.status !== 'COMPLETED').length}
                    icon={ShoppingCart} color="sky" link="/erp" 
                    subtext="Processing / Shipped"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* MIDDLE LEFT: Operations */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Package className="text-indigo-600" size={24} />
                                Material Operation Alerts
                            </h3>
                            <Link to="/materials" className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl">Inventory Deck</Link>
                        </div>
                        
                        <div className="space-y-4">
                            {stats.materials.low_stock_count === 0 && stats.materials.out_of_stock_count === 0 ? (
                                <div className="flex items-center gap-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                    <div className="p-3 bg-emerald-100 rounded-full"><CheckCircle2 className="text-emerald-600" size={24} /></div>
                                    <div>
                                        <p className="text-emerald-900 font-bold">Stock levels are highly stable.</p>
                                        <p className="text-emerald-700 text-sm font-medium mt-1">No critical shortages across registered materials.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {stats.materials.out_of_stock_count > 0 && (
                                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertTriangle className="text-rose-600" size={20} />
                                                <span className="text-rose-900 text-sm font-black tracking-wide">DEPLETED STOCK</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-rose-700 text-xs font-medium max-w-[120px]">Items requiring immediate restock</p>
                                                <span className="text-4xl font-black text-rose-600 leading-none">{stats.materials.out_of_stock_count}</span>
                                            </div>
                                        </div>
                                    )}
                                    {stats.materials.low_stock_count > 0 && (
                                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex flex-col justify-between">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Info className="text-amber-600" size={20} />
                                                <span className="text-amber-900 text-sm font-black tracking-wide">LOW STOCK WARN</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-amber-700 text-xs font-medium max-w-[120px]">Items near minimum threshold</p>
                                                <span className="text-4xl font-black text-amber-600 leading-none">{stats.materials.low_stock_count}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE RIGHT: Notifications / Feed */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm h-full max-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Bell className="text-rose-500" size={20} />
                                System Feed
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="text-slate-300" size={32} />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Inbox is caught up</p>
                                </div>
                            ) : (
                                notifications.slice(0, 8).map((n) => (
                                    <div key={n.id} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${n.type === 'Warning' ? 'text-amber-600' : n.type === 'Error' ? 'text-rose-600' : 'text-indigo-600'}`}>
                                                {n.title}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric'})}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{n.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* RECENT ORDERS PORTFOLIO */}
            <div className="mt-8 bg-white p-4 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <ShoppingCart className="text-indigo-600" size={24} />
                            Strategic Order Portfolio
                        </h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Real-time lifecycle monitoring for business operations.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'ALL', label: 'All Records' },
                            { id: 'PENDING_PAYMENT', label: 'Pending Payment' },
                            { id: 'HIGH_VALUE', label: 'High Value (>₹50k)' },
                            { id: 'COMPLETED', label: 'Completed' }
                        ].map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                    filter === f.id ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-50">
                                <th className="px-6 py-4 font-black">Ref ID</th>
                                <th className="px-6 py-4 font-black">Customer / Vendor</th>
                                <th className="px-6 py-4 font-black">Material</th>
                                <th className="px-6 py-4 font-black text-center">Qty</th>
                                <th className="px-6 py-4 font-black text-right">Value</th>
                                <th className="px-6 py-4 font-black text-center">Status</th>
                                <th className="px-6 py-4 font-black text-center">Payment</th>
                                <th className="px-6 py-4 font-black text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {orders
                                .filter(o => {
                                    if (filter === 'PENDING_PAYMENT') return o.paymentStatus !== 'PAID';
                                    if (filter === 'HIGH_VALUE') return o.totalAmount > 50000;
                                    if (filter === 'COMPLETED') return o.status === 'COMPLETED';
                                    return true;
                                })
                                .slice(0, 10)
                                .map((order) => (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 text-slate-400 font-mono text-[10px] font-black uppercase tracking-tighter">#{order._id.toString().slice(-6)}</td>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-slate-900 text-xs">
                                                {order.orderType === 'PURCHASE' ? (order.vendorId?.name || 'Internal') : (order.customerId?.name || 'Walk-in')}
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${order.orderType === 'PURCHASE' ? 'text-indigo-500' : 'text-orange-500'}`}>
                                                {order.orderType}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-slate-700 text-xs">{order.materialId?.name || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center font-black text-slate-900 text-xs">{order.quantity}</td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900 text-xs">
                                            ₹{Number(order.totalAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                                order.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                                                order.status === 'CANCELLED' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                                                order.paymentStatus === 'PAID' ? 'text-blue-600 bg-blue-50 border-blue-100' : 
                                                order.paymentStatus === 'PARTIAL' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-100'
                                            }`}>
                                                {order.paymentStatus || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setIsViewModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all shadow-sm"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {orders.length === 0 && (
                                <tr><td colSpan="8" className="py-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No matching order data found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-8 flex justify-center">
                    <Link to="/erp" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-100/50">
                        Access Full ERP Registry
                    </Link>
                </div>
            </div>

            {/* Read-Only View Modal */}
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
                                    <DetailItem icon={<UserIcon size={12}/>} label="Entity" value={selectedOrder.orderType === 'PURCHASE' ? (selectedOrder.vendorId?.name || 'Direct / Internal') : (selectedOrder.customerId?.name || 'Walk-in Customer')} />
                                    <DetailItem icon={<Activity size={12}/>} label="Status" value={selectedOrder.status} isStatus styles={orderStatusStyles(selectedOrder.status)} />
                                    <DetailItem icon={<Wallet size={12}/>} label="Payment" value={selectedOrder.paymentStatus || 'PENDING'} isStatus styles={paymentStatusStyles(selectedOrder.paymentStatus)} />
                                    {selectedOrder.paymentDate && <DetailItem icon={<Calendar size={12}/>} label="Paid Date" value={new Date(selectedOrder.paymentDate).toLocaleDateString()} />}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><IndianRupee size={12}/> Unit Price</p>
                                        <p className="text-lg font-black text-slate-900 tracking-tight">₹{Number(selectedOrder.unitPrice || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[24px]">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Wallet size={12}/> Total Amount</p>
                                        <p className="text-xl font-black text-indigo-600 tracking-tight">₹{Number(selectedOrder.totalAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Originator Role</p>
                                        <p className="text-xs font-black text-slate-900 mt-1 uppercase">{selectedOrder.createdByRole || 'SYSTEM'}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                                </div>
                                
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                                    <Info className="text-blue-500" size={16} />
                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Manager Mode: This view is read-only. For modifications, please contact Admin.</p>
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

const orderStatusStyles = (status) => {
    switch (status) {
        case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        case 'CANCELLED': return 'text-rose-600 bg-rose-50 border-rose-100';
        case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
        default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
};

const paymentStatusStyles = (status) => {
    switch (status) {
        case 'PAID': return 'text-blue-600 bg-blue-50 border-blue-100';
        case 'PARTIAL': return 'text-amber-600 bg-amber-50 border-amber-100';
        case 'PENDING': return 'text-slate-400 bg-slate-50 border-slate-100';
        default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
};

export default ManagerDashboard;
