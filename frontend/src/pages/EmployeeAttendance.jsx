import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/api';
import { Clock, LogOut, CheckCircle2, Loader2, Calendar, MapPin, Coffee, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeAttendance = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchAttendance();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Live seconds
        return () => clearInterval(timer);
    }, []);

    const fetchAttendance = async () => {
        try {
            const { data } = await hrmsService.getAttendance();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async () => {
        setActionLoading(true);
        try {
            await hrmsService.clockIn();
            await fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Clock-in failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        try {
            await hrmsService.clockOut();
            await fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Clock-out failed');
        } finally {
            setActionLoading(false);
        }
    };

    const todayStr = new Date().toLocaleDateString();
    const todayRecord = history.find(h => new Date(h.date).toLocaleDateString() === todayStr);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');

    if (loading) {
        return (
            <div className="p-8 flex h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto min-h-screen">
            {/* Header Section */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
            >
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-0.5">Attendance</h1>
                <p className="text-slate-500 font-bold tracking-wide flex items-center gap-2 text-xs">
                    <Calendar size={14} className="text-indigo-50" />
                    {formattedDate}
                </p>
            </motion.header>

            {/* Main Timer Display */}
            <div className="flex flex-col items-center justify-center mb-6 relative">
                {/* Visual Circle Backgrounds */}
                <div className="absolute w-[200px] h-[200px] bg-indigo-50/50 rounded-full blur-[60px] -z-10"></div>
                
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-48 h-48 rounded-full bg-white shadow-[0_16px_32px_-8px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center border-[8px] border-slate-50"
                >
                    {/* Progress Ring Ornament */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
                        <circle
                            cx="96" cy="96" r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-indigo-50"
                        />
                        <motion.circle
                            cx="96" cy="96" r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                            strokeLinecap="round"
                            className="text-indigo-600 transition-all duration-1000"
                            strokeDasharray="553"
                            initial={{ strokeDashoffset: 553 }}
                            animate={{ strokeDashoffset: 553 - (currentTime.getSeconds() / 60) * 553 }}
                        />
                    </svg>

                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-0.5">{hours}:{minutes}</h2>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] opacity-70">{seconds} sec</p>
                </motion.div>

                {/* Status Indicator */}
                <AnimatePresence>
                    {todayRecord && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm text-[10px]"
                        >
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span className="font-bold tracking-tight">Active Shift &bull; {new Date(todayRecord.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clocking Actions */}
                <div className="mt-6 w-full max-w-xs px-8">
                    {!todayRecord ? (
                        <button 
                            onClick={handleClockIn}
                            disabled={actionLoading}
                            className="group relative w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-[18px] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                            <span className="text-sm uppercase tracking-widest">Clock In</span>
                        </button>
                    ) : !todayRecord.clock_out ? (
                        <button 
                            onClick={handleClockOut}
                            disabled={actionLoading}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-[18px] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                            <span className="text-sm uppercase tracking-widest">Check Out</span>
                        </button>
                    ) : (
                        <div className="w-full bg-slate-100 text-slate-500 font-black py-3.5 rounded-[18px] flex items-center justify-center gap-2 border-2 border-dashed border-slate-200">
                            <Coffee size={18} />
                            <span className="text-sm uppercase tracking-widest italic">Finished</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-3 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Total Hours</p>
                        <h4 className="text-lg font-black text-slate-900 leading-none">--</h4>
                    </div>
                </div>
                <div className="bg-white p-3 rounded-[20px] border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Location</p>
                        <h4 className="text-lg font-black text-slate-900 leading-none truncate max-w-[100px]">Main Office</h4>
                    </div>
                </div>
            </div>

            {/* History Table Layout */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden pb-2">
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Session History</h3>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border border-slate-100 px-2.5 py-1 rounded-full">30 Days</div>
                </div>
                <div className="px-2">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="text-left px-4 py-3">Date</th>
                                <th className="text-left px-4 py-3">In</th>
                                <th className="text-left px-4 py-3">Out</th>
                                <th className="text-right px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.slice(0, 5).map((record) => (
                                <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900 text-xs text-nowrap">
                                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-600">
                                        {new Date(record.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-600">
                                        {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                            record.status === 'Present' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-amber-700 bg-amber-50 border border-amber-100'
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

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
        </div>
    );
};

export default EmployeeAttendance;
