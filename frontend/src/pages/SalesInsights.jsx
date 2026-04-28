import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { 
    TrendingUp, Award, BarChart3, PieChart, 
    Download, Calendar, Target, IndianRupee, 
    ArrowUpRight, Users, Loader2, Filter,
    ChevronRight, Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

const SalesInsights = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const { data: insightsData } = await dashboardService.getSalesReports();
            setData(insightsData);
        } catch (error) {
            console.error('Error fetching sales insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-lg font-bold tracking-tight">Generating Sales Intelligence...</p>
            </div>
        );
    }

    const { 
        leaderboard = [], 
        trends = [], 
        source_breakdown = [], 
        retention = {
            rate: 0,
            repeat_customers: 0,
            churn_risk_count: 0,
            average_clv: 0,
            top_loyal_customers: []
        },
        summary = { cumulative_revenue: 0, average_deal_size: 0, largest_deal: 0 } 
    } = data || {};

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen printable-area">
            <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-10 no-print gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight italic">
                        <BarChart3 className="text-indigo-600" size={32} />
                        Sales Intelligence
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">12-month performance analysis and representative leaderboard.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
                        <Filter size={18} /> Filter Period
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-95"
                    >
                        <Download size={18} /> Export Intelligence
                    </button>
                </div>
            </header>

            {/* Top KPIs Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                            <IndianRupee size={24} />
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Cumulative Revenue</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{summary?.cumulative_revenue?.toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <ArrowUpRight size={14} /> Total Deal Value
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                            <Target size={24} />
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Average Ticket</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{Math.round(summary?.average_deal_size || 0).toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        Per Closed Opportunity
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl border border-fuchsia-100">
                            <Award size={24} />
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">Largest Deal</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{summary?.largest_deal?.toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-1 text-fuchsia-600 font-bold text-xs uppercase tracking-wider">
                        Premium Achievement
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* 12-Month Trends Visualization (Simplified CSS Bars) */}
                <div className="bg-white p-8 rounded-[34px] border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <TrendingUp className="text-indigo-600" size={24} />
                            Conversion Trends
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Last 12 Months</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-64 gap-2 px-2">
                        {trends?.length === 0 ? (
                            <p className="w-full text-center text-slate-400 font-medium">Insufficient trend data</p>
                        ) : trends.map((t, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full relative h-full flex flex-col justify-end">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(t.conversions / Math.max(...trends.map(t => t.conversions))) * 100}%` }}
                                        className="w-full bg-indigo-500 rounded-t-lg group-hover:bg-indigo-600 transition-colors relative"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t.conversions}
                                        </div>
                                    </motion.div>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase rotate-45 mt-2">{t.period}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sales Representative Leaderboard */}
                <div className="bg-white p-8 rounded-[34px] border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Award className="text-amber-500" size={24} />
                            Top Performing Reps
                        </h3>
                        <Link to="/crm/sales" className="text-[11px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-50 px-4 py-2 rounded-xl transition-colors">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {leaderboard?.map((rep, idx) => (
                            <div key={rep.id || idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold tracking-tight">{rep.name}</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{rep.dealCount} Deals Closed</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-900 font-black text-lg">₹{rep.totalRevenue.toLocaleString()}</p>
                                    <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">Avg: ₹{Math.round(rep.averageDealSize).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Breakdown by Source */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <PieChart className="text-sky-500" size={24} />
                        Revenue Attribution by Source
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            {source_breakdown?.map((source, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-slate-700 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-slate-300`} style={{ backgroundColor: `hsl(${200 + (idx * 40)}, 70%, 50%)` }}></div>
                                            {source.source}
                                        </span>
                                        <span className="text-slate-900">₹{source.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(source.revenue / summary.cumulative_revenue) * 100}%` }}
                                            className="h-full bg-sky-500"
                                            style={{ backgroundColor: `hsl(${200 + (idx * 40)}, 70%, 50%)` }}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-sky-50 rounded-3xl p-8 border border-sky-100 flex flex-col justify-center">
                            <h4 className="text-sky-900 font-black text-lg mb-2">Market Insight 🔍</h4>
                            <p className="text-sky-700 text-sm font-medium leading-relaxed italic">
                                {source_breakdown?.[0]?.source} represents your most successful lead magnet, contributing {Math.round((source_breakdown?.[0]?.revenue / summary.cumulative_revenue) * 100)}% of total revenue.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Efficiency Stats */}
                <div className="lg:col-span-1 bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mb-32 -mr-32"></div>
                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                        <Briefcase className="text-indigo-400" size={24} />
                        Sales Efficiency
                    </h3>
                    <div className="space-y-8">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Win Rate Score</p>
                            <h4 className="text-2xl font-black leading-none group flex items-center gap-2">
                                A- 
                                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-bold uppercase">Optimal</span>
                            </h4>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pipeline Velocity</p>
                            <h4 className="text-2xl font-black leading-none group flex items-center gap-2">
                                4.2d 
                                <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full font-bold uppercase font-mono">Avg Close</span>
                            </h4>
                        </div>
                        <div className="pt-4">
                            <button className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all shadow-xl flex items-center justify-center gap-2">
                                Full Audit Report <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loyalty & Retention Section */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-200 shadow-sm col-span-1 lg:col-span-1">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                        <Users className="text-emerald-500" size={24} />
                        Retention Rate
                    </h3>
                    <div className="flex flex-col items-center justify-center py-10 relative">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                                <motion.circle 
                                    cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 88}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - retention.rate / 100) }}
                                    className="text-emerald-500" 
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-slate-900">{retention.rate}%</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Loyalty</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full text-center">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repeat</p>
                                <p className="text-xl font-bold text-slate-900">{retention.repeat_customers}</p>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Churn Risk</p>
                                <p className="text-xl font-bold text-rose-600">{retention.churn_risk_count}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <Award className="text-indigo-600" size={24} />
                            Customer Lifetime Value (Top Loyal)
                        </h3>
                        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-bold text-xs">
                            Avg CLV: ₹{retention.average_clv}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {retention.top_loyal_customers?.map((cust, idx) => (
                            <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                        {cust.name[0]}
                                    </div>
                                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg">Rank #{idx+1}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{cust.name}</h4>
                                <div className="mt-4 flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Spend</p>
                                        <p className="text-2xl font-black text-slate-900">₹{cust.value.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                                        <p className="text-sm font-bold text-slate-700">{cust.orders} Records</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .printable-area { padding: 0; margin: 0; }
                    .no-print { display: none !important; }
                    .rounded-[32px], .rounded-[34px], .rounded-[40px] { border-radius: 12px !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

// Dummy link for navigation context
const Link = ({ children, to, className }) => <a href={to} className={className}>{children}</a>;

export default SalesInsights;
