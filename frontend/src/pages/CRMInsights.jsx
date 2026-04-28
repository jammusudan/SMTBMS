import React, { useState, useEffect } from 'react';
import { crmService } from '../services/api';
import { 
    BarChart3, PieChart as PieChartIcon, TrendingUp, Users, 
    Target, Loader2, Calendar, Award, Star, ArrowUpRight,
    Search, Filter, Maximize2, Download, Activity
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const InsightCard = ({ title, value, subtext, icon: Icon, color, children }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-4 md:p-8 rounded-[36px] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden"
    >
        <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-[22px] ${color} bg-opacity-10 shadow-sm`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">{subtext}</p>
                </div>
            </div>
            <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Maximize2 size={18} /></button>
        </div>
        <div className="flex-1 w-full min-h-[300px]">
            {children}
        </div>
    </motion.div>
);

const CRMInsights = () => {
    const [analytics, setAnalytics] = useState(null);
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const [analyticsRes, trendsRes] = await Promise.all([
                crmService.getAnalytics(),
                crmService.getTrends()
            ]);
            setAnalytics(analyticsRes.data);
            setTrends(trendsRes.data);
        } catch (error) {
            console.error('Error fetching CRM insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={16} className="text-indigo-400" />
                </div>
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Market Data...</p>
        </div>
    );

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="bg-slate-900 text-white text-[10px] md:text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl shadow-slate-100">Executive Intelligence</span>
                        <span className="text-slate-400 text-sm md:text-base font-bold">| Advanced Sales Analytics</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight italic">Business Insights</h1>
                    <p className="text-slate-500 font-black text-[10px] md:text-[13px] uppercase tracking-[0.2em] mt-4 opacity-80 decoration-indigo-200 decoration-2 underline-offset-8">Critical metrics & performance benchmarks</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
                    <button className="flex items-center justify-center gap-3 bg-white border border-slate-100 px-6 py-4 rounded-2xl text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
                        <Download size={18} /> Export Intel
                    </button>
                    <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 cursor-default">
                        <Calendar size={18} className="opacity-80" />
                        <span className="font-black text-[11px] uppercase tracking-widest">Q2 | 2026</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Force Leaderboard */}
                <InsightCard 
                    title="Sales Force Efficiency" 
                    subtext="Ranking by Gross Revenue"
                    icon={Award}
                    color="bg-amber-600"
                >
                    <div className="space-y-4 mt-4">
                        {analytics?.leaderboard.map((rep, idx) => (
                            <div key={idx} className="group relative overflow-hidden bg-slate-50/50 p-6 rounded-[24px] border border-transparent hover:border-indigo-100 transition-all">
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${idx === 0 ? 'bg-amber-400 text-white animate-pulse' : 'bg-white text-slate-400'}`}>
                                            {idx === 0 ? <Star size={24} fill="currentColor" /> : `#${idx + 1}`}
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black text-lg tracking-tight uppercase">{rep.name}</p>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <TrendingUp size={12} className="text-emerald-500" /> {rep.dealCount} Successful Conversions
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-indigo-600 font-black text-2xl tracking-tighter">₹{rep.totalSales.toLocaleString()}</p>
                                        <div className="flex items-center justify-end gap-1 text-[10px] font-black text-emerald-600 uppercase mt-1">
                                            <ArrowUpRight size={10} /> 14% vs LY
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute left-0 bottom-0 h-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ width: `${(rep.totalSales / analytics.leaderboard[0].totalSales) * 100}%` }} />
                            </div>
                        ))}
                    </div>
                </InsightCard>

                {/* Conversion Funnel Analysis */}
                <InsightCard 
                    title="Conversion Dynamics" 
                    subtext="Lead Source Efficiency"
                    icon={Target}
                    color="bg-indigo-600"
                >
                    <div className="h-full w-full py-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trends?.leadSources} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="source" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#475569', fontSize: 11, fontWeight: 900}}
                                    width={100}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="conversion" name="Conversion %" radius={[0, 10, 10, 0]} barSize={32}>
                                    {trends?.leadSources.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </InsightCard>

                {/* Deal Context Distribution */}
                <InsightCard 
                    title="Pipeline Portfolio" 
                    subtext="Deal Stage Volume"
                    icon={PieChartIcon}
                    color="bg-violet-600"
                >
                    <div className="h-full w-full py-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.stageDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {analytics?.stageDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="right" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </InsightCard>

                {/* Key Insights Summary */}
                <div className="bg-slate-900 p-10 rounded-[42px] text-white flex flex-col justify-between shadow-2xl shadow-indigo-100 shadow-opacity-20">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/40">
                                <Activity size={24} className="text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tight">Acquisition Insights</h3>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.3em] mb-3">Dominant Origin</h4>
                                <p className="text-2xl font-black tracking-tight">The <span className="text-indigo-400">Website</span> continues to provide the highest volume of qualified MQLs.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
                                <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" /> Strategic Outlook
                                </h4>
                                <p className="text-slate-300 font-bold text-sm leading-relaxed">Conversion rates have stabilized at <span className="text-white">{analytics?.kpis.conversionRate}%</span>. We recommend increasing deal engagement in the <span className="text-indigo-400">Negotiation</span> stage to accelerate Q3 revenue goals.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 flex justify-between items-end border-t border-white/10 pt-8">
                        <div>
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Calculated Integrity</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">v2.1.0-SMT-CORE</p>
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all active:scale-95">
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMInsights;
