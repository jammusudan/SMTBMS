import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Trash2 } from 'lucide-react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    const getIcon = (type) => {
        switch (type) {
            case 'Success': return <CheckCircle className="text-emerald-500" size={24} />;
            case 'Warning': return <AlertTriangle className="text-amber-500" size={24} />;
            case 'Error': return <XCircle className="text-rose-500" size={24} />;
            default: return <Info className="text-indigo-500" size={24} />;
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="text-indigo-600" /> Notification Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and review system alerts</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button 
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition"
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <Bell size={48} className="text-slate-200 mb-4" />
                        <p className="text-lg font-medium text-slate-900 mb-1">No notifications yet</p>
                        <p className="text-sm">You're completely caught up on system alerts.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`p-6 flex items-start gap-4 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50'}`}
                            >
                                <div className="mt-1">{getIcon(n.type)}</div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                        {n.title}
                                    </h3>
                                    <p className={`text-sm mt-1 leading-relaxed ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">
                                        {new Date(n.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!n.isRead && (
                                    <button 
                                        onClick={() => handleMarkAsRead(n.id)}
                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
