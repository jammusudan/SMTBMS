import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { hrmsService } from '../services/api';
import { 
    Users, UserPlus, Search, Trash2, Edit2, 
    Loader2, Mail, Briefcase, IndianRupee, 
    Calendar, Lock, Shield, X, CheckCircle, 
    UserMinus, UserCheck, Filter, ChevronDown, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeManagement = () => {
    const { user } = useAuth();
    const isHR = user?.role === 'HR';
    const isAdmin = user?.role === 'Admin' || user?.role === 'ADMIN';
    const canEdit = isHR || isAdmin;
    const canDelete = isAdmin;

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    
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
            setErrorMessage('Basic salary must be greater than zero');
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
        if (!window.confirm('Strict Confirmation: Delete this employee record permanently?')) return;
        try {
            await hrmsService.deleteEmployee(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleStatusToggle = async (emp, e) => {
        e.stopPropagation(); // Prevent opening profile modal
        const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await hrmsService.updateEmployeeStatus(emp._id, newStatus);
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSalaryOpen = (emp, e) => {
        e.stopPropagation();
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
            setErrorMessage('Basic Salary must be greater than zero');
            return;
        }

        const gross = Number(salaryData.basicSalary) + Number(salaryData.hra) + Number(salaryData.allowances) + Number(salaryData.bonus);
        const pf = Math.trunc(Number(salaryData.basicSalary) * (Number(salaryData.pfPercent) / 100));
        const tax = Math.trunc(gross * (Number(salaryData.taxPercent) / 100));
        
        if ((pf + tax) >= gross && gross > 0) {
            setErrorMessage('Deductions (PF + Tax) cannot exceed Gross Salary');
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

    const grossSalaryPreview = Number(salaryData.basicSalary) + Number(salaryData.hra) + Number(salaryData.allowances) + Number(salaryData.bonus);
    const pfPreview = Math.trunc(Number(salaryData.basicSalary) * (Number(salaryData.pfPercent) / 100));
    const taxPreview = Math.trunc(grossSalaryPreview * (Number(salaryData.taxPercent) / 100));
    const netPayPreview = Math.max(0, grossSalaryPreview - (pfPreview + taxPreview));

    const handleRowClick = (emp) => {
        setSelectedProfile(emp);
        setIsProfileModalOpen(true);
    };

    const filteredEmployees = employees.filter(e => {
        const matchesSearch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.designation.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === '' || e.dept_id === deptFilter;
        const matchesRole = roleFilter === '' || e.role === roleFilter;

        // HR Dashboard Visibility: HR can ONLY view details of personnel THEY onboarded
        const manageableRoles = ['employee', 'sales', 'manager', 'hr'];
        const isVisibleToHR = !isHR || (
            manageableRoles.includes(e.role?.toLowerCase()) && 
            String(e.onboardedBy) === String(user.id)
        );

        return matchesSearch && matchesDept && matchesRole && isVisibleToHR;
    });

    const availableRoles = isHR 
        ? ['Employee', 'Sales', 'Manager', 'HR'] 
        : ['Employee', 'Sales', 'Manager', 'HR', 'Admin'];

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            <header className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="p-3 md:p-4 bg-indigo-600 rounded-2xl md:rounded-[24px] text-white shadow-xl shadow-indigo-100">
                        <Users size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic">Personnel Directory</h1>
                        <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mt-1">HRMS Workforce Governance</p>
                    </div>
                </div>
                {canEdit && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl transition-all text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 active:scale-95"
                    >
                        <UserPlus size={18} />
                        Onboard Personnel
                    </button>
                )}
            </header>

            {/* ADVANCED FILTERS */}
            <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Search Employee</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Name or Designation..." 
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unit / Dept</label>
                    <select 
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hierarchy Role</label>
                    <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="HR">HR</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                    </select>
                </div>
                <button 
                    onClick={() => {setSearchTerm(''); setDeptFilter(''); setRoleFilter('');}}
                    className="w-full md:w-auto p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all flex items-center justify-center"
                >
                    <X size={20} />
                </button>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                                <th className="px-8 py-5">Personnel</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Designation</th>
                                <th className="px-8 py-5">Monthly Pay</th>
                                <th className="px-8 py-5 text-right">Governance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-32"><Loader2 className="animate-spin mx-auto text-indigo-200" size={48} /></td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-32 text-slate-300 text-lg font-black italic">No records found.</td></tr>
                            ) : filteredEmployees.map((emp) => (
                                <tr 
                                    key={emp._id} 
                                    onClick={() => handleRowClick(emp)}
                                    className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm group-hover:scale-110 transition-transform">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-slate-900 leading-tight">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 flex items-center gap-2">
                                                    <Shield size={10} className="text-indigo-400" /> {emp.role}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <button 
                                            onClick={(e) => handleStatusToggle(emp, e)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                                emp.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white' 
                                                : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white'
                                            }`}
                                        >
                                            {emp.status === 'Active' ? <UserCheck size={14} /> : <UserMinus size={14} />}
                                            {emp.status}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-slate-700">{emp.designation}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            {emp.department_name}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-slate-900 tracking-tight">₹{(emp.salary || 0).toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Basic Contract</div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isHR && (
                                                <button 
                                                    onClick={(e) => handleSalaryOpen(emp, e)}
                                                    className="p-3 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-2xl border border-indigo-100 transition-all shadow-sm"
                                                    title="Configure Salary Structure"
                                                >
                                                    <IndianRupee size={18} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button 
                                                    onClick={(e) => {e.stopPropagation(); handleDelete(emp._id);}}
                                                    className="p-3 bg-white hover:bg-rose-600 text-rose-400 hover:text-white rounded-2xl border border-rose-100 transition-all shadow-sm"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <div className="p-3 bg-white text-slate-300 rounded-2xl border border-slate-100">
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS: ONBOARDING */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-3xl border border-white/20"
                        >
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Onboard Personnel</h2>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Identity & Access Configuration.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all bg-white hover:bg-slate-100 p-4 rounded-full shadow-sm border border-slate-100"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {errorMessage && (
                                    <div className="mb-8 p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest animate-shake">
                                        <ShieldAlert size={20} /> {errorMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Lock size={14} /> Security & Access
                                        </h4>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Email Address</label>
                                            <input 
                                                type="email" required placeholder="corp@identity.com"
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Initial Password</label>
                                            <input 
                                                type="password" required placeholder="Secure Token"
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Assigned Role</label>
                                            <select 
                                                required
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold appearance-none cursor-pointer"
                                                value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            >
                                                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Briefcase size={14} /> Profile Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">First Name</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Last Name</label>
                                                <input 
                                                    type="text" required
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                    value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Department</label>
                                            <select 
                                                required
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold appearance-none cursor-pointer"
                                                value={formData.dept_id} onChange={(e) => setFormData({...formData, dept_id: e.target.value})}
                                            >
                                                <option value="">Select Unit...</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Designation</label>
                                            <input 
                                                type="text" required placeholder="Job Title"
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-900 text-xs font-black uppercase tracking-widest mb-3 ml-1">Base Salary (₹)</label>
                                            <input 
                                                type="number" required
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all font-bold"
                                                value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12">
                                    <button 
                                        disabled={actionLoading}
                                        type="submit"
                                        className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-6 rounded-[32px] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={24} /> : (
                                            <>
                                                <CheckCircle size={24} />
                                                Finalize Onboarding
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: SALARY CONFIG */}
            <AnimatePresence>
                {isSalaryModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl border border-white/20"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Configuration</h2>
                                    <p className="text-slate-500 font-bold text-xs mt-1">Record: {selectedEmployee?.first_name} {selectedEmployee?.last_name}</p>
                                </div>
                                <button onClick={() => setIsSalaryModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all bg-white p-3 rounded-full shadow-sm border border-slate-100"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleSalarySave} className="p-8">
                                {errorMessage && <div className="mb-6 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><ShieldAlert size={16}/> {errorMessage}</div>}

                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-5">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Earnings Matrix</h4>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Basic Salary *</label>
                                            <input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.basicSalary} onChange={(e) => setSalaryData({...salaryData, basicSalary: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">HRA</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.hra} onChange={(e) => setSalaryData({...salaryData, hra: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Allowances</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.allowances} onChange={(e) => setSalaryData({...salaryData, allowances: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Bonus</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.bonus} onChange={(e) => setSalaryData({...salaryData, bonus: e.target.value})} />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Statutory / TDS (%)</h4>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">PF Rate (%)</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.pfPercent} onChange={(e) => setSalaryData({...salaryData, pfPercent: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-1">Income Tax (%)</label>
                                            <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white rounded-2xl py-3 px-5 text-sm font-black outline-none transition-all" value={salaryData.taxPercent} onChange={(e) => setSalaryData({...salaryData, taxPercent: e.target.value})} />
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-slate-100">
                                            <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700"></div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Calculated Net Pay</p>
                                                <p className="text-3xl font-black tracking-tight relative z-10">₹{netPayPreview.toLocaleString()}</p>
                                                <div className="flex justify-between mt-4 text-[9px] font-bold opacity-60">
                                                    <span>Gross: ₹{grossSalaryPreview.toLocaleString()}</span>
                                                    <span>Deduct: ₹{(pfPreview + taxPreview).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                                    <button disabled={actionLoading} type="submit" className="flex-2 grow-[2] bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Save Structure'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL: PROFILE DETAIL */}
            <AnimatePresence>
                {isProfileModalOpen && selectedProfile && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 20 }}
                            className="bg-white w-full max-w-5xl rounded-[48px] overflow-hidden shadow-4xl flex flex-col md:flex-row border border-white/20"
                        >
                            {/* Left: Identity Card */}
                            <div className="w-full md:w-[35%] bg-slate-900 p-12 text-white relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-40 h-40 rounded-[48px] bg-white/10 border border-white/20 flex items-center justify-center text-5xl font-black text-white mb-8 backdrop-blur-md shadow-2xl">
                                        {selectedProfile.first_name[0]}{selectedProfile.last_name[0]}
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tight leading-tight mb-3">
                                        {selectedProfile.first_name} <br/> {selectedProfile.last_name}
                                    </h3>
                                    <div className="px-5 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-lg shadow-indigo-900/40">
                                        {selectedProfile.role}
                                    </div>

                                    <div className="w-full space-y-6 text-left">
                                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Official ID</p>
                                            <p className="font-bold text-base tracking-tight">{selectedProfile.employeeCode || 'EMP-SYNC'}</p>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1.5">Corporate Email</p>
                                            <p className="font-bold text-sm truncate">{selectedProfile.email}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-auto relative z-10 pt-10 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-white/40">
                                        <Activity size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Active Status Monitoring</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Detailed Data */}
                            <div className="flex-1 p-12 bg-white relative">
                                <button 
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="absolute top-10 right-10 p-3 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100 shadow-sm"
                                >
                                    <X size={24} />
                                </button>

                                <div className="h-full flex flex-col">
                                    <div className="mb-12">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                                            <Shield size={16} /> Personnel Matrix
                                        </h4>
                                        <div className="grid grid-cols-2 gap-12">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 mb-2 text-slate-400">
                                                    <Briefcase size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Designation</span>
                                                </div>
                                                <p className="text-xl font-black text-slate-900">{selectedProfile.designation}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 mb-2 text-slate-400">
                                                    <Users size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Department</span>
                                                </div>
                                                <p className="text-xl font-black text-slate-900">{selectedProfile.department_name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 mb-2 text-slate-400">
                                                    <Calendar size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Join Date</span>
                                                </div>
                                                <p className="text-xl font-black text-slate-900">{new Date(selectedProfile.join_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 mb-2 text-slate-400">
                                                    <CheckCircle size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Work Status</span>
                                                </div>
                                                <p className={`text-xl font-black ${selectedProfile.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedProfile.status}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto bg-[#F8FAFC] p-10 rounded-[40px] border border-slate-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-600/10 transition-colors"></div>
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-2 relative z-10">
                                            <IndianRupee size={16} /> Compensation Model
                                        </h4>
                                        <div className="flex items-end justify-between relative z-10">
                                            <div>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Base Monthly Contract</p>
                                                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">₹{selectedProfile.salary?.toLocaleString()}</h3>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2 justify-end">
                                                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">PF: {selectedProfile.salaryStructure?.pfPercent || 12}%</span>
                                                        <span className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">Tax: {selectedProfile.salaryStructure?.taxPercent || 0}%</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2 justify-end">
                                                        <CheckCircle size={10} className="text-emerald-500" /> Auto-Calculation Verified
                                                    </p>
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
