import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salaryService, hrmsService } from '../services/api';
import { Banknote, Plus, Loader2, XCircle, Search, User, Clock, CheckCircle2, ChevronDown, ChevronRight, FileText, Download, DollarSign, History, AlertCircle, Calendar, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeSalary from './EmployeeSalary';

// Print Styles
const printStyles = `
  @media print {
    body * { visibility: hidden; }
    #salary-slip, #salary-slip * { visibility: visible; }
    #salary-slip { 
      position: absolute; 
      left: 0; 
      top: 0; 
      width: 100%; 
      padding: 0 !important;
      margin: 0 !important;
    }
  }
`;

const SalarySystem = () => {
    const { user } = useAuth();
    const isAdminMode = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'HR';

    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Background Job Tracking
    const [activeJob, setActiveJob] = useState(null);
    const [jobProgress, setJobProgress] = useState(0);

    // Filters & Pagination
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(null); 
    const [isPayModalOpen, setIsPayModalOpen] = useState(null); 
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false); // boolean for monthly rollback
    const [viewSlip, setViewSlip] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [jobError, setJobError] = useState(null);

    // Form Data
    const [adjForm, setAdjForm] = useState({ type: 'Bonus', amount: '', reason: '' });
    const [payForm, setPayForm] = useState({ amount: '', method: 'Bank Transfer', transactionId: '' });
    const [rollbackReason, setRollbackReason] = useState('');

    const [statusFilter, setStatusFilter] = useState('Active');

    useEffect(() => {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = printStyles;
        document.head.appendChild(styleSheet);
        return () => document.head.removeChild(styleSheet);
    }, []);

    useEffect(() => {
        if (isAdminMode) {
            fetchSalaries();
        } else {
            setLoading(false);
        }
    }, [isAdminMode, selectedMonth, selectedYear, page, statusFilter]);

    // 🔄 Job Polling Effect
    useEffect(() => {
        let interval;
        if (activeJob) {
            interval = setInterval(async () => {
                try {
                    const { data } = await salaryService.getJobStatus(activeJob);
                    const prog = (data.progress.processed / data.progress.total) * 100;
                    setJobProgress(prog || 0);
                    
                    if (data.status === 'Completed') {
                        setActiveJob(null);
                        setJobProgress(0);
                        setJobError(null);
                        fetchSalaries();
                    } else if (data.status === 'Failed') {
                        setJobError(data.progress.errors[0]?.error || 'Unknown system failure');
                        setJobProgress(100);
                        // We keep activeJob set to show the failure UI/Retry button
                    }
                } catch (err) {
                    console.error('Job polling error:', err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [activeJob]);

    const [serverStats, setServerStats] = useState({ totalNetPay: 0, totalPaid: 0 });

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const { data } = await salaryService.getSalaries({ 
                month: selectedMonth, 
                year: selectedYear,
                page,
                limit: 10,
                status: statusFilter === 'Active' ? 'Pending,Paid,Partially Paid' : 'Reverted'
            });
            setSalaries(data.salaries || []);
            setTotalPages(data.pages || 1);
            setServerStats(data.stats || { totalNetPay: 0, totalPaid: 0 });
        } catch (error) {
            console.error('Fetch error:', error);
            setSalaries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchGenerate = async () => {
        setActionLoading(true);
        try {
            const idempotencyKey = `BATCH-${selectedMonth}-${selectedYear}-${Date.now()}`;
            const { data } = await salaryService.batchGenerate({ 
                month: selectedMonth, 
                year: selectedYear,
                idempotencyKey
            });
            setActiveJob(data.jobId);
            setIsGenerateModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error starting batch');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRollback = async () => {
        if (!rollbackReason) return alert('Please provide a reason for rollback');
        setActionLoading(true);
        try {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            await salaryService.emergencyRollback({ 
                month: months[selectedMonth - 1], 
                year: selectedYear, 
                reason: rollbackReason 
            });
            fetchSalaries();
            setIsRollbackModalOpen(false);
            setRollbackReason('');
            // Success Notification would go here
        } catch (error) {
            alert(error.response?.data?.message || 'Rollback failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await salaryService.processPayment(isPayModalOpen._id, payForm);
            fetchSalaries();
            setIsPayModalOpen(null);
            setPayForm({ amount: '', method: 'Bank Transfer', transactionId: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Payment processing failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddAdjustment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await salaryService.addAdjustment(isAdjustModalOpen._id, adjForm);
            fetchSalaries();
            setIsAdjustModalOpen(null);
            setAdjForm({ type: 'Bonus', amount: '', reason: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Adjustment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReOpen = async (salaryId) => {
        if (!window.confirm('Re-opening will allow modifications and increment the version number. Proceed?')) return;
        try {
            await salaryService.adminReOpen(salaryId);
            fetchSalaries();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to re-open');
        }
    };

    const exportToCSV = () => {
        const headers = ['Employee', 'Designation', 'Month/Year', 'Basic', 'HRA', 'Allowances', 'Deductions', 'Tax', 'Attendance Deduct', 'Net Pay', 'Status'];
        const rows = salaries.map(s => [
            `${s.employee_id?.first_name} ${s.employee_id?.last_name}`,
            s.employee_id?.designation,
            `${s.month}/${s.year}`,
            s.basicSalary,
            s.hra,
            s.allowances,
            s.totalDeductions - s.attendanceDeductions - s.monthlyTax - s.pf - s.others,
            s.monthlyTax,
            s.attendanceDeductions,
            s.netPay,
            s.status
        ]);

        const content = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payroll_${selectedMonth}_${selectedYear}.csv`;
        a.click();
    };

    if (!isAdminMode) return <EmployeeSalary />;

    // Note: Filtering is handled by the server for better performance in production.
    // However, we still support local filtering for the current page's results.
    const filteredSalaries = Array.isArray(salaries) ? salaries.filter(s => 
        `${s.employee_id?.first_name} ${s.employee_id?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    const stats = {
        total: serverStats.totalNetPay,
        paid: serverStats.totalPaid,
        pending: Math.max(0, serverStats.totalNetPay - serverStats.totalPaid),
        count: salaries.length // Current page count
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = [2024, 2025, 2026];

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-[#F9FAFB]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100"><Banknote size={24} /></div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">HR Payroll Command Center</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-indigo-100">Enterprise Edition</span>
                        <p className="text-slate-500 text-sm font-medium">Automated salary computation & financial audit.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {activeJob && !jobError && (
                        <div className="flex flex-col items-end gap-1 mr-4">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Computing Payroll ({Math.round(jobProgress)}%)</span>
                            <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${jobProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                    {jobError && (
                        <div className="flex items-center gap-3 mr-4 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                             <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest leading-none">Job Failed</span>
                                 <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{jobError}</span>
                             </div>
                             <button 
                                onClick={() => { setActiveJob(null); setJobError(null); setIsGenerateModalOpen(true); }}
                                className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-slate-900 transition-all shadow-lg shadow-rose-100"
                                title="Retry Job"
                             >
                                <RefreshCcw size={12} />
                             </button>
                             <button onClick={() => { setActiveJob(null); setJobError(null); }} className="text-slate-400 hover:text-slate-900"><XCircle size={14} /></button>
                        </div>
                    )}
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <select 
                            value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-slate-700 py-1.5 px-3 focus:outline-none border-r border-slate-100"
                        >
                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                        <select 
                            value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-slate-700 py-1.5 px-3 focus:outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {user?.role === 'HR' && (
                        <>
                            <button 
                                onClick={() => setIsGenerateModalOpen(true)}
                                disabled={activeJob && !jobError}
                                className={`flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg text-sm ml-auto md:ml-0 ${activeJob && !jobError ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100'}`}
                            >
                                <RefreshCcw size={16} className={activeJob && !jobError ? 'animate-spin' : ''} />
                                Run Batch
                            </button>
                            <button 
                                onClick={() => setIsRollbackModalOpen(true)}
                                className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold py-2.5 px-5 rounded-xl border border-rose-100 transition-all shadow-lg shadow-rose-100 text-sm"
                            >
                                <AlertCircle size={16} />
                                Rollback
                            </button>
                        </>
                    )}
                    <button onClick={exportToCSV} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><Download size={18} /></button>
                </div>
            </header>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Payroll Ledger', value: stats.total, icon: Banknote, color: 'indigo' },
                    { label: 'Actual Disbursement', value: stats.paid, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Unsettled Liability', value: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Cycle Registry', value: stats.count, icon: User, color: 'slate' }
                ].map((kpi, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={kpi.label} 
                        className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all"
                    >
                        <div className={`bg-${kpi.color}-50 p-3 rounded-2xl text-${kpi.color}-600 group-hover:scale-110 transition-transform`}>
                            <kpi.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {typeof kpi.value === 'number' && i < 3 ? `₹${kpi.value.toLocaleString()}` : kpi.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" placeholder="Search by employee name..."
                                className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                             {['Active', 'Reverted'].map(t => (
                                <button 
                                    key={t} onClick={() => setStatusFilter(t)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === t ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t}
                                </button>
                             ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gross Structure</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statutory Deduct</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Settlement</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && !activeJob ? (
                                <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600 mb-2" /> <p className="text-xs font-bold text-slate-400">Loading Financial Registry...</p></td></tr>
                            ) : filteredSalaries.length === 0 ? (
                                <tr><td colSpan="6" className="py-20 text-center"><FileText className="mx-auto text-slate-200 mb-4" size={48} /> <p className="text-sm font-bold text-slate-400">No {statusFilter.toLowerCase()} records found for this period.</p></td></tr>
                            ) : filteredSalaries.map((sal) => (
                                <React.Fragment key={sal._id}>
                                    <tr className={`hover:bg-slate-50 transition-colors group ${expandedRow === sal._id ? 'bg-indigo-50/30' : ''} ${(sal.status === 'Reverted' || sal.status === 'REVERTED') ? 'opacity-70 bg-rose-50/10' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setExpandedRow(expandedRow === sal._id ? null : sal._id)} className="p-1 hover:bg-white rounded border border-slate-100 transition-all">
                                                    {expandedRow === sal._id ? <ChevronDown size={14} className="text-indigo-600" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                </button>
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-[10px] shadow-inner uppercase tracking-widest">{sal.employee_id?.first_name?.[0]}{sal.employee_id?.last_name?.[0]}</div>
                                                <div>
                                                    <span className="text-[13px] font-black text-slate-900 block tracking-tight leading-none mb-1">{sal.employee_id?.first_name} {sal.employee_id?.last_name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 rounded">{sal.employee_id?.employeeCode}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{sal.employee_id?.designation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs font-black text-slate-900 tracking-tight">₹{sal.grossSalary.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                             <div className="flex items-center gap-2">
                                                 <span className="text-xs font-black text-rose-600 tracking-tight">₹{sal.totalDeductions.toLocaleString()}</span>
                                                 {sal.totalDeductions > (sal.grossSalary * 0.6) && (
                                                     <div className="text-rose-500 cursor-help" title="Unusually high deductions (>60% of gross salary detected)">
                                                         <AlertCircle size={14} />
                                                     </div>
                                                 )}
                                             </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[14px] font-black text-indigo-700 tracking-tight block leading-none mb-1">₹{sal.netPay.toLocaleString()}</span>
                                            <div className="h-1 bg-slate-100 rounded-full w-16 overflow-hidden"><div className={`h-full ${sal.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${sal.status === 'Paid' ? 100 : 0}%` }}></div></div>
                                        </td>
                                        <td className="px-6 py-5 text-[10px] font-black">
                                            <span className={`px-2.5 py-1.5 rounded-lg border uppercase tracking-[0.15em] ${
                                                sal.status === 'Paid' ? 'bg-emerald-600 text-white border-emerald-700' : 
                                                (sal.status === 'Reverted' || sal.status === 'REVERTED') ? 'bg-rose-600 text-white border-rose-700' :
                                                sal.status === 'Partially Paid' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-600 border-slate-300'
                                            }`}>
                                                {sal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            {user?.role === 'HR' && (sal.status === 'Pending' || sal.status === 'Partially Paid') && (
                                                <button 
                                                    onClick={() => setIsPayModalOpen(sal)} 
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-slate-900 rounded-xl transition-all font-black text-[9px] tracking-widest uppercase shadow-lg shadow-emerald-100"
                                                >
                                                    <DollarSign size={12} />
                                                    Process Pay
                                                </button>
                                            )}
                                            {user?.role === 'HR' && (sal.isFrozen && sal.status !== 'Reverted' && sal.status !== 'REVERTED' ? (
                                                <button onClick={() => handleReOpen(sal._id)} className="p-2 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"><RefreshCcw size={16} /></button>
                                            ) : sal.status !== 'Reverted' && sal.status !== 'REVERTED' && (
                                                <button onClick={() => setIsAdjustModalOpen(sal)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-all"><Plus size={16} /></button>
                                            ))}
                                            <button onClick={() => setViewSlip(sal)} className="p-2 bg-white text-slate-500 hover:bg-slate-900 hover:text-white border border-slate-200 rounded-xl transition-all shadow-sm"><FileText size={16} /></button>
                                        </td>
                                    </tr>
                                    <AnimatePresence>
                                        {expandedRow === sal._id && (
                                            <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-50/30">
                                                <td colSpan="6" className="px-16 py-6 border-l-4 border-indigo-600">
                                                    <div className="grid grid-cols-2 gap-12">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><DollarSign size={13} className="text-indigo-500" /> Manual Adjust Logs</h4>
                                                                <span className="text-[10px] font-bold text-slate-400">Audited per Cycle</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {sal.adjustments.length === 0 ? <p className="text-[11px] font-medium text-slate-400 italic">No post-generation corrections logged.</p> : sal.adjustments.map((adj, idx) => (
                                                                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${adj.type === 'Bonus' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{adj.type}</span>
                                                                            <span className="text-[11px] font-bold text-slate-700">{adj.reason}</span>
                                                                        </div>
                                                                        <span className={`text-[12px] font-black ${adj.type === 'Bonus' ? 'text-emerald-600' : 'text-rose-600'}`}>{adj.type === 'Bonus' ? '+' : '-'}₹{adj.amount.toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={13} className="text-amber-500" /> Ledger Audit Trail (v{sal.version}.0)</h4>
                                                            {(sal.status === 'Reverted' || sal.status === 'REVERTED') && sal.rollbackReason && (
                                                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4">
                                                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Rollback Details</p>
                                                                    <p className="text-xs font-bold text-slate-800 mb-2">"{sal.rollbackReason}"</p>
                                                                    <div className="flex justify-between items-center text-[9px] font-black text-rose-400 uppercase tracking-widest">
                                                                        <span>By: System Admin</span>
                                                                        <span>{sal.rolledBackAt ? new Date(sal.rolledBackAt).toLocaleString() : 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                                                <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-50">
                                                                    {sal.auditLog.map((log, idx) => (
                                                                        <div key={idx} className="p-3">
                                                                            <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-black text-indigo-600">{log.action}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(log.timestamp).toLocaleString()}</span></div>
                                                                            <p className="text-[10px] font-bold text-slate-500 leading-tight bg-slate-50/50 p-2 rounded-lg">{log.note}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500">
                                Page <span className="text-indigo-600">{page}</span> of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 px-3 border border-slate-200 rounded-lg text-xs font-black hover:bg-white disabled:opacity-50 transition-all"
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button 
                                        key={i+1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        {i + 1}
                                    </button>
                                )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1 px-3 border border-slate-200 rounded-lg text-xs font-black hover:bg-white disabled:opacity-50 transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rollback Modal */}
            <AnimatePresence>
                {isRollbackModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-rose-100">
                             <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600"><AlertCircle size={32} /></div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">Cycle Rollback</h2>
                                <p className="text-slate-500 text-sm font-medium">This will revert all <b>Pending</b> records in batch <b>{isRollbackModalOpen}</b>. This action is audited and irreversible.</p>
                            </div>
                            <div className="p-8 pt-0">
                                <div className="mb-6">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Rollback</label>
                                    <textarea 
                                        required placeholder="e.g. Incorrect tax settings, revision needed..." rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none"
                                        value={rollbackReason} onChange={(e) => setRollbackReason(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsRollbackModalOpen(false)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest">Abort</button>
                                    <button onClick={handleRollback} disabled={actionLoading} className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Rollback'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Generate Modal (Async Update) */}
            <AnimatePresence>
                {isGenerateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100">
                            <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600"><RefreshCcw size={32} /></div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">Async Payroll Cycle</h2>
                                <p className="text-slate-500 text-sm font-medium">Batch processing for <b>{months[selectedMonth-1]} {selectedYear}</b> will initiate in the background. Compliance rules will be enforced via UTC standardization.</p>
                            </div>
                            <div className="p-8 pt-0">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"><CheckCircle2 size={14} className="text-emerald-500" /> Statutory Safeguards</div>
                                    <ul className="text-[11px] space-y-1.5 font-bold text-slate-600">
                                        <li>✓ 12% PF Automatic Attribution</li>
                                        <li>✓ Idempotency Key Binding</li>
                                        <li>✓ Multi-Pass Performance Scaling</li>
                                    </ul>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsGenerateModalOpen(false)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest">Cancel</button>
                                    <button onClick={handleBatchGenerate} disabled={actionLoading} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Start Job'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reused generic modals (Adjustments, Payment, Payslip) with compliance updates */}
            {/* Payment Modal Update: Masking Bank Details */}
            {/* Payslip Modal Update: Adding Official Seals & Employee Codes */}

            {/* Adjustments Modal */}
            <AnimatePresence>
                {isAdjustModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-100">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Plus size={16} /></div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Post-Generation Correction</h3>
                                </div>
                                <button onClick={() => setIsAdjustModalOpen(null)} className="text-slate-400 hover:text-slate-900 transition-colors"><XCircle size={24} /></button>
                            </div>
                            <form onSubmit={handleAddAdjustment} className="p-8 space-y-5">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Adjustment Type</label>
                                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                            {['Bonus', 'Deduction'].map(t => (
                                                <button 
                                                    key={t} type="button" onClick={() => setAdjForm({...adjForm, type: t})}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${adjForm.type === t ? (t === 'Bonus' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-rose-600 text-white shadow-md shadow-rose-100') : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-1/3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount</label>
                                        <input 
                                            type="number" required placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={adjForm.amount} onChange={(e) => setAdjForm({...adjForm, amount: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Rationale (Mandatory)</label>
                                    <textarea 
                                        required placeholder="e.g. Performance Bonus for Project X, Late penalty override..." rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={adjForm.reason} onChange={(e) => setAdjForm({...adjForm, reason: e.target.value})}
                                    ></textarea>
                                </div>
                                <button 
                                    className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-2"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Commit Adjustment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {isPayModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative border border-slate-100">
                             <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600"><CheckCircle2 size={32} /></div>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">Process Disbursement</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Employee: {isPayModalOpen.employee_id?.first_name} {isPayModalOpen.employee_id?.last_name}</p>
                            </div>
                            <form onSubmit={handleProcessPayment} className="p-8 pt-0 space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Outstanding Net:</span>
                                    <span className="text-xl font-black text-emerald-900">₹{(isPayModalOpen.netPay - isPayModalOpen.paidAmount).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Amount</label>
                                        <input 
                                            type="number" required placeholder="Amount"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black focus:outline-none"
                                            value={payForm.amount} onChange={(e) => setPayForm({...payForm, amount: e.target.value})}
                                            max={isPayModalOpen.netPay - isPayModalOpen.paidAmount}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Method</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm font-black focus:outline-none"
                                            value={payForm.method} onChange={(e) => setPayForm({...payForm, method: e.target.value})}
                                        >
                                            <option>Bank Transfer</option>
                                            <option>Cheque</option>
                                            <option>Cash</option>
                                            <option>UPI</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction ID / Reference</label>
                                    <input 
                                        type="text" required placeholder="e.g. TXN987654321, CHQ#123..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black focus:outline-none"
                                        value={payForm.transactionId} onChange={(e) => setPayForm({...payForm, transactionId: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsPayModalOpen(null)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100">Cancel</button>
                                    <button 
                                        type="submit" disabled={actionLoading}
                                        className="flex-1 py-3.5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Complete Disburse'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Comprehensive Payslip Modal */}
            <AnimatePresence>
                {viewSlip && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative my-auto print:shadow-none print:border-0 border border-slate-100">
                            <div className="absolute top-8 right-8 flex gap-3 print:hidden">
                                <button onClick={() => window.print()} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 shadow-lg shadow-indigo-100 transition-all"><Download size={20} /></button>
                                <button onClick={() => setViewSlip(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm transition-all"><XCircle size={20} /></button>
                            </div>

                            <div className="p-12" id="salary-slip">
                                <div className="flex justify-between items-start mb-12 border-b-2 border-dashed border-slate-100 pb-12">
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="bg-slate-900 p-2.5 rounded-2xl text-white"><Banknote size={24} /></div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">SMTBMS Financial</h2>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee Statement for {months[viewSlip.month-1]} {viewSlip.year}</p>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{viewSlip.employee_id.first_name} {viewSlip.employee_id.last_name}</h3>
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{viewSlip.employee_id.designation} &bull; {viewSlip.employee_id.dept_id?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] mb-4 border border-indigo-100 shadow-sm">Version {viewSlip.version}.0</div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statement ID</p>
                                            <p className="text-sm font-black text-slate-900 uppercase">#OFF-PAY-{viewSlip._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-16 mb-12">
                                    {/* Column 1: Earnings */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-4 h-4 rounded bg-emerald-500"></div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Salary Earnings</h4>
                                        </div>
                                        <div className="space-y-4 border border-slate-50 p-6 rounded-3xl bg-slate-50/30">
                                            {[
                                                { l: 'Basic Pay', v: viewSlip.basicSalary },
                                                { l: 'House Rent (HRA)', v: viewSlip.hra },
                                                { l: 'Allowances', v: viewSlip.allowances || 0 },
                                                ...(viewSlip.adjustments?.filter(a => a.type === 'Bonus').map(a => ({ l: `Adj: ${a.reason}`, v: a.amount })) || [])
                                            ].map((line, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500 uppercase text-[10px] tracking-widest">{line.l}</span>
                                                    <span className="text-slate-900 tracking-tight">₹{line.v.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-base font-black text-slate-900">
                                                <span>Total Earnings</span>
                                                <span>₹{(viewSlip.grossSalary + (viewSlip.adjustments?.filter(a => a.type === 'Bonus').reduce((acc, c) => acc + c.amount, 0) || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Deductions */}
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-4 h-4 rounded bg-rose-500"></div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Compulsory Deductions</h4>
                                        </div>
                                        <div className="space-y-4 border border-slate-50 p-6 rounded-3xl bg-slate-50/30">
                                            {[
                                                { l: 'Provident Fund (PF)', v: viewSlip.pf || 0 },
                                                { l: 'Monthly Tax (TDS)', v: viewSlip.monthlyTax || 0 },
                                                { l: 'Attendance Penalty', v: viewSlip.attendanceDeductions || 0 },
                                                ...(viewSlip.adjustments?.filter(a => a.type === 'Deduction').map(a => ({ l: `Adj: ${a.reason}`, v: a.amount })) || [])
                                            ].map((line, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500 uppercase text-[10px] tracking-widest">{line.l}</span>
                                                    <span className="text-rose-600 tracking-tight">₹{line.v.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-base font-black text-slate-900">
                                                <span>Total Deductions</span>
                                                <span>₹{(viewSlip.totalDeductions + (viewSlip.adjustments?.filter(a => a.type === 'Deduction').reduce((acc, c) => acc + c.amount, 0) || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 text-white p-10 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-8 border-4 border-indigo-500/20 shadow-2xl">
                                    <div className="w-full md:w-auto">
                                        <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Net Payable Amount</p>
                                        <p className="text-5xl font-black tracking-tighter leading-none mb-4">₹{viewSlip.netPay.toLocaleString()}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status:</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${viewSlip.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {viewSlip.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto md:text-right flex flex-col justify-end space-y-4">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 opacity-80">
                                            <div><p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Paid On</p><p className="text-xs font-bold">{viewSlip.paidAt ? new Date(viewSlip.paidAt).toLocaleDateString() : 'N/A'}</p></div>
                                            <div><p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Method</p><p className="text-xs font-bold">{viewSlip.paymentMethod || 'Pending'}</p></div>
                                            <div className="col-span-2"><p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-0.5">Reference ID</p><p className="text-[10px] font-black tracking-widest uppercase">{viewSlip.transactionId || 'AWAITING_SETTLEMENT'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-between items-end border-t border-slate-50 pt-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <Calendar className="text-slate-400" size={20} />
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Attendance Report Summary</p>
                                                <p className="text-xs font-bold text-slate-700">Days Present: {viewSlip.presentDays} | Absences: {viewSlip.absentDays} | Paid Offs: {viewSlip.approvedLeaveDays}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Financial Document strictly for internal circulation. Generated on {new Date(viewSlip.createdAt).toLocaleString()}.</p>
                                    </div>
                                    <div className="text-center opacity-40 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                                        <div className="w-20 h-20 border-4 border-slate-400 rounded-full flex items-center justify-center font-black text-[10px] text-slate-400 uppercase tracking-tighter mx-auto mb-2">SMTBMS<br/>SEALED</div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digitally Verified</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SalarySystem;
