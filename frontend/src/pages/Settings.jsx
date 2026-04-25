import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Shield, Loader2, Save, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await settingsService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId);
        try {
            await settingsService.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 min-h-[80vh] flex flex-col items-center justify-center text-slate-500">
                <Shield size={64} className="mb-4 text-slate-300" />
                <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                <p>Only System Administrators can view or modify global settings.</p>
            </div>
        );
    }

    return (
        <div className="p-8 min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <SettingsIcon className="text-indigo-600" size={32} />
                    System Settings
                </h1>
                <p className="text-slate-600 mt-1">Manage global system configurations and role-based access levels.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="md:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 border-4 border-white shadow-lg">
                        <UserIcon size={48} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{user?.username}</h3>
                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1 mb-4">{user?.role} Account</p>
                    <div className="w-full space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-400">Account ID</span>
                            <span className="text-slate-700 uppercase tracking-tighter">#{user?._id?.substring(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-400">Status</span>
                            <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Live ✓</span>
                        </div>
                    </div>
                </div>
                
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl border border-indigo-500 shadow-xl p-8 relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Shield size={240} />
                    </div>
                    <h2 className="text-2xl font-black text-white italic mb-2">Security Sentinel</h2>
                    <p className="text-indigo-100 font-bold text-sm mb-8 opacity-80 max-w-md">Your account is fortified with System Admin privileges. You have master control over users, roles, and global configurations.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Email Authority</p>
                            <p className="text-white font-bold text-sm tracking-tight">{user?.email}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Security Tier</p>
                            <p className="text-white font-bold text-sm tracking-tight">Level 1 - Core Admin</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                    <Shield className="text-indigo-600" size={20} />
                    <h2 className="text-xl font-bold text-slate-900">User Role Management</h2>
                </div>
                
                <div className="overflow-x-auto p-2">
                    {loading ? (
                        <div className="py-20 flex justify-center text-slate-400">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">User Account</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">Registered Email</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">Assigned Role</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        key={u.id} 
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <UserIcon size={18} />
                                                </div>
                                                <span className="font-bold text-slate-900">{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-600">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                                u.role === 'Admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                u.role === 'Manager' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                u.role === 'Sales' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <select 
                                                disabled={updating === u.id || user.id === u.id}
                                                className="bg-white border border-slate-200 text-slate-700 text-sm font-bold py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                <option value="Employee">Employee</option>
                                                <option value="Sales">Sales</option>
                                                <option value="HR">HR</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Admin">Admin</option>
                                            </select>
                                            {updating === u.id && <Loader2 className="inline ml-2 animate-spin text-indigo-600" size={16} />}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            {/* Future System Config Section Shell */}
            <div className="opacity-50 pointer-events-none">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900">Environment Preferences</h2>
                    </div>
                    <div className="p-6 text-slate-500 text-sm">
                        Global SMTP, Payment Gateway, and Notification hooks will be configured here in future modules.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
