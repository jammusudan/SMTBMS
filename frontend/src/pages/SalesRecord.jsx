import React, { useState, useEffect } from 'react';
import { crmService } from '../services/api';
import { Receipt, Plus, Search, Loader2, Calendar, User, DollarSign, ArrowUpRight, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesRecord = () => {
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        total_amount: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesRes, custRes] = await Promise.all([
                crmService.getSales(),
                crmService.getCustomers()
            ]);
            setSales(salesRes.data);
            setCustomers(custRes.data);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordSale = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await crmService.recordSale(formData);
            fetchData();
            setIsModalOpen(false);
            setFormData({ customer_id: '', date: new Date().toISOString().split('T')[0], total_amount: '' });
        } catch (error) {
            alert('Error recording sale');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredSales = sales.filter(s => 
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = sales.reduce((acc, curr) => acc + Number(curr.total_amount), 0);

    return (
        <div className="p-8 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Receipt className="text-indigo-600" size={32} />
                        Sales Records
                    </h1>
                    <p className="text-slate-600 mt-1">Detailed history of all finalized customer transactions.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200"
                >
                    <Plus size={20} />
                    Record New Sale
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm border-b-[6px] border-b-emerald-500 hover:shadow-md transition-all">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-3xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</h3>
                        <span className="text-emerald-600 bg-emerald-50 px-2 flex items-center rounded-md font-bold text-xs"><ArrowUpRight size={14} /> Overall</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm border-b-[6px] border-b-slate-300 hover:shadow-md transition-all">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sales Count</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{sales.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm border-b-[6px] border-b-indigo-500 hover:shadow-md transition-all">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Avg. Sale Value</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">
                        ${sales.length > 0 ? (totalRevenue / sales.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
                    </h3>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl flex items-center gap-4 mb-6 border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by customer name..." 
                    className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 font-medium w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Sales Person</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-20 text-slate-500"><Loader2 className="animate-spin text-indigo-600 mx-auto" /></td></tr>
                        ) : filteredSales.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-20 text-slate-500 font-medium">No sales recorded.</td></tr>
                        ) : filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-400 font-mono text-sm font-medium">#TX-{sale.id}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{sale.customer_name}</td>
                                <td className="px-6 py-4 text-slate-500 text-sm font-medium flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                                        {sale.salesperson_name[0]}
                                    </div>
                                    {sale.salesperson_name}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-sm font-medium">{new Date(sale.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right text-emerald-600 font-bold">${Number(sale.total_amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold text-slate-900">Record Transaction</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors"><ChevronDown size={20} /></button>
                            </div>
                            <form onSubmit={handleRecordSale} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Customer</label>
                                    <select 
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none"
                                        value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Sale Date</label>
                                        <input 
                                            type="date" required
                                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Total Amount ($)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                <DollarSign size={16} />
                                            </div>
                                            <input 
                                                type="number" required min="1"
                                                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium font-bold"
                                                value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4 mt-6 border-t border-slate-100">
                                    <button 
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        disabled={actionLoading}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 text-sm active:scale-[0.98]"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Finalize Sale Record'}
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

export default SalesRecord;
