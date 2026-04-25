import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hrmsService } from '../services/api';
import { Users, UserPlus, Search, Trash2, Edit2, Loader2, Mail, Briefcase, DollarSign, Calendar, Lock, Shield, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeManagement = () => {
    const { user } = useAuth();
    const canEdit = user && ['Admin', 'HR', 'ADMIN'].includes(user.role);
    const canDelete = user && ['Admin', 'ADMIN'].includes(user.role);

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [salaryData, setSalaryData] = useState({
        basicSalary: 0,
        hra: 0,
        allowances: 0,
        bonus: 0,
        pfPercent: 12,
        taxPercent: 0
    });

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, deptRes] = await Promise.all([
                hrmsService.getEmployees(),
                hrmsService.getDepartments()
            ]);
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching employee data:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        if (!formData.email.includes('@')) {
            setErrorMessage('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 6) {
            setErrorMessage('Password must be at least 6 characters');
            return false;
        }
        if (Number(formData.salary) <= 0) {
            setErrorMessage('Salary must be a positive number');
            return false;
        }
        return true;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!validateForm()) return;

        setActionLoading(true);
        try {
            await hrmsService.upsertEmployee(formData);
            await fetchData();
            setSuccessMessage('Employee successfully onboarded!');
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
            setErrorMessage(error.response?.data?.message || 'Error onboarding employee');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee record?')) return;
        try {
            await hrmsService.deleteEmployee(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleSalaryOpen = (emp) => {
        setSelectedEmployee(emp);
        setSalaryData({
            basicSalary: emp.salaryStructure?.basicSalary || 0,
            hra: emp.salaryStructure?.hra || 0,
            allowances: emp.salaryStructure?.allowances || 0,
            bonus: emp.salaryStructure?.bonus || 0,
            pfPercent: emp.salaryStructure?.pfPercent || 12,
            taxPercent: emp.salaryStructure?.taxPercent || 0
        });
        setIsSalaryModalOpen(true);
    };

    const handleSalarySave = async (e) => {
        e.preventDefault();
        if (!salaryData.basicSalary || salaryData.basicSalary <= 0) {
            setErrorMessage('Basic Salary is required and must be positive');
            return;
        }
        setActionLoading(true);
        try {
            await hrmsService.updateSalaryStructure(selectedEmployee._id, salaryData);
            setSuccessMessage('Salary structure updated successfully');
            setTimeout(() => {
                setIsSalaryModalOpen(false);
                setSuccessMessage('');
                fetchData();
            }, 1500);
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Error updating salary');
        } finally {
            setActionLoading(false);
        }
    };

    const grossSalary = Number(salaryData.basicSalary) + Number(salaryData.hra) + Number(salaryData.allowances) + Number(salaryData.bonus);

    const handleRowClick = (emp) => {
        setSelectedProfile(emp);
        setIsProfileModalOpen(true);
    };

    const filteredEmployees = employees.filter(e => 
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 min-h-screen bg-white">
            <header className="mb-8 flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100">
                        <Users size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</h1>
                        <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Enterprise Human Resource Management</p>
                    </div>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
                    >
                        <UserPlus size={16} />
                        Onboard Personnel
                    </button>
                )}
            </header>

            {/* Tight Search Bar */}
            <div className="mb-6">
                <div className="relative group max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, designation..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-slate-300 transition-all placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Formal Data Table */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Contact Information</th>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Join Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-slate-400 text-sm font-bold">No records found matching criteria.</td></tr>
                            ) : filteredEmployees.map((emp) => (
                                <tr 
                                    key={emp._id} 
                                    onClick={() => handleRowClick(emp)}
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs border border-slate-200">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 leading-none">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{emp.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                            <Mail size={12} className="text-slate-300" />
                                            {emp.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-black text-slate-700">{emp.designation}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{emp.department_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-200" />
                                            {new Date(emp.join_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all" title="Edit Profile"><Edit2 size={16} /></button>
                                            {canEdit && (
                                                <button 
                                                    onClick={() => handleSalaryOpen(emp)}
                                                    className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px]"
                                                    title="Configure Salary"
                                                >
                                                    ₹
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(emp._id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-600 transition-all" title="Delete Account"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Personnel</h2>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Create login credentials and employee profile.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all bg-white hover:bg-slate-200 p-4 rounded-full shadow-sm"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-10">
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
                                        disabled={actionLoading}
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-[30px] flex items-center justify-center gap-3 transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin text-indigo-600" size={24} /> : (
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

            {/* Salary Configuration Modal */}
            <AnimatePresence>
                {isSalaryModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl border border-white/20"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Salary Configuration</h2>
                                    <p className="text-slate-500 font-bold text-xs mt-1">Personnel: {selectedEmployee?.first_name} {selectedEmployee?.last_name}</p>
                                </div>
                                <button onClick={() => setIsSalaryModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all bg-white p-3 rounded-full shadow-sm"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSalarySave} className="p-8">
                                {errorMessage && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">{errorMessage}</div>}
                                {successMessage && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">{successMessage}</div>}

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Earnings (Monthly)</h4>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">Basic Salary *</label>
                                            <input type="number" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.basicSalary} onChange={(e) => setSalaryData({...salaryData, basicSalary: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">HRA</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.hra} onChange={(e) => setSalaryData({...salaryData, hra: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">Allowances</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.allowances} onChange={(e) => setSalaryData({...salaryData, allowances: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">Bonus</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.bonus} onChange={(e) => setSalaryData({...salaryData, bonus: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Statutory & Tax (%)</h4>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">PF Percentage</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.pfPercent} onChange={(e) => setSalaryData({...salaryData, pfPercent: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-1">Tax Percentage</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all" value={salaryData.taxPercent} onChange={(e) => setSalaryData({...salaryData, taxPercent: e.target.value})} />
                                        </div>

                                        <div className="pt-6">
                                            <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Gross Salary</p>
                                                <p className="text-2xl font-black tracking-tight">₹{grossSalary.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                    <button disabled={actionLoading} type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Save Configuration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Profile Detail Modal */}
            <AnimatePresence>
                {isProfileModalOpen && selectedProfile && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.35)] flex flex-col md:flex-row border border-white/20"
                        >
                            {/* Left Panel: Identity */}
                            <div className="w-full md:w-1/3 bg-slate-900 p-10 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center h-full">
                                    <div className="w-32 h-32 rounded-[40px] bg-white/10 border border-white/20 flex items-center justify-center text-4xl font-black text-white mb-6 backdrop-blur-sm shadow-2xl">
                                        {selectedProfile.first_name[0]}{selectedProfile.last_name[0]}
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight leading-tight mb-2">
                                        {selectedProfile.first_name} <br/> {selectedProfile.last_name}
                                    </h3>
                                    <span className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                                        {selectedProfile.role}
                                    </span>

                                    <div className="w-full space-y-6 text-left mt-auto">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Employee ID</p>
                                            <p className="font-bold text-sm">{selectedProfile.employeeCode || 'EMP-TEMP'}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Work Email</p>
                                            <p className="font-bold text-sm truncate">{selectedProfile.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Data Grid */}
                            <div className="flex-1 p-10 bg-white relative">
                                <button 
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
                                >
                                    <X size={24} />
                                </button>

                                <div className="h-full flex flex-col">
                                    <div className="mb-10">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Employment Matrix</h4>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Briefcase size={16} className="text-indigo-500" />
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Designation</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-700 ml-7">{selectedProfile.designation}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Users size={16} className="text-indigo-500" />
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Department</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-700 ml-7">{selectedProfile.department_name}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Calendar size={16} className="text-indigo-500" />
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Joining Date</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-700 ml-7">{new Date(selectedProfile.join_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <CheckCircle size={16} className="text-emerald-500" />
                                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Status</span>
                                                </div>
                                                <p className="text-lg font-black text-emerald-600 ml-7">Active</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-10 border-t border-slate-50">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Financial Overview</h4>
                                        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Contractual Monthly Salary</p>
                                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">₹{selectedProfile.salary?.toLocaleString()}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-400 text-[9px] font-bold uppercase mb-2">Compensation Structure</p>
                                                <div className="flex gap-2 justify-end">
                                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">HRA: {selectedProfile.salaryStructure?.hra || 0}</span>
                                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">PF: {selectedProfile.salaryStructure?.pfPercent || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
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

export default EmployeeManagement;
