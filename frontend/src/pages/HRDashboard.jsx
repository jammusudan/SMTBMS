import React, { useState, useEffect } from 'react';
import { dashboardService, notificationService } from '../services/api';
import { 
    Users, Calendar, Clock, Banknote,
    CheckCircle2, Bell, ShieldAlert,
    TrendingUp, FileText, ArrowRight, Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Assuming you have dashboardService.getHRStats set up
                const [statsRes, notifRes] = await Promise.all([
                    dashboardService.getHRStats(), // We need to add this to frontend API layer
                    notificationService.getAll()
                ]);
                setStats(statsRes.data || {});
                setNotifications(notifRes.data || []);
            } catch (error) {
                console.error('Error fetching HR dashboard stats:', error);
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
                <span className="text-lg font-medium tracking-tight">Loading HR Modules...</span>
            </div>
        );
    }

    const handleBroadcast = async (e) => {
        e.preventDefault();
        setBroadcasting(true);
        try {
            await notificationService.broadcast(broadcastForm);
            setBroadcastForm({ title: '', message: '' });
            // Refresh feed
            const notifRes = await notificationService.getAll();
            setNotifications(notifRes.data || []);
        } catch (error) {
            console.error('Failed to broadcast:', error);
            alert('Failed to send broadcast');
        } finally {
            setBroadcasting(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, link, subtext }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[24px] border border-slate-200 relative overflow-hidden group transition-all shadow-sm hover:shadow-md"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-${color}-500/10 transition-colors`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 font-bold border border-${color}-100`}>
                    <Icon size={24} />
                </div>
            </div>
            <h4 className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">{title}</h4>
            <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{value}</h3>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{subtext}</span>
                <Link to={link} className={`text-xs text-${color}-600 font-bold hover:underline bg-${color}-50 px-3 py-1 rounded-full flex items-center gap-1`}>
                    Manage <ArrowRight size={12} />
                </Link>
            </div>
        </motion.div>
    );

    const metrics = stats?.metrics || {};
    const recentLeaves = stats?.recent_pending_leaves || [];
    const departmentInsights = stats?.department_insights || [];
    const payrollHistory = stats?.payroll_history || [];
    
    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <header className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-fuchsia-100 text-fuchsia-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        HR Portal
                    </span>
                    <span className="text-slate-400 text-sm font-medium">| {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Hello, {user.username}!
                </h1>
                <p className="text-slate-500 font-medium mt-2">Oversee team attendance, manage leaves, and process daily structural operations.</p>
            </header>

            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Workforce" 
                    value={metrics.total_employees || 0}
                    icon={Users} color="fuchsia" link="/hrms" 
                    subtext="Total Employees"
                />
                <StatCard 
                    title="Active Floor" 
                    value={metrics.present_today || 0}
                    icon={Clock} color="emerald" link="/attendance" 
                    subtext={`+${metrics.half_day_today || 0} Half Day`}
                />
                <StatCard 
                    title="Pending Leaves" 
                    value={metrics.pending_leave_count || 0}
                    icon={Calendar} color="amber" link="/leaves" 
                    subtext="Awaiting review"
                />
                <StatCard 
                    title="Monthly Payout" 
                    value={`₹${(metrics.total_monthly_payout || 0).toLocaleString()}`}
                    icon={Banknote} color="emerald" link="/salary" 
                    subtext={`₹${(metrics.total_tax_month || 0).toLocaleString()} TDS collected`}
                />
            </div>

            {/* NEW: DEPARTMENT & PAYROLL SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Department Insights */}
                <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <TrendingUp className="text-indigo-600" size={24} />
                            Department Insights
                        </h3>
                        <Link to="/hrms/departments" className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl">Manage</Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {departmentInsights.length === 0 ? (
                            <p className="text-slate-500 text-center py-6 font-medium">No department data available.</p>
                        ) : (
                            departmentInsights.map(dept => (
                                <div key={dept.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-bold">
                                            {dept.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold tracking-tight">{dept.name}</p>
                                            <p className="text-slate-500 text-xs font-medium">{dept.employee_count} Employees</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-indigo-600 font-black text-lg">{dept.on_leave_today}</p>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">On Leave Today</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payroll Overview */}
                <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Banknote className="text-emerald-600" size={24} />
                            Recent Payroll
                        </h3>
                        <Link to="/salary" className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl">Generate Slips</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollHistory.length === 0 ? (
                                    <tr><td colSpan="3" className="py-10 text-center text-slate-500 font-medium">No payroll history found.</td></tr>
                                ) : (
                                    payrollHistory.map(record => (
                                        <tr key={record.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4">
                                                <p className="text-sm font-bold text-slate-900">{record.employee_name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{record.department}</p>
                                            </td>
                                            <td className="py-4 text-center">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${record.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <p className="text-sm font-black text-slate-900">₹{(record.net_pay || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{record.paid_at ? new Date(record.paid_at).toLocaleDateString() : 'Pending'}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* MIDDLE LEFT: Leave Operations */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm relative overflow-hidden h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <FileText className="text-fuchsia-600" size={24} />
                                Urgent Action Required
                            </h3>
                            <Link to="/leaves" className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-600 hover:text-fuchsia-700 bg-fuchsia-50 px-4 py-2 rounded-xl">View All Requests</Link>
                        </div>
                        
                        <div className="space-y-4">
                            {recentLeaves.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                                    <div className="p-4 bg-white shadow-sm rounded-full"><CheckCircle2 className="text-emerald-500" size={32} /></div>
                                    <div className="text-center">
                                        <p className="text-slate-900 font-bold text-lg tracking-tight">All clear!</p>
                                        <p className="text-slate-500 text-sm font-medium mt-1">There are no pending leave requests in the queue.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {recentLeaves.map((leave) => (
                                        <div key={leave.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl border border-slate-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-amber-100 text-amber-600 p-3 rounded-xl border border-amber-200 shadow-inner">
                                                    <ShieldAlert size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-bold tracking-tight">{leave.employee_name}</p>
                                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">
                                                        {leave.type} Leave &bull; {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link to="/leaves" className="text-indigo-600 font-bold text-xs bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors">Review</Link>
                                        </div>
                                    ))}
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
                                <Bell className="text-indigo-500" size={20} />
                                System Feed
                            </h3>
                        </div>

                        {/* Broadcast Form inside the panel */}
                        <form onSubmit={handleBroadcast} className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-1 border-b border-slate-200 pb-2">Broadcast Message</h4>
                            <input 
                                required placeholder="Announcement Subject"
                                value={broadcastForm.title} onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            <textarea 
                                required placeholder="Type broadcast message (everyone will see this)" rows={2}
                                value={broadcastForm.message} onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 custom-scrollbar resize-none"
                            />
                            <button 
                                type="submit" disabled={broadcasting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md text-xs disabled:opacity-50"
                            >
                                <Send size={14} />
                                {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                            </button>
                        </form>

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

export default HRDashboard;
