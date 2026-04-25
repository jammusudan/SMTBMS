import React, { useState, useEffect } from 'react';
import { salaryService } from '../services/api';
import { Banknote, Loader2, Clock, CheckCircle2, XCircle, Download, Calendar, Filter, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeSalary = () => {
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewSlip, setViewSlip] = useState(null);
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('');

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchSalaries();
    }, [page, selectedYear, selectedMonth]);

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const { data } = await salaryService.getSalaries({ 
                page, 
                limit: 6,
                year: selectedYear,
                month: selectedMonth 
            });
            setSalaries(data.salaries);
            setTotalPages(data.pages);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id) => {
        try {
            // 1. Log the download attempt
            await salaryService.logDownload(id);
            // 2. Trigger Print (which simulates PDF download)
            window.print();
        } catch (error) {
            console.error('Logging failed:', error);
            window.print(); // Proceed anyway
        }
    };

    const handleViewSlip = async (id) => {
        try {
            const { data } = await salaryService.getById(id);
            setViewSlip(data);
        } catch (error) {
            alert('Could not fetch slip details');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'Partially Paid': return 'text-indigo-700 bg-indigo-50 border-indigo-100';
            default: return 'text-amber-700 bg-amber-50 border-amber-100';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen bg-[#F9FAFB]">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Banknote size={24} /></div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Salary</h1>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Securely view and download your monthly payslips.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm overflow-hidden">
                        <div className="flex items-center px-3 border-r border-slate-100 text-slate-400">
                            <Calendar size={14} />
                        </div>
                        <select 
                            value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs font-bold text-slate-600 py-2 px-3 focus:outline-none hover:bg-slate-50 transition-colors"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select 
                            value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs font-bold text-slate-600 py-2 px-3 focus:outline-none hover:bg-slate-50 transition-colors border-l border-slate-100"
                        >
                            <option value="">All Months</option>
                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {/* List / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-slate-100 shadow-sm"></div>
                    ))
                ) : salaries.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <Clock className="text-slate-300" size={48} strokeWidth={1} />
                        </div>
                        <p className="text-slate-400 font-bold text-lg">No salary records found for this period.</p>
                        <p className="text-slate-400 text-sm">Select a different month or year to browse.</p>
                    </div>
                ) : (
                    salaries.map((sal, index) => (
                        <motion.div 
                            key={sal._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all border-b-4 border-b-transparent hover:border-b-indigo-500 overflow-hidden relative group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase">
                                        {months[sal.month - 1]} {sal.year}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pay Period</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(sal.status)}`}>
                                    {sal.status}
                                </span>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Net Pay</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tight">₹{Math.trunc(sal.netPay).toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gross</span>
                                    <span className="text-xs font-black text-slate-600 tracking-tight">₹{Math.trunc(sal.grossSalary).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleViewSlip(sal._id)}
                                    className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-indigo-600 hover:bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Info size={14} /> Details
                                </button>
                                <button 
                                    onClick={() => handleViewSlip(sal._id)}
                                    className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
                                >
                                    <Download size={14} /> Download
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`p-2 rounded-xl transition-all ${page === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i} onClick={() => setPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className={`p-2 rounded-xl transition-all ${page === totalPages ? 'text-slate-300' : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Salary Slip Modal */}
            <AnimatePresence>
                {viewSlip && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl relative my-auto"
                        >
                            {/* Controls */}
                            <div className="absolute top-6 right-6 flex gap-2 print:hidden z-10">
                                <button 
                                    onClick={() => handleDownload(viewSlip._id)}
                                    className="p-2.5 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm" title="Print Slip"
                                >
                                    <Download size={18} />
                                </button>
                                <button 
                                    onClick={() => setViewSlip(null)} 
                                    className="p-2.5 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            <div className="p-8 md:p-12" id="payslip-to-print">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-10 border-b border-slate-100 gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="bg-indigo-600 p-2 rounded-lg text-white"><Banknote size={20} /></div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">SMTBMS ENTERPRISE</h2>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Confidential Payslip</p>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{viewSlip.employee_id.first_name} {viewSlip.employee_id.last_name}</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{viewSlip.employee_id.designation} &bull; {viewSlip.employee_id.dept_id?.name}</p>
                                        </div>
                                    </div>
                                    <div className="md:text-right">
                                        <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border ${getStatusStyle(viewSlip.status)}`}>
                                            {viewSlip.status}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pay Period</p>
                                        <p className="text-lg font-black text-slate-900 uppercase leading-none">{months[viewSlip.month - 1]} {viewSlip.year}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-indigo-50 px-2 py-1 rounded-md inline-block">Earnings</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Basic Salary</span>
                                                <span className="text-slate-900 font-black">₹{viewSlip.basicSalary.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>House Rent Allowance (HRA)</span>
                                                <span className="text-slate-900 font-black">₹{viewSlip.hra.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Other Allowances</span>
                                                <span className="text-slate-900 font-black">₹{viewSlip.allowances.toLocaleString()}</span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-50 flex justify-between text-xs font-black text-indigo-600">
                                                <span className="uppercase tracking-widest">Gross Earnings</span>
                                                <span className="text-sm">₹{viewSlip.grossSalary.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[9px] font-black text-rose-600 uppercase tracking-[0.3em] bg-rose-50 px-2 py-1 rounded-md inline-block">Deductions</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Provident Fund (PF)</span>
                                                <span className="text-slate-900 font-black">₹{viewSlip.pf.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-slate-500">
                                                <span>Income Tax (TDS)</span>
                                                <span className="text-slate-900 font-black">₹{viewSlip.monthlyTax.toLocaleString()}</span>
                                            </div>
                                            {(viewSlip.attendanceDeductions > 0 || viewSlip.others > 0) && (
                                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                                    <span>Other Deductions (Incl. Attendance)</span>
                                                    <span className="text-rose-600 font-black">₹{(viewSlip.attendanceDeductions + viewSlip.others).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-slate-50 flex justify-between text-xs font-black text-rose-600">
                                                <span className="uppercase tracking-widest">Total Deductions</span>
                                                <span className="text-sm">₹{viewSlip.totalDeductions.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 text-white p-7 rounded-[24px] flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-xl shadow-indigo-100">
                                    <div className="relative z-10">
                                        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">Net Amount Disbursed</p>
                                        <p className="text-4xl font-black tracking-tighter text-indigo-400">₹{Math.trunc(viewSlip.netPay).toLocaleString()}</p>
                                    </div>
                                    <div className="md:text-right relative z-10">
                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Digital Signature Hash</p>
                                        <p className="text-[9px] font-bold opacity-60 tracking-wider truncate max-w-[150px] uppercase font-mono">{viewSlip._id}</p>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1">Verified Document</p>
                                    </div>
                                    {/* Abstract Decor */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
                                </div>

                                <div className="mt-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    * This document was generated on {new Date().toLocaleString()} and is digitally signed by SMTBMS HR.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Settings (HIDDEN ON SCREEN) */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #payslip-to-print, #payslip-to-print * { visibility: visible; }
                    #payslip-to-print { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 0;
                        margin: 0;
                        box-shadow: none;
                        border: none;
                    }
                    .fixed { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default EmployeeSalary;
