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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={20} /></div>
                        <div>
                            <h3 className="font-black text-slate-900 leading-tight">Financial Performance</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue vs Procurement</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Revenue</span>
                            <span className="text-sm font-black text-emerald-600">₹{stats.crm?.revenue?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Outstanding Pay</span>
                            <span className="text-sm font-black text-rose-600">₹{stats.erp?.pending_amount?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Settled Pay</span>
                            <span className="text-sm font-black text-slate-900">₹{stats.erp?.received_amount?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package size={20} /></div>
                        <div>
                            <h3 className="font-black text-slate-900 leading-tight">Inventory Health</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material & Stock Logs</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total SKUs</span>
                            <span className="text-sm font-black text-slate-900">{stats.materials?.total_items}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Low Stock Alert</span>
                            <span className="text-sm font-black text-amber-500">{stats.materials?.low_stock_count}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Dead Inventory</span>
                            <span className="text-sm font-black text-rose-600">{stats.materials?.out_of_stock_count}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Users size={20} /></div>
                        <div>
                            <h3 className="font-black text-slate-900 leading-tight">HR Governance</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workforce & Compliance</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Active Force</span>
                            <span className="text-sm font-black text-slate-900">{stats.employees?.total}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Month Payout</span>
                            <span className="text-sm font-black text-indigo-600">₹{stats.finances?.monthly_payout?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Today's Presence</span>
                            <span className="text-sm font-black text-emerald-600">{stats.employees?.attendance_today?.find(a => a.status === 'Present')?.count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* HR SPECIFIC DOWNLOADS */}
            <div className="mb-12 bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white/10 text-white rounded-2xl border border-white/10"><FileText size={24} /></div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">HR Command Center Reports</h2>
                            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">Generate Statutory Compliance & Audit Documents</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button 
                            onClick={async () => {
                                const { salaryService } = await import('../services/api');
                                const { data } = await salaryService.getSalaries({ month: new Date().getMonth()+1, year: new Date().getFullYear() });
                                const headers = ['Employee', 'EmpCode', 'Gross', 'Net', 'Status', 'Date'];
                                const rows = data.salaries.map(s => [`${s.employee_id?.first_name} ${s.employee_id?.last_name}`, s.employee_id?.employeeCode, s.grossSalary, s.netPay, s.status, new Date(s.createdAt).toLocaleDateString()]);
                                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `Monthly_Payroll_Report_${new Date().getMonth()+1}.csv`; a.click();
                            }}
                            className="bg-white/5 border border-white/10 hover:bg-white hover:text-slate-900 p-6 rounded-3xl text-left transition-all group"
                        >
                            <Download className="text-indigo-400 group-hover:text-indigo-600 mb-4" size={24} />
                            <h4 className="text-white group-hover:text-slate-900 font-black text-sm mb-1">Monthly Payroll Report</h4>
                            <p className="text-white/40 group-hover:text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Full breakdown of earnings, deductions, and disbursement status.</p>
                        </button>

                        <button 
                             onClick={async () => {
                                const { hrmsService } = await import('../services/api');
                                const { data } = await hrmsService.getEmployees();
                                const headers = ['Name', 'Code', 'Email', 'Role', 'Department', 'Designation', 'Status'];
                                const rows = data.map(e => [`${e.first_name} ${e.last_name}`, e.employeeCode, e.email, e.role, e.department_name, e.designation, e.status]);
                                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `Employee_Directory_Report.csv`; a.click();
                            }}
                            className="bg-white/5 border border-white/10 hover:bg-white hover:text-slate-900 p-6 rounded-3xl text-left transition-all group"
                        >
                            <Download className="text-indigo-400 group-hover:text-indigo-600 mb-4" size={24} />
                            <h4 className="text-white group-hover:text-slate-900 font-black text-sm mb-1">Employee Directory</h4>
                            <p className="text-white/40 group-hover:text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Active personnel list with hierarchy mapping and contact data.</p>
                        </button>

                        <button 
                             onClick={async () => {
                                const { hrmsService } = await import('../services/api');
                                const { data } = await hrmsService.getAttendance();
                                const headers = ['Date', 'Employee', 'Clock In', 'Clock Out', 'Status'];
                                const rows = data.map(a => [new Date(a.date).toLocaleDateString(), `${a.first_name} ${a.last_name}`, a.clock_in ? new Date(a.clock_in).toLocaleTimeString() : '-', a.clock_out ? new Date(a.clock_out).toLocaleTimeString() : '-', a.status]);
                                const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `Attendance_Audit_Report.csv`; a.click();
                            }}
                            className="bg-white/5 border border-white/10 hover:bg-white hover:text-slate-900 p-6 rounded-3xl text-left transition-all group"
                        >
                            <Download className="text-indigo-400 group-hover:text-indigo-600 mb-4" size={24} />
                            <h4 className="text-white group-hover:text-slate-900 font-black text-sm mb-1">Attendance Audit</h4>
                            <p className="text-white/40 group-hover:text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Statutory log of working hours, lateness, and presence analytics.</p>
                        </button>
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
