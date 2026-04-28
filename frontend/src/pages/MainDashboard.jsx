import React, { useState, useEffect } from 'react';
import { dashboardService, logService } from '../services/api';
import { 
    LayoutDashboard, Package, Users, TrendingUp, ShoppingCart, 
    AlertTriangle, CheckCircle2, IndianRupee, ArrowUpRight, 
    Calendar, ArrowDownRight, Loader2, Clock, XCircle, Activity,
    Megaphone, Settings, UserPlus, FileBarChart, ShieldCheck, Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MainDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const role = user?.role?.toUpperCase() || '';
    const isAdmin = ['ADMIN', 'SUPER ADMIN'].includes(role);
    const isSuperAdmin = role === 'SUPER ADMIN';
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    dashboardService.getStats(),
                    logService.getLogs(6)
                ]);
                setStats(statsRes.data || {});
                setLogs(logsRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const salesTrendData = [
        { name: 'Nov', revenue: 4000 },
        { name: 'Dec', revenue: 3000 },
        { name: 'Jan', revenue: 2000 },
        { name: 'Feb', revenue: 2780 },
        { name: 'Mar', revenue: 1890 },
        { name: 'Apr', revenue: 2390 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <div className="animate-spin mb-4 border-4 border-slate-200 border-t-indigo-600 rounded-full w-10 h-10"></div>
                <span className="text-xl font-black tracking-widest uppercase text-[10px]">Syncing Intelligence...</span>
            </div>
        );
    }

    if (!stats || !stats.crm || !stats.materials || !stats.employees) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <AlertTriangle className="mb-4 text-rose-500" size={48} />
                <span className="text-lg font-black tracking-tight text-slate-900 uppercase">System Core Unreachable</span>
                <p className="text-xs font-bold mt-2 uppercase tracking-widest text-slate-400">The operational intelligence layer is offline.</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Establish Connection</button>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
        <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 relative overflow-hidden group transition-all shadow-sm"
        >
            <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 font-bold border border-${color}-50`}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <span className={`flex items-center text-[12px] font-black uppercase tracking-widest ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <h4 className="text-slate-400 text-[13px] font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
            <div className="mt-4 pt-4 border-t border-slate-50">
                <span className="text-[13px] text-slate-400 font-bold uppercase tracking-widest transition-colors group-hover:text-slate-600">{subtext}</span>
            </div>
        </motion.div>
    );

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-white">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-slate-600 shadow-sm">
                        <ShieldCheck size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[14px] font-black text-slate-900 uppercase tracking-tighter leading-none">
                            {isSuperAdmin ? 'Elite Management' : 'Admin Console'}
                        </span>
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-2 opacity-70">Operational Oversight | {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link to="/announcements" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition shadow-sm active:scale-[0.98]">
                        <Megaphone size={16} /> Broadcast
                    </Link>
                    {isSuperAdmin && (
                        <Link to="/settings" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition shadow-sm active:scale-[0.98]">
                            <Settings size={16} /> Config
                        </Link>
                    )}
                </div>
            </header>

            <div className="mb-10 px-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic flex items-center gap-4 underline decoration-indigo-500/20 underline-offset-8 decoration-4">
                    Operational Intelligence Center
                </h1>
                <p className="text-slate-400 font-black uppercase text-[10px] md:text-[12px] tracking-[0.4em] mt-4 opacity-80 leading-relaxed">Strategic Data Visualization & Monitoring Portfolio</p>
            </div>

            {/* CORE METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="Revenue" 
                    value={`₹${(stats.crm.revenue / 1000000).toFixed(1)}M`} 
                    icon={TrendingUp} color="emerald" link="/crm/sales" 
                    subtext="Consolidated Units" trend={12.5}
                />
                <StatCard 
                    title="Pipeline" 
                    value={stats.crm.leads_count || 0}
                    icon={Target} color="indigo" link="/crm/leads" 
                    subtext={`${stats.crm.active_deals || 0} Strategic Deals`}
                />
                <StatCard 
                    title="Inventory" 
                    value={stats.materials.total_items}
                    icon={Package} color="sky" link="/inventory" 
                    subtext={`${stats.materials.out_of_stock_count} Critical | ${stats.materials.low_stock_count} Low`}
                />
                <StatCard 
                    title="Conversion" 
                    value={`${stats.crm.conversion_rate || 0}%`}
                    icon={Activity} color="rose" link="/crm/overview" 
                    subtext="Lead Success Velocity" trend={2.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (Revenue + System Intelligence) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Revenue Intelligence Chart */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic flex items-center gap-2">
                                    <Activity size={24} className="text-indigo-600" />
                                    Revenue Intelligence
                                </h3>
                                <p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest mt-2">12-Month Fiscal Performance Matrix</p>
                            </div>
                            <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {['Revenue', 'Payroll'].map(tab => (
                                    <button 
                                        key={tab} 
                                        className={`px-5 py-2.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all ${tab === 'Revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="h-64 w-full flex items-end gap-2">
                            {[40, 70, 45, 90, 65, 80, 50, 85, 60, 75, 40, 95].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.05, duration: 0.8 }}
                                    className="flex-1 bg-gradient-to-t from-indigo-600/20 to-indigo-600 rounded-t-xl relative group/bar hover:to-indigo-500 transition-all cursor-crosshair"
                                >
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                                        ₹{h * 10}K
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
                            {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map(m => <span key={m}>{m}</span>)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Material Inventory Alerts */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 italic">
                                    <AlertTriangle className="text-amber-500" size={24} />
                                    Inventory Console
                                </h3>
                                <Link to="/inventory" className="text-[12px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 pb-1">Focus</Link>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-emerald-100 text-emerald-700 text-[14px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Real-time Sync</span>
                                <span className="text-slate-400 text-base font-bold">| {isAdmin ? 'Enterprise Oversight' : 'Personal Attendance'}</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic opacity-90">
                                Attendance Intelligence
                            </h1>
                            <div className="space-y-5 flex-1">
                                <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest leading-none mb-1">Critical Deficit</span>
                                        <span className="text-[13px] font-black text-rose-500 uppercase tracking-tighter">Out of Stock SKU</span>
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{stats.materials.out_of_stock_count}</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-[32px] text-white shadow-xl shadow-slate-200">
                                    <div className="flex flex-col">
                                        <span className="text-white/50 text-[11px] font-black uppercase tracking-widest leading-none mb-1">Reorder Point</span>
                                        <span className="text-[13px] font-black text-amber-400 uppercase tracking-tighter">Low Inventory SKUs</span>
                                    </div>
                                    <span className="text-3xl font-black text-white tracking-tighter">{stats.materials.low_stock_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Strategic CRM Pulse */}
                        <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Market Intelligence</h4>
                                    <Link to="/crm/overview" className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                                        <ArrowUpRight size={18} />
                                    </Link>
                                </div>
                                <h3 className="text-2xl font-black italic mb-2">Lead Velocity</h3>
                                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-8">Monthly Acquisition Performance</p>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-black tracking-tighter">+{stats.crm.monthly_leads || 0}</span>
                                            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">New Leads</span>
                                        </div>
                                        <div className="h-12 w-24 flex items-end gap-1">
                                            {[30, 50, 40, 70, 45, 90].map((h, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Target Accuracy</span>
                                            <span className="text-[11px] font-black text-emerald-400">92%</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[92%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <Target size={18} className="text-indigo-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Q2 Forecast: On Track</span>
                            </div>
                        </div>

                        {/* Quick Command Console */}
                        <div className="bg-white p-10 rounded-[40px] border border-slate-100 flex flex-col justify-between shadow-sm">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-8 text-slate-400">Unit Commands</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'CRM Overview', icon: FileBarChart, path: '/crm/overview' },
                                    { label: 'Security Logs', icon: ShieldCheck, path: '/logs' },
                                    { label: 'Employee Hub', icon: Users, path: '/hrms' }
                                ].map((cmd) => (
                                    <Link key={cmd.label} to={cmd.path} className="flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 rounded-[24px] border border-slate-100 transition-all group active:scale-[0.98]">
                                        <div className="flex items-center gap-4">
                                            <cmd.icon size={20} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
                                            <span className="text-[12px] font-black uppercase tracking-widest text-slate-900">{cmd.label}</span>
                                        </div>
                                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-8 flex items-center gap-3 opacity-60 font-black text-[10px] uppercase tracking-widest text-slate-900 italic">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                Neural Link Active
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Audit Feed (Right Sidebar) */}
                <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 italic flex items-center gap-3">
                                <ShieldCheck size={24} className="text-slate-600" />
                                Audit Feed
                            </h3>
                            <p className="text-slate-400 text-[12px] font-black uppercase tracking-widest mt-2">Live Sentinel Logs</p>
                        </div>
                        <Link to="/logs" className="text-[11px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Archive</Link>
                    </div>

                    <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[600px]">
                        {logs.slice(0, 8).map((log, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={log.id} 
                                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all cursor-default group/log"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[140px]">{log.action}</span>
                                    <span className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-[13px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-2 leading-none">
                                    <div className="w-2 h-2 rounded-full bg-indigo-100 group-hover/log:bg-indigo-600 transition-colors"></div>
                                    {log.username || 'System'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default MainDashboard;
