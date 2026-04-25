import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { crmService, dashboardService, logService, notificationService } from '../services/api';
import { 
    Users, ClipboardList, ShoppingCart, 
    AlertTriangle, CheckCircle2, Clock, 
    Calendar, Package, Activity, Bell, Info, ShieldCheck
} from 'lucide-react';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pendingVerifications, setPendingVerifications] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notifRes, custRes] = await Promise.all([
                    dashboardService.getStats(),
                    notificationService.getAll(),
                    crmService.getCustomers()
                ]);
                setStats(statsRes.data || {});
                setNotifications(notifRes.data || []);
                
                // Count customers awaiting Manager approval
                const pending = custRes.data.filter(c => c.adminApproved && !c.managerApproved).length;
                setPendingVerifications(pending);
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

    const activeEmpCount = stats.employees.attendance_today.find(a => a.status === 'Present')?.count || 0;
    
    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <header className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Manager Portal
                    </span>
                    <span className="text-slate-400 text-sm font-medium">| {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Welcome back, {user.username}!
                </h1>
                <p className="text-slate-500 font-medium mt-2">Here is a quick overview of your team and material operations today.</p>
            </header>

            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                <StatCard 
                    title="Verification Hub" 
                    value={pendingVerifications}
                    icon={ShieldCheck} highlight link="/crm/customers" 
                    subtext="Awaiting Manager Seal"
                />
                <StatCard 
                    title="Total Team" 
                    value={stats.employees.total}
                    icon={Users} color="indigo" link="/hrms" 
                    subtext="Assigned Employees"
                />
                <StatCard 
                    title="Active Floor" 
                    value={activeEmpCount}
                    icon={Clock} color="emerald" link="/attendance" 
                    subtext="Clocked in today"
                />
                <StatCard 
                    title="Pending Tasks" 
                    value={stats.employees.pending_tasks || 0}
                    icon={ClipboardList} color="amber" link="/tasks" 
                    subtext="Awaiting completion"
                />
                <StatCard 
                    title="Active Orders" 
                    value={stats.erp.active_orders || 0}
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
        </div>
    );
};

export default ManagerDashboard;
