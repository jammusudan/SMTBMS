import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, Package, FileText, Users, Clock, 
    CalendarDays, Truck, ShoppingCart, UserCheck, 
    TrendingUp, Receipt, Bell, Settings as SettingsIcon, 
    Activity, LogOut, Search, ClipboardList, Banknote, 
    Megaphone, BarChart3, User, ShieldCheck, Warehouse,
    Target, Briefcase, PieChart, Menu, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { notificationService } from '../services/api';
import { ROLES, MODULE_ACCESS, hasAccess } from '../utils/roles';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    
    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); 
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data } = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    if (!user) return null;

    const role = user.role;

    // DYNAMIC NAVIGATION CONFIGURATION
    const NAV_CONFIG = React.useMemo(() => [
        {
            section: 'CORE',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, path: '/', accessGroup: MODULE_ACCESS.DASHBOARD },
                { name: 'Analytics', icon: BarChart3, path: '/inventory/analytics', accessGroup: MODULE_ACCESS.INVENTORY },
                { name: 'Reports', icon: FileText, path: '/reports', accessGroup: MODULE_ACCESS.REPORTS },
                { name: 'Inventory', icon: Warehouse, path: '/inventory', accessGroup: MODULE_ACCESS.INVENTORY },
            ]
        },
        {
            section: 'HRMS',
            items: [
                { name: 'Employees', icon: UserCheck, path: '/hrms', accessGroup: MODULE_ACCESS.EMPLOYEES },
                { name: 'Attendance', icon: Clock, path: '/attendance', accessGroup: MODULE_ACCESS.ATTENDANCE },
                { name: 'Leaves', icon: CalendarDays, path: '/leaves', accessGroup: MODULE_ACCESS.LEAVES },
            ]
        },
        {
            section: 'TASKS',
            items: [
                { name: 'Daily Tasks', icon: ClipboardList, path: '/tasks', accessGroup: MODULE_ACCESS.TASKS },
                { name: 'Field Audit', icon: ShieldCheck, path: '/crm/field-audit', accessGroup: MODULE_ACCESS.FIELD_AUDIT },
                { name: 'Payroll', icon: Banknote, path: '/salary', accessGroup: MODULE_ACCESS.PAYROLL },
            ]
        },
        {
            section: 'SALES & CRM',
            items: [
                { name: 'CRM Overview', icon: PieChart, path: '/crm/overview', accessGroup: MODULE_ACCESS.CRM_INSIGHTS },
                { name: 'Leads', icon: Target, path: '/crm/leads', accessGroup: MODULE_ACCESS.CRM_PIPELINE },
                { name: 'Deals', icon: Briefcase, path: '/crm/deals', accessGroup: MODULE_ACCESS.CRM_SALES },
                { name: 'Customers', icon: Users, path: '/crm/customers', accessGroup: MODULE_ACCESS.CRM_CUSTOMERS },
                { name: 'Vendors', icon: Truck, path: '/erp/vendors', accessGroup: MODULE_ACCESS.VENDORS },
                { name: 'Activities', icon: Activity, path: '/logs', accessGroup: MODULE_ACCESS.AUDIT_LOGS },
                { name: 'Performance', icon: TrendingUp, path: '/crm/insights', accessGroup: MODULE_ACCESS.CRM_INSIGHTS },
                { name: 'Orders', icon: ShoppingCart, path: '/erp/orders', accessGroup: MODULE_ACCESS.ORDERS },
            ]
        },
        {
            section: 'SYSTEM',
            items: [
                { name: 'Notifications', icon: Megaphone, path: '/announcements', accessGroup: MODULE_ACCESS.ANNOUNCEMENTS },
                { name: 'Settings', icon: SettingsIcon, path: '/settings', accessGroup: MODULE_ACCESS.SETTINGS },
            ]
        }
    ], [role]);

    const filteredMenu = NAV_CONFIG.map(group => ({
        ...group,
        items: group.items.filter(item => hasAccess(role, item.accessGroup))
    })).filter(group => group.items.length > 0);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <nav className={`fixed left-0 top-0 h-screen w-64 bg-white flex flex-col pt-4 z-50 border-r border-slate-100 shadow-sm transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                {/* BRANDING - Compacted */}
                <div className="flex items-center justify-between mb-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2 rounded-xl text-white shadow-lg shadow-indigo-100 italic">
                            <Package size={18} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter">SMTBMS</h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition relative"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                        </div>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* QUICK SEARCH - Compacted */}
                <div className="px-4 mb-4">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-100 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* NAV MENU - Compacted spacing */}
                <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4 custom-scrollbar">
                    {filteredMenu.map((group, idx) => (
                        <div key={idx} className="space-y-1.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-3 mb-1 opacity-70">{group.section}</h4>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link 
                                            key={item.name}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-black text-[15px] tracking-tight relative group ${
                                                isActive 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'} />
                                            <span>{(item.name === 'Payroll' && role === 'Employee') ? 'My Salary' : item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* FOOTER / USER PROFILE - Optimized for space */}
                <div className="mt-auto p-3 flex flex-col gap-2 border-t border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                            <User size={18} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[13px] font-black text-slate-800 tracking-tight truncate uppercase leading-none">{user.username}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1.5">{user.role}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all font-black text-[12px] uppercase tracking-widest border border-transparent shadow-sm active:scale-[0.98]"
                    >
                        <LogOut size={16} strokeWidth={3} />
                        Sign Out
                    </button>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { 
                        width: 6px; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-track { 
                        background: #f8fafc; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb { 
                        background: #cbd5e1; 
                        border-radius: 20px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                        background: #94a3b8; 
                    }
                `}</style>
            </nav>
        </>
    );
};

export default Navbar;
