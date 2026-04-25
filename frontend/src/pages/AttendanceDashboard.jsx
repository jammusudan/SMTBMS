import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/api';
import { Clock, LogIn, LogOut, Calendar, CheckCircle, AlertCircle, Loader2, Users, XCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AttendanceDashboard = () => {
    const { user } = useAuth();
    const role = user?.role?.toUpperCase() || '';
    const isAdmin = ['ADMIN', 'SUPER ADMIN', 'HR', 'MANAGER'].includes(role);

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

    // Filter logic for admin view
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, late: 0, absent: 0 });

    useEffect(() => {
        fetchAttendance();
        if (isAdmin) {
            // In a real app, this would fetch ALL attendance for the day
            // Mocking company-wide stats for now
            setAttendanceStats({ present: 124, late: 12, absent: 5 });
        }
    }, [isAdmin]);

    const fetchAttendance = async () => {
        try {
            const { data } = await hrmsService.getAttendance();
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        setActionLoading(true);
        setStatusMessage({ text: '', type: '' });
        try {
            const { data } = await hrmsService.clockIn();
            setStatusMessage({ text: data.message, type: 'success' });
            fetchAttendance();
        } catch (error) {
            setStatusMessage({ text: error.response?.data?.message || 'Clock-in failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        setStatusMessage({ text: '', type: '' });
        try {
            const { data } = await hrmsService.clockOut();
            setStatusMessage({ text: data.message, type: 'success' });
            fetchAttendance();
        } catch (error) {
            setStatusMessage({ text: error.response?.data?.message || 'Clock-out failed', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    // Check if clocked in today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = Array.isArray(history) ? history.find(h => h.date && h.date.split('T')[0] === todayStr) : null;

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-white">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-emerald-100 text-emerald-700 text-[13px] font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none">Real-time Sync</span>
                        <span className="text-slate-400 text-base font-bold">| {isAdmin ? 'Enterprise Oversight' : 'Personal Attendance'}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4 italic opacity-90">
                        Attendance Intelligence
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Management Stats (If Admin) or Personal Status */}
                <div className="lg:col-span-3 space-y-8">
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:bg-white transition-all">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Currently Present</p>
                                <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">{attendanceStats.present}</h3>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Users size={12} /> Live Personnel
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:bg-white transition-all">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Tardy Arrivals</p>
                                <h3 className="text-4xl font-black text-amber-500 tracking-tighter">{attendanceStats.late}</h3>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Clock size={12} /> Post-Shift Start
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:bg-white transition-all">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Unofficially Absent</p>
                                <h3 className="text-4xl font-black text-rose-500 tracking-tighter">{attendanceStats.absent}</h3>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <XCircle size={12} /> Unrecorded Today
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal History Table (Re-styled Formal) */}
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">{isAdmin ? 'Company-wide Records' : 'Attendance History'}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-50">
                                        <th className="px-8 py-4">Date / Personnel</th>
                                        <th className="px-8 py-4">Clock In</th>
                                        <th className="px-8 py-4">Clock Out</th>
                                        <th className="px-8 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-600" /></td></tr>
                                    ) : history.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-slate-900">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                                {isAdmin && (
                                                    <div className="mt-1 flex flex-col">
                                                        <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">
                                                            {record.first_name} {record.last_name}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                            {record.department || 'General'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-slate-600 font-bold">{record.clock_in}</td>
                                            <td className="px-8 py-5 text-slate-600 font-bold">{record.clock_out || '--:--:--'}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                    record.status === 'Present' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Personal Actions (Compact) */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h3 className="text-xl font-black mb-1 italic">Duty Console</h3>
                        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-8">Personal Time Tracking</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleClockIn}
                                disabled={todayRecord || actionLoading}
                                className="w-full bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-900 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                            >
                                {actionLoading ? <Loader2 className="animate-spin text-slate-400" /> : <LogIn size={16} />}
                                {todayRecord ? 'Shift Started' : 'Record Entry'}
                            </button>
                            <button 
                                onClick={handleClockOut}
                                disabled={!todayRecord || todayRecord.clock_out || actionLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin text-indigo-200" /> : <LogOut size={16} />}
                                {todayRecord?.clock_out ? 'Shift Ended' : 'Record Exit'}
                            </button>
                        </div>

                        {todayRecord && (
                            <div className="mt-8 pt-8 border-t border-white/10 space-y-3 font-bold text-[10px] tracking-tight text-white/50 uppercase">
                                <div className="flex justify-between items-center">
                                    <span>Entry Logged</span>
                                    <span className="text-white">{todayRecord.clock_in}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Exit Logged</span>
                                    <span className="text-white">{todayRecord.clock_out || 'Pending'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">System Identity</p>
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-700 shadow-sm">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 leading-none truncate uppercase tracking-tighter">{user.username}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceDashboard;
