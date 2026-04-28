import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { 
    TrendingUp, TrendingDown, Package, AlertTriangle, IndianRupee, 
    BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, 
    Loader2, Calendar, RefreshCw, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

const InventoryAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await dashboardService.getAnalytics();
            setData(res.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-slate-400">
                <Loader2 className="animate-spin mb-4 text-indigo-600" size={48} />
                <p className="text-xs font-black uppercase tracking-widest">Compiling business intelligence...</p>
            </div>
        );
    }

    const { financials, stock_health, trends } = data;
    const isProfit = financials.profit_loss >= 0;

    const stockPieData = [
        { name: 'Healthy', value: stock_health.total_materials - stock_health.low_stock - stock_health.out_of_stock, color: '#10b981' },
        { name: 'Low Stock', value: stock_health.low_stock, color: '#f59e0b' },
        { name: 'Out of Stock', value: stock_health.out_of_stock, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        <BarChart3 className="text-indigo-600" size={32} />
                        Inventory Analytics
                    </h1>
                    <p className="text-slate-600 mt-1 uppercase text-[10px] font-black tracking-widest">Financial health and warehouse intelligence.</p>
                </div>
                <button 
                    onClick={fetchAnalytics}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={18} />
                    Refresh Data
                </button>
            </header>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="Total Purchase" 
                    value={financials.total_purchase} 
                    icon={TrendingDown} 
                    color="indigo" 
                    subtitle="Cumulative expenditure"
                />
                <StatCard 
                    title="Total Sales" 
                    value={financials.total_sales} 
                    icon={TrendingUp} 
                    color="emerald" 
                    subtitle="Revenue from orders"
                />
                <StatCard 
                    title={isProfit ? "Total Profit" : "Total Loss"} 
                    value={Math.abs(financials.profit_loss)} 
                    icon={isProfit ? ArrowUpRight : ArrowDownRight} 
                    color={isProfit ? "emerald" : "rose"} 
                    subtitle="Business performance"
                    isCurrency
                    special={isProfit ? 'PROFIT' : 'LOSS'}
                />
                <StatCard 
                    title="Inventory Valuation" 
                    value={financials.inventory_valuation} 
                    icon={IndianRupee} 
                    color="amber" 
                    subtitle="Stock asset value"
                />
            </div>

            {/* Stock Health Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Purchase vs Sales Trend</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monthly financial flow analysis</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <LegendItem color="#6366f1" label="Purchase" />
                            <LegendItem color="#10b981" label="Sales" />
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorPur" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                                />
                                <Tooltip 
                                    content={<CustomTooltip />}
                                />
                                <Area type="monotone" dataKey="purchase" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPur)" />
                                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stock Health Breakdown */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">Warehouse Health</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Inventory composition analysis</p>
                    
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stockPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stockPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-3xl font-black text-slate-900 leading-none">{stock_health.total_materials}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Materials</p>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        <HealthRow label="Low Stock Items" count={stock_health.low_stock} color="amber" />
                        <HealthRow label="Out of Stock" count={stock_health.out_of_stock} color="rose" />
                        <HealthRow label="Available Items" count={stock_health.total_materials - stock_health.low_stock - stock_health.out_of_stock} color="emerald" />
                    </div>
                </div>
            </div>

            {/* Additional Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Layers size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Valuation Status</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1">
                            {stock_health.out_of_stock > 0 ? "Potential Revenue Leak Detected" : "Optimized Stock Configuration"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {stock_health.out_of_stock} essential materials are completely out of stock.
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ShieldCheck size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Standing</p>
                        <h4 className="text-xl font-black text-slate-900 mt-1">
                            {isProfit ? "Profitable Margin" : "Investment Recovery Phase"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Liquidity at {((financials.total_sales / financials.total_purchase) * 100).toFixed(1)}% of procurement cost.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtitle, special }) => {
    const colorClasses = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100'
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden"
        >
            <div className={`w-12 h-12 ${colorClasses[color]} rounded-2xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110`}>
                <Icon size={24} />
            </div>
            
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mb-2">{title}</p>
            <div className="flex items-end gap-1 mb-1">
                <span className="text-xs font-black text-slate-400 mb-1">₹</span>
                <h3 className={`text-3xl font-black tracking-tighter ${special === 'LOSS' ? 'text-rose-600' : 'text-slate-900'}`}>
                    {Number(value).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
            
            {special && (
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[8px] font-black tracking-widest ${special === 'PROFIT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {special}
                </div>
            )}
        </motion.div>
    );
};

const HealthRow = ({ label, count, color }) => {
    const dots = {
        amber: 'bg-amber-500 shadow-amber-200',
        rose: 'bg-rose-500 shadow-rose-200',
        emerald: 'bg-emerald-500 shadow-emerald-200'
    };
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shadow-lg ${dots[color]}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            </div>
            <span className="text-sm font-black text-slate-900">{count}</span>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2 mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-6">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="text-xs font-black text-white">₹{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// Internal utility to help with missing icon
const ShieldCheck = ({ size, className }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

export default InventoryAnalytics;
