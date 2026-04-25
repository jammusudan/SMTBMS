import React, { useState, useEffect } from 'react';
import { logService } from '../services/api';
import { Activity, Loader2, Database, LayoutDashboard, Settings as SettingsIcon, Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await logService.getLogs(100);
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getModuleIcon = (module) => {
        switch(module) {
            case 'Materials': return <Package size={16} className="text-sky-600" />;
            case 'HRMS': return <Users size={16} className="text-indigo-600" />;
            case 'ERP': return <ShoppingCart size={16} className="text-amber-600" />;
            case 'CRM': return <TrendingUp size={16} className="text-emerald-600" />;
            case 'Auth': return <SettingsIcon size={16} className="text-rose-600" />;
            default: return <Database size={16} className="text-slate-600" />;
        }
    };

    const getModuleColor = (module) => {
        switch(module) {
            case 'Materials': return 'bg-sky-50 text-sky-700 border-sky-100';
            case 'HRMS': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'ERP': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'CRM': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Auth': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="p-8 min-h-screen">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Activity className="text-indigo-600" size={32} />
                    Audit Logs
                </h1>
                <p className="text-slate-600 mt-1">Full historical feed of all business operations and system actions.</p>
            </header>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Live Tracker Active</span>
                </div>
                
                <div className="p-2">
                    {loading ? (
                        <div className="py-20 flex justify-center text-slate-400">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center text-slate-500 font-medium">No activity recorded yet in the database.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">Timestamp</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">Module</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">User</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border-b border-slate-100">Action Performed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        key={log.id} 
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-4 text-sm font-medium text-slate-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getModuleColor(log.module)}`}>
                                                {getModuleIcon(log.module)}
                                                {log.module}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-900">{log.username}</td>
                                        <td className="p-4 text-sm text-slate-700 font-medium">{log.action}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;
