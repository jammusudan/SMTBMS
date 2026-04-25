import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { FileText, Download, TrendingUp, Users, Package, Banknote, PieChart as PieIcon, LineChart as LineIcon, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [payrollData, setPayrollData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, payrollRes] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getPayrollReports()
            ]);
            setStats(statsRes.data);
            setPayrollData(payrollRes.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (!stats) return <div className="p-8 text-center text-slate-500">Failed to load report data.</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto printable-area">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Executive Reports
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Exportable summary of all key business modules</p>
                </div>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition">
                    <Download size={16} /> Export to PDF
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
                        <h3 className="font-bold text-slate-900">Financial Performance</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Total Revenue Generated</span>
                            <span className="text-sm font-bold text-emerald-600">₹{stats.crm?.revenue?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Procurement Outstanding</span>
                            <span className="text-sm font-bold text-rose-600">₹{stats.erp?.pending_amount?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Procurement Settled</span>
                            <span className="text-sm font-bold text-slate-900">₹{stats.erp?.received_amount?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={20} /></div>
                        <h3 className="font-bold text-slate-900">Inventory Health</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Total Materials Tracked</span>
                            <span className="text-sm font-bold text-slate-900">{stats.materials?.total_items}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Items Deep in Low Stock</span>
                            <span className="text-sm font-bold text-amber-500">{stats.materials?.low_stock_count}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Items Out of Stock</span>
                            <span className="text-sm font-bold text-rose-600">{stats.materials?.out_of_stock_count}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={20} /></div>
                        <h3 className="font-bold text-slate-900">HR & Workforce</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Total Active Employees</span>
                            <span className="text-sm font-bold text-slate-900">{stats.employees?.total}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-sm text-slate-500">Consolidated Payroll Payout</span>
                            <span className="text-sm font-bold text-indigo-600">₹{stats.finances?.monthly_payout?.toLocaleString() || 0}</span>
                        </div>
                        {stats.employees?.attendance_today?.map((a, i) => (
                            <div key={i} className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-sm text-slate-500">Logged {a.status} Today</span>
                                <span className="text-sm font-bold text-slate-900">{a.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEW: Payroll Analytics & Trends */}
            {payrollData && (
                <div className="space-y-8 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 12-Month Payout Trend */}
                        <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner"><LineIcon size={24} /></div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">12-Month Payout Trend</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Period Payout</p>
                                    <p className="text-xl font-black text-indigo-600 leading-none">₹{payrollData.trends.reduce((acc, curr) => acc + curr.payout, 0).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={payrollData.trends} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="period" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                            interval={2}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Payout']}
                                        />
                                        <Bar dataKey="payout" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Dept Wise Payout Breakdown */}
                        <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl shadow-inner"><PieIcon size={24} /></div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Department-wise Payout</h3>
                            </div>
                            <div className="flex-1 flex items-center">
                                <div className="h-[250px] flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={payrollData.department_distribution}
                                                cx="50%" cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {payrollData.department_distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#f43f5e'][index % 4]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-[180px] space-y-3">
                                    {payrollData.department_distribution.map((dept, index) => (
                                        <div key={dept.name} className="flex justify-between items-center text-xs font-bold text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'][index % 4] }}></div>
                                                <span>{dept.name}</span>
                                            </div>
                                            <span className="text-slate-900">₹{(dept.value / 1000).toFixed(1)}k</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payroll Summary Analytics Header-style */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Avg Monthly Salary', value: payrollData.summary.avgNetPay, icon: Banknote, color: 'indigo' },
                            { label: 'Total TDS Collected', value: payrollData.summary.totalTax, icon: FileText, color: 'rose' },
                            { label: 'Highest Payout', value: payrollData.summary.maxNetPay, icon: TrendingUp, color: 'emerald' },
                            { label: 'Pending Payouts', value: stats.metrics?.pending_payroll_count || 0, icon: Clock, color: 'amber', isStatic: true }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex items-center gap-4">
                                <div className={`p-3 bg-${stat.color}-100 text-${stat.color}-600 rounded-xl`}><stat.icon size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black text-slate-900 leading-tight">
                                        {stat.isStatic ? stat.value : `₹${Math.round(stat.value).toLocaleString()}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Note for printing styles */}
            <style>{`
                @media print {
                    .printable-area { 
                        padding: 0;
                        margin: 0;
                    }
                    nav, button { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
