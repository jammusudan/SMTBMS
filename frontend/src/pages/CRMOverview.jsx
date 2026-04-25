import React, { useState, useEffect } from 'react';
import { crmService } from '../services/api';
import { 
    LayoutDashboard, TrendingUp, Users, DollarSign, 
    ArrowUpRight, ArrowDownRight, Target, Activity,
    Calendar, Loader2, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtext, icon: Icon, trend, color }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {trend && (
                <span className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-[13px] font-black uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            <p className="text-slate-400 text-[11px] font-bold mt-2 uppercase tracking-wider">{subtext}</p>
        </div>
    </motion.div>
);

const CRMOverview = () => {
    const [data, setData] = useState(null);
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [analyticsRes, trendsRes] = await Promise.all([
                crmService.getAnalytics(),
                crmService.getTrends()
            ]);
            setData(analyticsRes.data);
            setTrends(trendsRes.data);
        } catch (error) {
            console.error('Error fetching CRM analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Aggregating Intelligence...</p>
        </div>
    );

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc]">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-indigo-600 text-white text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">Market Intelligence</span>
                        <span className="text-slate-400 text-base font-bold">| CRM Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Strategic Overview</h1>
                    <p className="text-slate-500 font-black text-[13px] uppercase tracking-[0.2em] mt-3 opacity-80">Real-time Sales Performance & Revenue Attribution</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Calendar size={18} className="text-slate-400 ml-2" />
                    <span className="text-slate-600 font-black text-[11px] uppercase tracking-widest mr-4">Fiscal Year 2026</span>
                </div>
            </header>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    title="Gross Revenue" 
                    value={`₹${(data?.kpis?.totalRevenue || 0).toLocaleString()}`}
                    subtext="Settled (Won) Deals Only"
                    icon={DollarSign}
                    color="bg-indigo-600"
                    trend={12}
                />
                <StatCard 
                    title="Pipeline Value" 
                    value={`₹${(data?.kpis?.pipelineValue || 0).toLocaleString()}`}
                    subtext="Projected (Active) Revenue"
                    icon={Activity}
                    color="bg-emerald-600"
                    trend={8}
                />
                <StatCard 
                    title="Active Deals" 
                    value={data?.kpis.activeDeals}
                    subtext="Deals in Progress"
                    icon={Target}
                    color="bg-violet-600"
                />
                <StatCard 
                    title="Conversion Rate" 
                    value={`${data?.kpis.conversionRate}%`}
                    subtext="Lead Conversion Success"
                    icon={TrendingUp}
                    color="bg-rose-600"
                />
                <StatCard 
                    title="Top Performer" 
                    value={data?.kpis.topPerformer}
                    subtext="Elite Sales Achievement"
                    icon={Users}
                    color="bg-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trajectory</h3>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Monthly Gross Performance</p>
                        </div>
                        <BarChart3 className="text-slate-300" size={24} />
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="monthNum" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}}
                                    tickFormatter={(val) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][val-1]}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 900}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 900, color: '#1e293b' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stage Distribution */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Deal Funnel</h3>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">Pipeline Distribution</p>
                        </div>
                        <PieChartIcon className="text-slate-300" size={24} />
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.stageDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {data?.stageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sales Leaderboard & Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Sales Powerhouse</h3>
                    <div className="space-y-6">
                        {data?.leaderboard.map((rep, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-black text-sm uppercase">{rep.name}</p>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{rep.dealCount} Deals Closed</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-indigo-600 font-black text-lg">₹{rep.totalSales.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Source Attribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trends?.leadSources}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="count" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMOverview;
