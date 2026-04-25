import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService, hrmsService, crmService } from '../services/api';
import { 
    ClipboardList, Plus, Loader2, XCircle, Search, User, 
    Clock, CheckCircle2, ShieldCheck, AlertTriangle, 
    Target, Briefcase, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeTasks from './EmployeeTasks';

const TaskSystem = () => {
    const { user } = useAuth();
    const isAdminMode = user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'MANAGER';

    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [deals, setDeals] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        due_date: '',
        dealId: '',
        customerId: '',
        taskType: 'Other',
        priority: 'Medium'
    });

    useEffect(() => {
        if (isAdminMode) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [isAdminMode]);

    const fetchData = async () => {
        try {
            const [tasksRes, empRes, dealsRes, custRes] = await Promise.all([
                taskService.getTasks(),
                hrmsService.getEmployees({ operationalOnly: true }),
                crmService.getDeals(),
                crmService.getCustomers()
            ]);
            setTasks(tasksRes.data);
            setEmployees(empRes.data);
            setDeals(dealsRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Task fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await taskService.createTask(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ title: '', description: '', assignedTo: '', due_date: '', dealId: '', customerId: '', taskType: 'Other', priority: 'Medium' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error assigning task');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this task completion?')) return;
        try {
            const res = await taskService.approveTask(id);
            fetchData();
            alert(res.data?.message || 'Mission Approved and Sealed.');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Connection Error: Failed to approve task';
            console.error('Approve Error Triggered:', errorMsg);
            alert(`🚨 APPROVAL FAILED: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently revoke this task?')) return;
        try {
            await taskService.deleteTask(id);
            fetchData();
        } catch (error) {
            alert('Failed to delete task');
        }
    };

    if (!isAdminMode) return <EmployeeTasks />;
    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;

    // Metrics Calculation
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status !== 'Approved').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        overdue: tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'Approved').length
    };

    const getStatusStyle = (status, dueDate) => {
        const isOverdue = new Date(dueDate) < new Date() && status !== 'Approved';
        if (isOverdue) return 'text-rose-700 bg-rose-50 border-rose-100';
        switch (status) {
            case 'Approved': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'Completed': return 'text-amber-700 bg-amber-50 border-amber-100';
            case 'In Progress': return 'text-blue-700 bg-blue-50 border-blue-100';
            default: return 'text-slate-500 bg-slate-50 border-slate-100';
        }
    };

    const handleReject = async (id) => {
        const remarks = window.prompt('Enter reason for rejection:');
        if (remarks === null) return;
        setActionLoading(true);
        try {
            await taskService.updateTaskStatus(id, 'Rejected', remarks);
            fetchData();
        } catch (error) {
            alert('Rejection failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <header className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                        Strategic Dispatch <ShieldCheck className="text-indigo-600" size={32} />
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">Mission Critical Task Control & Deal Execution Hub</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-4 px-8 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                    <Plus size={18} /> New Dispatch
                </button>
            </header>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Missions', val: stats.total, color: 'slate', icon: ClipboardList },
                    { label: 'Pending Action', val: stats.pending, color: 'amber', icon: Clock },
                    { label: 'Awaiting Seal', val: stats.completed, color: 'sky', icon: Target },
                    { label: 'Overdue Ops', val: stats.overdue, color: 'rose', icon: AlertTriangle }
                ].map((s, idx) => (
                    <div key={idx} className={`bg-white p-6 rounded-[24px] border border-${s.color}-100 shadow-sm flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                            <h3 className={`text-3xl font-black text-${s.color}-600`}>{s.val}</h3>
                        </div>
                        <div className={`p-3 bg-${s.color}-50 rounded-xl text-${s.color}-600`}>
                            <s.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-50 bg-slate-50/30">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task / Objective</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deal Context</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tasks.map((task) => (
                            <tr key={task._id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                                        <span className="text-[15px] font-black text-slate-900">{task.title}</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">{task.taskType}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black text-slate-700 flex items-center gap-1.5"><Briefcase size={14} className="text-indigo-400" /> {task.dealId?.title}</span>
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-1 ml-5">Client: {task.customerId?.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-slate-700 leading-none">{task.assignedTo?.first_name} {task.assignedTo?.last_name}</p>
                                            <p className="text-[10px] font-bold text-rose-500 uppercase mt-1 tracking-tighter italic">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${getStatusStyle(task.status, task.due_date)}`}>
                                            {new Date(task.due_date) < new Date() && task.status !== 'Approved' ? 'OVERDUE' : task.status}
                                        </span>
                                        {task.stockUpdated && (
                                            <span className="flex items-center gap-1 text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                <Package size={10} /> Stock Updated
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        {task.status === 'Completed' && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleApprove(task._id)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-600 hover:text-white bg-white border border-emerald-100 rounded-xl transition-all shadow-sm"
                                                    title="Verify & Approve"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(task._id)}
                                                    className="p-2 text-amber-600 hover:bg-amber-600 hover:text-white bg-white border border-amber-100 rounded-xl transition-all shadow-sm"
                                                    title="Return for Correction"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(task._id)}
                                            className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white bg-white border border-rose-100 rounded-xl transition-all shadow-sm"
                                            title="Revoke Task"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[36px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deploy Strategic Task</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource allocation & Deal synchronization</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleCreateTask} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Mission Objective</label>
                                        <input 
                                            type="text" required placeholder="e.g. Site Visit for Granite Delivery"
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[15px] font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                            value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Linked Deal</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-black text-slate-700"
                                            value={formData.dealId} onChange={(e) => setFormData({...formData, dealId: e.target.value})}
                                        >
                                            <option value="">Select Project/Deal...</option>
                                            {deals.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Customer</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-black text-slate-700"
                                            value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                                        >
                                            <option value="">Select Customer...</option>
                                            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Deploy To (Employee)</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-black text-slate-700"
                                            value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                                        >
                                            <option value="">Select Resource...</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>
                                                    {emp.first_name} {emp.last_name} – {emp.designation || emp.role || 'Staff'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Deadline</label>
                                        <input 
                                            type="date" required
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-black text-slate-900"
                                            value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Task Type</label>
                                        <select 
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-black text-slate-700"
                                            value={formData.taskType} onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                                        >
                                            {['Delivery', 'Follow-up', 'Site Visit', 'Verification', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Priority Level</label>
                                        <div className="flex gap-2">
                                            {['Low', 'Medium', 'High'].map(p => (
                                                <button 
                                                    key={p} type="button"
                                                    onClick={() => setFormData({...formData, priority: p})}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        formData.priority === p ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Detailed Instructions</label>
                                        <textarea 
                                            required
                                            rows="3"
                                            placeholder="Provide specific details for the employee..."
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                            value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-4">
                                    <button 
                                        type="submit" disabled={actionLoading}
                                        className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all flex justify-center items-center gap-3"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Dispatch Mission</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskSystem;
