import React, { useState, useEffect } from 'react';
import { dashboardService, hrmsService, notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { taskService } from '../services/api';
import { 
    Clock, Calendar, CheckCircle, Target, Loader2, Bell, 
    ChevronRight, AlertCircle, Coffee, Activity, 
    ClipboardList, Megaphone, Wallet, Umbrella, 
    TrendingUp, ArrowUpRight, Download, Eye, ShieldCheck,
    Plus, LayoutGrid, Zap, Info, MoreHorizontal,
    Star, Timer, CheckSquare, ListTodo, Play, Check, AlertTriangle, IndianRupee
} from 'lucide-react';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clocking, setClocking] = useState(false);
    const [liveTime, setLiveTime] = useState(new Date());
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchAnnouncements();
        const timer = setInterval(() => setLiveTime(new Date()), 1000); 
        return () => clearInterval(timer);
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await notificationService.getLatest();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const fetchData = async () => {
        try {
            const { data } = await dashboardService.getEmployeeStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch employee stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockAction = async () => {
        setClocking(true);
        try {
            if (stats?.today?.status === 'Not Clocked In') {
                await hrmsService.clockIn();
            } else if (['Present', 'Late', 'Half Day'].includes(stats?.today?.status)) {
                await hrmsService.clockOut();
            }
            await fetchData(); 
        } catch (error) {
            console.error('Clock action failed:', error.response?.data?.message || error.message);
        } finally {
            setClocking(false);
        }
    };

    const calculateActiveHours = () => {
        if (!stats?.today?.clock_in) return '00:00:00';
        const start = new Date(stats.today.clock_in);
        const end = stats.today.clock_out ? new Date(stats.today.clock_out) : liveTime;
        const diffMs = end - start;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        return `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
    };

    const formatShortTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="p-8 flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">Syncing Control Center...</p>
                </div>
            </div>
        );
    }

    const { profile, today, leaves, tasks, salary } = stats || {};

    // Logic for Task Next Action
    const priorityTasks = tasks?.priority_tasks || [];
    const nextActionTask = [...priorityTasks]
        .filter(t => t.status !== 'Completed' && t.status !== 'Approved')
        .sort((a, b) => {
            const pMap = { High: 3, Medium: 2, Low: 1 };
            if (pMap[b.priority] !== pMap[a.priority]) return pMap[b.priority] - pMap[a.priority];
            return new Date(a.due_date) - new Date(b.due_date);
        })[0];

    const getDeadlineStatus = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = (due - now) / (1000 * 60 * 60 * 24);
        if (diff < 0) return { label: 'Overdue', color: 'text-rose-600 bg-rose-50 border-rose-100' };
        if (diff < 1) return { label: 'Due Today', color: 'text-amber-600 bg-amber-50 border-amber-100' };
        return { label: 'Upcoming', color: 'text-slate-400 bg-slate-50 border-slate-100' };
    };

    const handleUpdateTask = async (id, status) => {
        try {
            await taskService.updateTaskStatus(id, status);
            if (status === 'Completed') {
                navigate('/audit');
            } else {
                fetchData();
            }
        } catch (error) {
            alert('Action failed. Ensure sequential workflow.');
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#f8fafc] text-slate-900">
            
            {/* 1. NEXT ACTION PRIORITY BANNER */}
            {nextActionTask && (
                <div className={`mb-8 p-6 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative ${
                    new Date(nextActionTask.due_date) < new Date() ? 'bg-rose-600 border-rose-400 text-white' : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Zap size={28} className={new Date(nextActionTask.due_date) < new Date() ? 'animate-pulse text-white' : 'text-indigo-400'} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Strategic Priority</p>
                            <h2 className="text-xl font-black tracking-tight">NEXT ACTION: {nextActionTask.title}</h2>
                            <p className="text-xs font-bold opacity-80 mt-1">
                                Complete before {new Date(nextActionTask.due_date).toLocaleDateString()} • {getDeadlineStatus(nextActionTask.due_date).label}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/tasks')}
                        className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl ${
                            new Date(nextActionTask.due_date) < new Date() ? 'bg-white text-rose-600 hover:bg-rose-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        Execute Now
                    </button>
                    {new Date(nextActionTask.due_date) < new Date() && (
                        <div className="absolute top-0 right-0 p-2 bg-white text-rose-600 font-black text-[10px] rounded-bl-2xl">🚨 OVERDUE</div>
                    )}
                </div>
            )}

            {/* 2. OPERATIONAL STATUS PANEL */}
            <div className="bg-white rounded-[40px] p-8 mb-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-center">
                    {/* Attendance & Session Control */}
                    <div className="xl:col-span-2 flex flex-col md:flex-row items-center gap-8 border-r border-slate-100 pr-8">
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Operational Session</h2>
                            <div className="text-5xl font-black tabular-nums tracking-tighter text-slate-900">
                                {calculateActiveHours()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button 
                                onClick={handleClockAction}
                                disabled={clocking || today?.status === 'Clocked Out'}
                                className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2
                                    ${today?.status === 'Not Clocked In' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100' : 
                                      (['Present', 'Late', 'Half Day'].includes(today?.status)) ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-100' : 
                                      'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {clocking ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                {today?.status === 'Not Clocked In' ? 'Start Shift' : 'End Shift'}
                            </button>
                            <div className="flex items-center gap-2 justify-center">
                                <span className={`w-2 h-2 rounded-full ${today?.status === 'Not Clocked In' ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`}></span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{today?.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Task Execution Pulse */}
                    <div className="flex items-center justify-around xl:justify-center gap-12 xl:col-span-2">
                        <div className="text-center group cursor-pointer" onClick={() => navigate('/tasks')}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Pending Mission</p>
                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{tasks?.metrics?.pending || 0}</p>
                            <div className="flex items-center gap-2 justify-center mt-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Execute Tasks</span>
                                <ChevronRight size={12} className="text-indigo-400" />
                            </div>
                        </div>
                        <div className="h-16 w-px bg-slate-100 hidden sm:block"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Complete</p>
                            <p className="text-5xl font-black text-emerald-500 tracking-tighter">{tasks?.metrics?.completed || 0}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{tasks?.metrics?.total || 0} Missions Assigned</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* QUICK ACTIONS & FIELD OPS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div 
                    onClick={() => navigate('/crm/field-audit')}
                    className="group bg-indigo-600 p-8 rounded-[40px] border border-indigo-500 shadow-xl shadow-indigo-100 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">FIELD AUDIT</h3>
                            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mt-1">Submit Field Report</p>
                        </div>
                    </div>
                    <div className="p-3 bg-white/10 rounded-full text-white group-hover:bg-white group-hover:text-indigo-600 transition-all">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/tasks')}
                    className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-100 transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <ClipboardList size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">MY TASKS</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Mission Control</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/salary')}
                    className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-100 transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <IndianRupee size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">PAYSLIPS</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Financial Portfolio</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-full text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ArrowUpRight size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 2. TASK EXECUTION ENGINE & LEAVE OVERVIEW */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* ACTIVE TASK ENGINE */}
                    <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <Zap className="text-indigo-600" size={24} />
                                    Active Task Engine
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time terminal for mission execution</p>
                            </div>
                            <button onClick={() => navigate('/tasks')} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100">Task List</button>
                        </div>

                        <div className="space-y-6">
                            {tasks?.priority_tasks?.length > 0 ? (
                                tasks.priority_tasks.map(task => {
                                    const progress = task.status === 'Completed' ? 100 : (task.status === 'In Progress' ? 50 : 25);
                                    const deadline = getDeadlineStatus(task.due_date);
                                    
                                    return (
                                        <div key={task._id} className="p-8 rounded-[36px] border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-100/50 transition-all group">
                                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                            task.priority === 'High' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                            task.priority === 'Medium' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                                                        }`}>
                                                            Priority: {task.priority || 'Normal'}
                                                        </span>
                                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${deadline.color}`}>
                                                            {deadline.label}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-slate-900 text-xl group-hover:text-indigo-600 transition-colors tracking-tight uppercase leading-none">{task.title}</h4>
                                                    <div className="flex items-center gap-6 mt-4 opacity-50">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Due {new Date(task.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Target size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Ref: #{task._id.substring(18)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                                    <div className="text-right flex flex-col items-end">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engine Status</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                                                {task.status === 'Approved' ? '100%' : task.status === 'Completed' ? '75%' : task.status === 'In Progress' ? '50%' : '25%'}
                                                            </div>
                                                            <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                                                <div 
                                                                    className={`h-full transition-all duration-700 ${
                                                                        task.status === 'Approved' ? 'bg-emerald-500' : 
                                                                        task.status === 'Completed' ? 'bg-amber-400' : 
                                                                        task.status === 'In Progress' ? 'bg-blue-400 animate-pulse' : 'bg-slate-300'
                                                                    }`}
                                                                    style={{ width: task.status === 'Approved' ? '100%' : task.status === 'Completed' ? '75%' : task.status === 'In Progress' ? '50%' : '25%' }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                                            task.status === 'Approved' ? 'text-emerald-600' : 
                                                            task.status === 'Completed' ? 'text-amber-600' : 
                                                            task.status === 'In Progress' ? 'text-blue-600' : 'text-slate-400'
                                                        }`}>
                                                            {task.status === 'Assigned' ? 'READY TO START' : task.status.toUpperCase()}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {task.status === 'Assigned' && (
                                                            <button 
                                                                onClick={() => handleUpdateTask(task._id, 'In Progress')}
                                                                className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                                                            >
                                                                <Play size={14} fill="currentColor" /> Start Task
                                                            </button>
                                                        )}
                                                        {task.status === 'In Progress' && (
                                                            <button 
                                                                onClick={() => handleUpdateTask(task._id, 'Completed')}
                                                                className="px-8 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-amber-100"
                                                            >
                                                                <Check size={16} strokeWidth={3} /> Complete Task
                                                            </button>
                                                        )}
                                                        {task.status === 'Completed' && (
                                                            <div className="px-8 flex flex-col items-center">
                                                                <Clock size={20} className="text-amber-500 animate-pulse mb-1" />
                                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Awaiting Seal</span>
                                                            </div>
                                                        )}
                                                        {task.status === 'Approved' && (
                                                            <div className="px-8 flex flex-col items-center">
                                                                <ShieldCheck size={20} className="text-emerald-500 mb-1" />
                                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 group">
                                    <div className="p-6 bg-white rounded-full mb-6 shadow-sm group-hover:scale-110 transition-transform">
                                        <CheckCircle size={40} className="text-emerald-500" />
                                    </div>
                                    <p className="text-lg font-black text-slate-800 uppercase tracking-tight">System Optimized</p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">All assigned missions are currently sealed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. LEAVE OVERVIEW & SALARY MODULE & ACTIVITY FEED */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* LEAVE OVERVIEW */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-8">
                            <TrendingUp className="text-indigo-600" size={20} />
                            Annual Leave Balance
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-100">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Casual</p>
                                <p className="text-2xl font-black text-slate-900">{leaves?.balances?.casual || 0}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Days Left</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100">
                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Sick</p>
                                <p className="text-2xl font-black text-slate-900">{leaves?.balances?.sick || 0}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Days Left</p>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests</span>
                                <span className="text-xs font-black text-rose-500">{leaves?.pending || 0}</span>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg"><Info size={14} className="text-indigo-600" /></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Last Approved</p>
                                    <p className="text-[11px] font-black text-slate-800">{leaves?.last_approved ? `${leaves.last_approved.leave_type} (${new Date(leaves.last_approved.start_date).toLocaleDateString()})` : 'No history found'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MY SALARY MODULE */}
                    <div className="bg-indigo-600 text-white rounded-[32px] p-8 shadow-xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet size={120} strokeWidth={1} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">My Salary</p>
                                    <h3 className="text-2xl font-black tracking-tight">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-xl border border-white/10 uppercase font-black text-[9px] tracking-widest">{salary?.status || 'Active'}</div>
                            </div>
                            <div className="mb-10">
                                <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold mb-1">Expected Payout</p>
                                <p className="text-5xl font-black tabular-nums">₹ {salary?.net_pay?.toLocaleString() || '0'}<span className="text-lg opacity-40">.00</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => navigate('/salary')} className="py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all">
                                    <Eye size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Full Payslip</span>
                                </button>
                                <button className="py-4 bg-white text-indigo-600 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-indigo-900/20 active:scale-[0.98]">
                                    <Download size={18} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Download PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SMART NOTIFICATIONS – ACTIVITY FEED */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col max-h-[600px]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-t-[32px]">
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-[0.05em]">
                                <Megaphone className="text-indigo-600" size={18} />
                                Intelligence Feed
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Mark all read</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {announcementsLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-300">
                                    <Loader2 className="animate-spin" size={24} />
                                    <p className="text-[10px] font-medium uppercase tracking-widest">Syncing Feed...</p>
                                </div>
                            ) : announcements.length > 0 ? (
                                announcements.map(anno => (
                                    <div key={anno.id} className={`p-5 rounded-[28px] border transition-all ${!anno.isRead ? 'bg-indigo-50/20 border-indigo-100 shadow-sm' : 'bg-white border-slate-100 opacity-60'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                                anno.type === 'Urgent' ? 'bg-rose-500 text-white shadow-sm shadow-rose-100' :
                                                anno.type === 'Success' ? 'bg-emerald-500 text-white' :
                                                'bg-indigo-600 text-white'
                                            }`}>
                                                {anno.type || 'INFO'}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(anno.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 leading-tight mb-1.5">{anno.title}</h4>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{anno.message}</p>
                                        {!anno.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(anno.id)}
                                                className="mt-3 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                Dismiss Notification
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center justify-center text-slate-300 h-full gap-5">
                                    <div className="p-5 bg-slate-50 rounded-full border border-slate-100">
                                        <Coffee size={32} strokeWidth={1} className="opacity-50" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Feed is Empty</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enjoy the quiet workspace!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100">
                            <button 
                                onClick={() => navigate('/announcements')}
                                className="w-full py-4 text-[10px] font-black text-indigo-600 hover:bg-slate-50 rounded-2xl uppercase tracking-widest transition-all border border-transparent hover:border-slate-100"
                            >
                                Bulleting Board History
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;


