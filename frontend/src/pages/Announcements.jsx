import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    Megaphone, CheckCircle2, AlertTriangle, AlertCircle, 
    Trash2, Plus, X, Loader2, Calendar, Clock, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        message: '',
        type: 'Info'
    });

    const isAdminOrHR = ['Admin', 'HR'].includes(user?.role);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await notificationService.getAll();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await notificationService.broadcast(newAnnouncement);
            setShowModal(false);
            setNewAnnouncement({ title: '', message: '', type: 'Info' });
            fetchAnnouncements();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await notificationService.remove(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getCategoryStyles = (type) => {
        switch (type) {
            case 'Urgent':
                return {
                    icon: <AlertCircle className="text-rose-600" size={24} />,
                    border: 'border-rose-200',
                    bg: 'bg-rose-50',
                    badge: 'bg-rose-100 text-rose-700',
                    indicator: 'bg-rose-500',
                    emoji: '🚨'
                };
            case 'Warning':
                return {
                    icon: <AlertTriangle className="text-amber-600" size={24} />,
                    border: 'border-amber-200',
                    bg: 'bg-amber-50',
                    badge: 'bg-amber-100 text-amber-700',
                    indicator: 'bg-amber-500',
                    emoji: '⚠️'
                };
            default:
                return {
                    icon: <Megaphone className="text-emerald-600" size={24} />,
                    border: 'border-emerald-200',
                    bg: 'bg-emerald-50',
                    badge: 'bg-emerald-100 text-emerald-700',
                    indicator: 'bg-emerald-500',
                    emoji: '📢'
                };
        }
    };

    if (loading) return (
        <div className="p-8 flex h-[60vh] items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
    );

    const unreadCount = announcements.filter(a => !a.isRead).length;

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Announcements</h1>
                    <p className="text-slate-500 font-bold tracking-wide">View all company announcements and updates</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllRead}
                            className="bg-white border border-slate-200 text-slate-600 font-bold px-5 py-3 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <CheckCircle2 size={18} />
                            Mark all as Read
                        </button>
                    )}
                    {isAdminOrHR && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white font-black px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                        >
                            <Plus size={20} />
                            Post Update
                        </button>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {announcements.length === 0 ? (
                <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center">
                    <div className="bg-slate-50 p-8 rounded-full mb-6">
                        <Megaphone size={48} className="text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">No announcements available</h2>
                    <p className="text-slate-500 font-bold max-w-sm">When HR or Admins post company updates, they will appear here correctly sorted.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {announcements.map((a) => {
                        const style = getCategoryStyles(a.type);
                        return (
                            <motion.div 
                                layout
                                key={a.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group relative bg-white border-2 ${a.isRead ? 'border-slate-100 opacity-75' : `${style.border} shadow-xl shadow-${a.type === 'Urgent' ? 'rose' : 'indigo'}-500/5`} rounded-[32px] p-8 transition-all hover:shadow-2xl overflow-hidden`}
                            >
                                {/* Left indicator line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${a.isRead ? 'bg-slate-100' : style.indicator}`}></div>
                                
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className={`w-16 h-16 rounded-2xl ${style.bg} flex items-center justify-center shrink-0 shadow-inner`}>
                                        {style.icon}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${style.badge}`}>
                                                {style.emoji} {a.type}
                                            </span>
                                            {!a.isRead && (
                                                <span className="bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">New</span>
                                            )}
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 ml-auto">
                                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(a.created_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        
                                        <h3 className={`text-xl font-black tracking-tight mb-2 ${a.isRead ? 'text-slate-600' : 'text-slate-900 group-hover:text-indigo-600 transition-colors'}`}>
                                            {a.title}
                                        </h3>
                                        <p className="text-slate-500 font-bold leading-relaxed mb-6">
                                            {a.message}
                                        </p>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {!a.isRead && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(a.id)}
                                                        className="flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition-all active:scale-95"
                                                    >
                                                        Mark as Read
                                                        <ArrowRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {isAdminOrHR && (
                                                <button 
                                                    onClick={() => handleDelete(a.id)}
                                                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Creation Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Post Announcement</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreate} className="p-10 space-y-8">
                                <div className="space-y-6">
                                    {/* Category Select */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Info', 'Warning', 'Urgent'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewAnnouncement({...newAnnouncement, type})}
                                                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    newAnnouncement.type === type 
                                                    ? (type === 'Urgent' ? 'bg-rose-600 text-white shadow-xl shadow-rose-200' : type === 'Warning' ? 'bg-amber-500 text-white shadow-xl shadow-amber-200' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200')
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Announcement Title</label>
                                        <input 
                                            required
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                            placeholder="e.g., Annual General Meeting"
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Announcement Details</label>
                                        <textarea 
                                            required
                                            rows="5"
                                            value={newAnnouncement.message}
                                            onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                                            placeholder="Enter your announcement content here..."
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl px-6 py-4 font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 resize-none"
                                        />
                                    </div>
                                </div>

                                <button 
                                    disabled={actionLoading}
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={24} /> : (
                                        <>
                                            <Megaphone size={20} />
                                            <span>Broadcast Announcement</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Announcements;
