import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/api';
import { Building2, Plus, Trash2, Search, Loader2, Landmark, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDept, setNewDept] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const { data } = await hrmsService.getDepartments();
            setDepartments(data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newDept) return;
        setActionLoading(true);
        try {
            await hrmsService.addDepartment({ name: newDept });
            setNewDept('');
            fetchDepartments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding department');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this department? This may affect employee records.')) return;
        try {
            await hrmsService.deleteDepartment(id);
            fetchDepartments();
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    return (
        <div className="p-8 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Landmark className="text-indigo-600" size={32} />
                        Department Management
                    </h1>
                    <p className="text-slate-600 mt-1">Configure and manage company departments dynamically.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm sticky top-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Plus size={20} /></div>
                            Create New Department
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Department Name</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                    placeholder="e.g. Engineering"
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                />
                            </div>
                            <button 
                                disabled={actionLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] mt-2"
                            >
                                {actionLoading ? <Loader2 className="animate-spin text-white" size={20} /> : <Save size={20} className="hidden" />}
                                Add Department
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Department Name</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-500"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                                ) : departments.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-20 text-slate-500 font-medium">No departments added yet.</td></tr>
                                ) : departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-sm font-medium">#{dept.id}</td>
                                        <td className="px-6 py-4 text-slate-900 font-bold">{dept.name}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                                            {new Date(dept.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(dept.id)}
                                                className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentManagement;
