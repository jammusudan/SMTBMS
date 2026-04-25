import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { staffService, hrmsService } from '../services/api';
import { 
    Users, Search, UserPlus, Mail, Shield, 
    MoreVertical, Edit2, Trash2, CheckCircle, 
    XCircle, Loader2, Filter, ChevronRight, X, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffManagement = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'Employee',
        dept_id: '',
        designation: '',
        salary: '',
        join_date: new Date().toISOString().split('T')[0]
    });

    const tabs = [
        { id: 'all', label: 'All Staff' },
        { id: 'hr', label: 'HR' },
        { id: 'manager', label: 'Managers' },
        { id: 'employee', label: 'Employees' },
        { id: 'sales', label: 'Sales' }
    ];

    useEffect(() => {
        fetchStaff();
        fetchDepartments();
    }, [activeTab]);

    const fetchDepartments = async () => {
        try {
            const { data } = await hrmsService.getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data } = activeTab === 'all' 
                ? await staffService.getAll() 
                : await staffService.getByRole(activeTab);
            setStaff(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setActionLoading('saving');
        
        try {
            await hrmsService.upsertEmployee(formData);
            await fetchStaff();
            setSuccessMessage('Staff member successfully added!');
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccessMessage('');
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    password: '',
                    role: 'Employee',
                    dept_id: '',
                    designation: '',
                    salary: '',
                    join_date: new Date().toISOString().split('T')[0]
                });
            }, 2000);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Error adding staff member');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleStatus = async (staffId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        setActionLoading(staffId);
        try {
            await staffService.updateStatus(staffId, newStatus);
            setStaff(prev => prev.map(s => s._id === staffId ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const RoleBadge = ({ role }) => {
        const colors = {
            hr: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            manager: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            employee: 'bg-slate-50 text-slate-600 border-slate-100',
            sales: 'bg-amber-50 text-amber-600 border-amber-100',
            'super admin': 'bg-rose-50 text-rose-600 border-rose-100',
            admin: 'bg-rose-50 text-rose-600 border-rose-100'
        };
        const colorClass = colors[role.toLowerCase()] || colors.employee;
        
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colorClass}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="p-8 min-h-screen bg-[#f8fafc]">
            {/* Header section */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                            <Users size={20} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Directory</h1>
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Unified personnel management and role governance.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search staff..." 
                            className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all w-full md:w-64 placeholder:text-slate-300 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-6 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <UserPlus size={16} strokeWidth={3} />
                        <span className="hidden sm:inline">Add Staff</span>
                    </button>
                </div>
            </header>

            {/* Role Tabs */}
            <div className="mb-8 flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Syncing personnel records...</p>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="bg-slate-50 p-6 rounded-full mb-6">
                        <Users size={48} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold">No staff members found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredStaff.map((person) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={person._id}
                                className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative overflow-hidden"
                            >
                                {/* Role Indicator Bar */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                                    person.role.toLowerCase().includes('admin') ? 'bg-rose-500' :
                                    person.role.toLowerCase() === 'hr' ? 'bg-emerald-500' :
                                    person.role.toLowerCase() === 'manager' ? 'bg-indigo-500' :
                                    'bg-slate-200'
                                } opacity-20`}></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Users size={28} />
                                    </div>
                                    <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors uppercase">{person.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                                        <Mail size={12} strokeWidth={3} />
                                        <span className="text-[11px] font-bold truncate">{person.email}</span>
                                    </div>
                                    <RoleBadge role={person.role} />
                                </div>

                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${person.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${person.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {person.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => toggleStatus(person._id, person.status)}
                                            disabled={actionLoading === person._id}
                                            className={`p-2 rounded-lg transition-all ${
                                                person.status === 'Active' 
                                                ? 'text-rose-400 hover:bg-rose-50' 
                                                : 'text-emerald-400 hover:bg-emerald-50'
                                            } disabled:opacity-50`}
                                            title={person.status === 'Active' ? 'Deactivate' : 'Activate'}
                                        >
                                            {actionLoading === person._id ? <Loader2 size={16} className="animate-spin" /> : (
                                                person.status === 'Active' ? <XCircle size={18} /> : <CheckCircle size={18} />
                                            )}
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Staff">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Staff">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Hover Arrow */}
                                <ChevronRight className="absolute bottom-6 right-6 text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" size={16} strokeWidth={3} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[48px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Staff</h2>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Create login credentials and employee profile.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all bg-white hover:bg-slate-200 p-4 rounded-full shadow-sm"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {errorMessage && (
                                    <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-3xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest animate-shake">
                                        <div className="bg-rose-600 text-white p-1.5 rounded-lg"><X size={16} /></div>
                                        {errorMessage}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mb-8 p-6 bg-emerald-50 border-2 border-emerald-100 text-emerald-600 rounded-3xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest">
                                        <div className="bg-emerald-600 text-white p-1.5 rounded-lg"><CheckCircle size={16} /></div>
                                        {successMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Credentials</h4>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Work Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                                <input 
                                                    type="email" required placeholder="name@company.com"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 pl-14 pr-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Access Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                                <input 
                                                    type="password" required placeholder="••••••••"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 pl-14 pr-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">System Role</label>
                                            <div className="relative group">
                                                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                                <select 
                                                    required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 pl-14 pr-6 text-slate-900 outline-none transition-all font-bold appearance-none cursor-pointer"
                                                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                >
                                                    <option value="Employee">Employee</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="HR">HR Specialist</option>
                                                    <option value="Sales">Sales Personnel</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Official Data</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">First Name</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold uppercase text-sm"
                                                    value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Last Name</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold uppercase text-sm"
                                                    value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Department</label>
                                            <select 
                                                required
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                value={formData.dept_id} onChange={(e) => setFormData({...formData, dept_id: e.target.value})}
                                            >
                                                <option value="">Choose Unit...</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Monthly (₹)</label>
                                                <input 
                                                    type="number" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Designation</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        disabled={actionLoading === 'saving'}
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[30px] flex items-center justify-center gap-3 transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        {actionLoading === 'saving' ? <Loader2 className="animate-spin text-indigo-600" size={24} /> : (
                                            <>
                                                <UserPlus size={24} />
                                                Confirm Onboarding
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default StaffManagement;
