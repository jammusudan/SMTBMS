import React, { useState, useEffect } from 'react';
import { dashboardService, notificationService } from '../services/api';
import { 
    Users, Calendar, Clock, Banknote,
    CheckCircle2, Bell, ShieldAlert,
    TrendingUp, FileText, ArrowRight, Send,
    PlusCircle, Play, FilePieChart, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await dashboardService.getHRStats();
                setStats(data || {});
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
                <span className="text-lg font-medium tracking-tight">Accessing HR Command Center...</span>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, link, subtext, progress }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 relative overflow-hidden group transition-all shadow-sm hover:shadow-xl hover:border-indigo-100"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-${color}-500/10 transition-colors`}></div>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 font-bold border border-${color}-100 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                <Link to={link} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <ArrowRight size={18} className="text-slate-300" />
                </Link>
            </div>
            <h4 className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-1">{title}</h4>
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{value}</h3>
            
            {progress !== undefined ? (
                <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        <span>Disbursement</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            ) : (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{subtext}</p>
            )}
        </motion.div>
    );

    const QuickAction = ({ title, desc, icon: Icon, color, onClick }) => (
        <button 
            onClick={onClick}
            className="flex items-center gap-4 p-5 bg-white rounded-[24px] border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all text-left group w-full"
        >
            <div className={`p-3.5 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white transition-all shadow-sm`}>
                <Icon size={22} />
            </div>
            <div>
                <h4 className="font-black text-slate-900 text-sm tracking-tight">{title}</h4>
                <p className="text-xs text-slate-500 font-medium">{desc}</p>
            </div>
        </button>
    );

    const metrics = stats?.metrics || {};
    const recentLeaves = stats?.recent_pending_leaves || [];
    const activities = stats?.recent_activities || [];
    
    const disbursementRate = metrics.total_monthly_payout > 0 
        ? (metrics.paid_payout / metrics.total_monthly_payout) * 100 
        : 0;

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F9FAFB]">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100 w-fit">
                                HR Authority Portal
                            </span>
                            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        HR Command Center
                    </h1>
                    <p className="text-slate-500 font-medium mt-3 text-lg">Strict operational oversight and payroll governance.</p>
                </div>

                {/* QUICK ACTIONS BAR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                    <QuickAction 
                        title="Add Employee" 
                        desc="Onboard personnel" 
                        icon={PlusCircle} color="indigo"
                        onClick={() => navigate('/hrms')}
                    />
                    <QuickAction 
                        title="Run Payroll" 
                        desc="Calculate batch" 
                        icon={Play} color="emerald"
                        onClick={() => navigate('/salary')}
                    />
                    <QuickAction 
                        title="Reports" 
                        desc="Financial audit" 
                        icon={FilePieChart} color="fuchsia"
                        onClick={() => navigate('/reports')}
                    />
                </div>
            </header>

            {/* TOP METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <StatCard 
                    title="Total Workforce" 
                    value={metrics.total_employees || 0}
                    icon={Users} color="indigo" link="/hrms" 
                    subtext="Consolidated Personnel"
                />
                <StatCard 
                    title="Monthly Payout" 
                    value={`₹${(metrics.total_monthly_payout || 0).toLocaleString()}`}
                    icon={Banknote} color="emerald" link="/salary" 
                    progress={disbursementRate}
                />
                <StatCard 
                    title="Settled Liability" 
                    value={`₹${(metrics.paid_payout || 0).toLocaleString()}`}
                    icon={CheckCircle2} color="blue" link="/salary" 
                    subtext={`Remaining: ₹${(metrics.pending_payout || 0).toLocaleString()}`}
                />
                <StatCard 
                    title="Active Floor" 
                    value={metrics.present_today || 0}
                    icon={Clock} color="amber" link="/attendance" 
                    subtext={`${metrics.absent_today || 0} Absent / ${metrics.half_day_today || 0} Half-Day`}
                />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* LEFT: Activity Feed */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                <Activity className="text-indigo-600" size={28} />
                                Operations Feed
                            </h3>
                            <Link to="/logs" className="text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-5 py-2.5 rounded-2xl transition-all">Audit Trails</Link>
                        </div>
                        
                        <div className="space-y-4">
                            {activities.length === 0 ? (
                                <p className="text-slate-400 text-center py-12 font-bold italic">No recent HRMS activities recorded.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <span className="font-black text-xs uppercase">{activity.user?.[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-900 font-black tracking-tight text-base leading-tight">{activity.action}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{activity.user}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(activity.time).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Urgent Leaves & Notifications */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                <Calendar className="text-rose-600" size={24} />
                                Leave Queue
                            </h3>
                            <Link to="/leaves" className="text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all">
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                        
                        <div className="space-y-4">
                            {recentLeaves.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={28} />
                                    </div>
                                    <p className="text-slate-500 font-bold text-sm">All cleared!</p>
                                </div>
                            ) : (
                                recentLeaves.map((leave) => (
                                    <div key={leave.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-black text-slate-900 tracking-tight">{leave.employee_name}</span>
                                            <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md uppercase tracking-widest border border-rose-200">Pending</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {leave.type} &bull; {new Date(leave.start_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick System Status Card */}
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="text-lg font-black mb-4 flex items-center gap-3 tracking-tight relative z-10">
                            <TrendingUp className="text-indigo-400" size={22} />
                            Payroll Health
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Processed Records</p>
                                    <p className="text-2xl font-black">{metrics.payroll_processed || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Unpaid Cycle</p>
                                    <p className="text-2xl font-black text-amber-400">{metrics.pending_payroll_count || 0}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <Link to="/salary" className="w-full py-3 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-black/20">
                                    Manage Cycle <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HRDashboard;
