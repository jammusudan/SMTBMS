import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import { 
    ClipboardList, CheckCircle2, Clock, PlayCircle, 
    AlertCircle, Loader2, Search, Filter, Calendar, 
    ArrowRight, UserCheck, ChevronRight, Briefcase, Target, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await taskService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        setUpdatingId(id);
        try {
            await taskService.updateTaskStatus(id, status);
            await fetchTasks();
        } catch (error) {
            alert('Status update failed. Ensure you are following the sequence: Assigned -> In Progress -> Completed.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getUrgency = (dueDate, status) => {
        if (status === 'Approved') return 'Verified';
        const now = new Date();
        const due = new Date(dueDate);
        const diffHrs = (due - now) / (1000 * 60 * 60);

        if (diffHrs < 0) return 'Overdue';
        if (diffHrs <= 24) return 'Urgent';
        return 'Active';
    };

    const filteredTasks = tasks.filter(t => {
        if (filter === 'All') return true;
        return t.status === filter;
    });

    if (loading) return <div className="p-8 flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mission Queue</h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Operational Task Execution for Active Deals</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    {['All', 'Assigned', 'In Progress', 'Completed'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f ? 'bg-slate-900 text-white shadow-lg shadow-slate-100' : 'text-slate-400 hover:text-slate-900'}
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-[32px] border border-slate-100 p-24 text-center"
                        >
                            <ShieldCheck className="mx-auto text-slate-100 mb-6" size={80} />
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Active Missions</h3>
                        </motion.div>
                    ) : filteredTasks.map((task, idx) => {
                        const urgency = getUrgency(task.due_date, task.status);
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={task._id}
                                className={`bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group
                                    ${task.status === 'Approved' ? 'opacity-50 grayscale' : ''}
                                `}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-2 
                                    ${urgency === 'Overdue' ? 'bg-rose-500' : urgency === 'Urgent' ? 'bg-amber-500' : urgency === 'Verified' ? 'bg-emerald-500' : 'bg-indigo-500'}
                                `} />

                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-4 mb-3">
                                        <h3 className="text-xl font-black text-slate-900">{task.title}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                            ${urgency === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                              urgency === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                              urgency === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                              'bg-indigo-50 text-indigo-600 border-indigo-100'}
                                        `}>
                                            {urgency}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={16} className="text-indigo-400" />
                                            <span className="text-[12px] font-black text-slate-700">{task.dealId?.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target size={16} className="text-slate-300" />
                                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{task.customerId?.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Deadline {new Date(task.due_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={14} className="text-slate-400" />
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">Priority: 
                                                <span className={task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-slate-500'}>{task.priority}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                    {task.status === 'Assigned' && (
                                        <button 
                                            disabled={updatingId === task._id}
                                            onClick={() => handleUpdateStatus(task._id, 'In Progress')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-slate-900 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 transition-all font-outfit"
                                        >
                                            {updatingId === task._id ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={18} />}
                                            Start Task
                                        </button>
                                    )}
                                    {task.status === 'In Progress' && (
                                        <button 
                                            disabled={updatingId === task._id}
                                            onClick={() => handleUpdateStatus(task._id, 'Completed')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-amber-600 text-white hover:bg-slate-900 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-100 transition-all font-outfit"
                                        >
                                            {updatingId === task._id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={18} />}
                                            Complete Task
                                        </button>
                                    )}
                                    {task.status === 'Completed' && (
                                        <div className="flex flex-col items-center gap-1 px-8 text-amber-500">
                                            <Clock size={24} className="animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Waiting for Manager Approval</span>
                                        </div>
                                    )}
                                    {task.status === 'Approved' && (
                                        <div className="flex flex-col items-center gap-1 px-8 text-emerald-500">
                                            <ShieldCheck size={24} />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Task Approved</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <footer className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center text-slate-400">
                <div className="flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Self-assignment is restricted by Management</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Employee Portal v2.0</p>
            </footer>
        </div>
    );
};

export default EmployeeTasks;
