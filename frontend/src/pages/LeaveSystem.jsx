import React, { useState, useEffect, useMemo } from 'react';
import { hrmsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    CalendarDays, Plus, CheckCircle2, XCircle, Clock, 
    MessageSquare, Loader2, Send, Briefcase, Home, 
    Baby, List, Grid, ChevronLeft, ChevronRight, UserCheck, Heart, Church, Flame, Users,
    Search, Filter, Trash2, CheckCircle, Ban, History, Info, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveSystem = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Filters State
    const [filters, setFilters] = useState({
        status: 'All',
        type: 'All',
        search: ''
    });

    const [formData, setFormData] = useState({
        type: 'Sick Leave',
        fromDate: '',
        toDate: '',
        reason: '',
        isHalfDay: false,
        halfDayType: 'Morning'
    });

    useEffect(() => {
        fetchLeaves();
    }, [filters.status, filters.type]); // Refresh on major filters

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params = {
                status: filters.status,
                type: filters.type,
                search: filters.search
            };
            const { data } = await hrmsService.getLeaves(params);
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await hrmsService.applyLeave(formData);
            setIsModalOpen(false);
            fetchLeaves();
            setFormData({ type: 'Sick Leave', fromDate: '', toDate: '', reason: '', isHalfDay: false, halfDayType: 'Morning' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error applying for leave');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            if (action === 'approve') await hrmsService.approveLeave(id);
            else if (action === 'reject') await hrmsService.rejectLeave(id);
            else if (action === 'cancel') await hrmsService.cancelLeave(id);
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || `Error during ${action}`);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Perform ${action} on ${selectedIds.length} items?`)) return;
        try {
            await hrmsService.bulkUpdateLeaves(selectedIds, action === 'approve' ? 'Approved' : 'Rejected');
            setSelectedIds([]);
            fetchLeaves();
        } catch (error) {
            alert('Bulk update failed');
        }
    };

    const isAdminOrHR = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            pending: leaves.filter(l => l.status === 'Pending').length,
            approvedToday: leaves.filter(l => l.status === 'Approved' && l.reviewedAt?.startsWith(today)).length,
            rejected: leaves.filter(l => l.status === 'Rejected').length,
            total: leaves.length
        };
    }, [leaves]);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Approved': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'Rejected': return 'text-rose-700 bg-rose-50 border-rose-100';
            case 'Cancelled': return 'text-slate-500 bg-slate-50 border-slate-200';
            default: return 'text-amber-700 bg-amber-50 border-amber-100';
        }
    };

    // Calendar logic
    const currentMonth = new Date();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const renderCalendar = () => {
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-20 bg-slate-50/30 border border-slate-100"></div>);
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
            const dateStr = date.toISOString().split('T')[0];
            const leavesOnDay = leaves.filter(l => {
                const start = new Date(l.fromDate).toISOString().split('T')[0];
                const end = new Date(l.toDate).toISOString().split('T')[0];
                return dateStr >= start && dateStr <= end && l.status === 'Approved';
            });

            days.push(
                <div key={d} className="h-20 bg-white border border-slate-100 p-1.5 relative group hover:bg-slate-50 transition-colors">
                    <span className="text-[9px] font-black text-slate-300">{d}</span>
                    <div className="mt-0.5 space-y-0.5 overflow-y-auto max-h-[50px] custom-scrollbar">
                        {leavesOnDay.map((l, idx) => (
                            <div key={idx} className={`text-[8px] px-1 py-0.5 rounded font-black truncate ${leavesOnDay.length > 2 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-indigo-50 text-indigo-700'}`}>
                                {l.employeeName}
                            </div>
                        ))}
                    </div>
                    {leavesOnDay.length > 2 && (
                        <div className="absolute top-1 right-1">
                            <AlertCircle size={10} className="text-amber-500 animate-pulse" title="High Overlap" />
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#FDFDFD]">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-[0.2em]">HR Intelligence</span>
                        <span className="text-slate-400 text-xs font-bold">| {isAdminOrHR ? 'Personnel Absence Control' : 'Personal Portfolio'}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Leave Management</h1>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 opacity-70">Decision-Optimized Approval Workflow</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {!isAdminOrHR && (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-3 px-6 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} /> Request Time Off
                        </motion.button>
                    )}
                </div>
            </header>

            {/* Manager KPI Suite */}
            {isAdminOrHR && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'amber' },
                        { label: 'Approved Today', value: stats.approvedToday, icon: CheckCircle2, color: 'emerald' },
                        { label: 'Rejected (All Time)', value: stats.rejected, icon: Ban, color: 'rose' },
                        { label: 'Total Volume', value: stats.total, icon: History, color: 'indigo' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Control Bar */}
                <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/30">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-black transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={14} /> List View
                        </button>
                        <button 
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-black transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Grid size={14} /> Team Calendar
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
                            <input 
                                type="text"
                                placeholder="Search employees..."
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all w-48"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                onKeyDown={(e) => e.key === 'Enter' && fetchLeaves()}
                            />
                        </div>
                        <select 
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        {selectedIds.length > 0 && isAdminOrHR && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                                <button onClick={() => handleBulkAction('approve')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100"><CheckCircle size={14} /> Bulk Approve</button>
                                <button onClick={() => handleBulkAction('reject')} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-100"><Ban size={14} /> Bulk Reject</button>
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'list' ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest text-[9px] font-black text-slate-400">
                                        {isAdminOrHR && (
                                            <th className="px-6 py-4 w-10">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    onChange={(e) => setSelectedIds(e.target.checked ? leaves.map(l => l.id) : [])}
                                                    checked={selectedIds.length === leaves.length && leaves.length > 0}
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4">Employee Details</th>
                                        <th className="px-6 py-4">Leave Context</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4">Status & Logic</th>
                                        <th className="px-6 py-4 text-right">Decision</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center py-20"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                                    ) : leaves.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest text-xs">No records matching filters</td></tr>
                                    ) : leaves.map((leave) => (
                                        <tr key={leave.id} className={`hover:bg-slate-50/50 transition-all ${selectedIds.includes(leave.id) ? 'bg-indigo-50/30' : ''}`}>
                                            {isAdminOrHR && (
                                                <td className="px-6 py-5">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedIds.includes(leave.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedIds([...selectedIds, leave.id]);
                                                            else setSelectedIds(selectedIds.filter(id => id !== leave.id));
                                                        }}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{leave.employeeName}</p>
                                                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{leave.department || 'General'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-700">
                                                        <Info size={12} className="text-slate-300" />
                                                        {leave.leaveType}
                                                        {leave.isHalfDay && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest ml-1">{leave.halfDayType} Half</span>}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold max-w-[180px] break-words line-clamp-1 italic">"{leave.reason}"</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><CalendarDays size={14} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900">{new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</p>
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{leave.days} Day{leave.days > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(leave.status)} w-fit`}>
                                                        {leave.status}
                                                    </span>
                                                    {leave.reviewedBy && (
                                                        <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                            <UserCheck size={10} className="text-indigo-400" />
                                                            {leave.reviewedBy} • {new Date(leave.reviewedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {isAdminOrHR && leave.status === 'Pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleAction(leave.id, 'approve')}
                                                            className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                            title="Approve"
                                                        ><CheckCircle size={16} /></button>
                                                        <button 
                                                            onClick={() => handleAction(leave.id, 'reject')}
                                                            className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                            title="Reject"
                                                        ><Ban size={16} /></button>
                                                    </div>
                                                ) : isAdminOrHR && leave.status === 'Approved' ? (
                                                    <button 
                                                        onClick={() => handleAction(leave.id, 'cancel')}
                                                        className="px-3 py-1 bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                    >Cancel Shift</button>
                                                ) : (
                                                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">{leave.status === 'Pending' ? 'Locked' : 'Processed'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    ) : (
                        <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 bg-slate-50/50">
                            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                <div className="grid grid-cols-7 border-b border-slate-100">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">{d}</div>
                                    ))}
                                    {renderCalendar()}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Application Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl relative"
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Request Time Off</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all"><XCircle size={24} /></button>
                                </div>

                                <form onSubmit={handleApply} className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Leave Category</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400">Half Day?</span>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded-full text-indigo-600 focus:ring-0 cursor-pointer"
                                                    checked={formData.isHalfDay}
                                                    onChange={(e) => setFormData({...formData, isHalfDay: e.target.checked})}
                                                />
                                            </div>
                                        </div>
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 focus:outline-none focus:border-indigo-500 font-bold transition-all shadow-sm text-sm"
                                            value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        >
                                            <option value="Sick Leave">Sick Leave</option>
                                            <option value="Casual Leave">Casual Leave</option>
                                            <option value="Privilege Leave">Privilege Leave (Earned)</option>
                                            <option value="Unpaid Leave">Unpaid Leave</option>
                                        </select>

                                        {formData.isHalfDay && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, halfDayType: 'Morning'})}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.halfDayType === 'Morning' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}
                                                >Morning</button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, halfDayType: 'Afternoon'})}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.halfDayType === 'Afternoon' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}
                                                >Afternoon</button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">From</label>
                                                <input type="date" required className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold" value={formData.fromDate} onChange={(e) => setFormData({...formData, fromDate: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">To</label>
                                                <input type="date" required className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold" value={formData.toDate} onChange={(e) => setFormData({...formData, toDate: e.target.value})} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 px-1">Mandatory Reason</label>
                                            <textarea required rows="3" className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold resize-none" placeholder="Explain the absence requirement..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
                                        </div>
                                    </div>
                                    <button disabled={actionLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-3xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-100">
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={16} /> : <Send size={16} />}
                                        Ship Authorization Request
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeaveSystem;
