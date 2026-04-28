import React, { useState, useEffect } from 'react';
import { materialService } from '../services/api';
import { Package, Plus, Trash2, Edit2, AlertTriangle, Search, Loader2, RefreshCw, History } from 'lucide-react';
import { motion } from 'framer-motion';
import MaterialModal from '../components/MaterialModal';
import StockUpdateModal from '../components/StockUpdateModal';
import StockHistoryModal from '../components/StockHistoryModal';
import { useAuth } from '../context/AuthContext';
import { calculateStockStatus, getStockStatusClasses } from '../utils/inventory';

const MaterialTracking = () => {
    const { user } = useAuth();
    const isEmployee = user?.role?.toUpperCase() === 'EMPLOYEE';
    const isManager = user?.role?.toUpperCase() === 'MANAGER';
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Stock Update Modal State
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockTarget, setStockTarget] = useState(null);

    // Stock History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyTarget, setHistoryTarget] = useState(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data } = await materialService.getAll();
            setMaterials(data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (material = null) => {
        setSelectedMaterial(material);
        setIsModalOpen(true);
    };

    const handleOpenStockModal = (material) => {
        setStockTarget(material);
        setIsStockModalOpen(true);
    };

    const handleOpenHistoryModal = (material) => {
        setHistoryTarget(material);
        setIsHistoryModalOpen(true);
    };

    const handleSaveMaterial = async (formData) => {
        setModalLoading(true);
        try {
            if (selectedMaterial) {
                await materialService.update(selectedMaterial.id, formData);
            } else {
                await materialService.create(formData);
            }
            fetchMaterials();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving material:', error);
            alert(error.response?.data?.message || 'Error saving material');
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdateStock = async (stockData) => {
        setModalLoading(true);
        try {
            await materialService.updateStock(stockTarget.id, stockData);
            fetchMaterials();
            setIsStockModalOpen(false);
        } catch (error) {
            console.error('Error updating stock:', error);
            alert(error.response?.data?.message || 'Error updating stock');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await materialService.delete(id);
                fetchMaterials();
            } catch (error) {
                console.error('Error deleting material:', error);
            }
        }
    };

    const filteredMaterials = materials.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate aggregated stats dynamically
    const totalItems = materials.length;
    const lowStockCount = materials.filter(m => calculateStockStatus(m.quantity, m.min_stock_level) === 'Low Stock').length;
    const outOfStockCount = materials.filter(m => calculateStockStatus(m.quantity, m.min_stock_level) === 'Out of Stock').length;
    const categories = [...new Set(materials.map(m => m.category))].filter(Boolean);

    return (
        <div className="p-8 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600" size={32} />
                        Inventory Management
                    </h1>
                    <p className="text-slate-600 mt-1 uppercase text-[10px] font-black tracking-widest">Operational stock control & tracking system.</p>
                </div>
                {!isEmployee && !isManager && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200"
                    >
                        <Plus size={20} />
                        Add Material
                    </button>
                )}
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package size={48} className="text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Total Items</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{totalItems}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={48} className="text-amber-400" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        Low Stock Items <AlertTriangle size={12} className="text-amber-500" />
                    </p>
                    <h3 className="text-3xl font-black text-amber-600 mt-2 tracking-tighter">
                        {lowStockCount}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={48} className="text-rose-400" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        Out of Stock <AlertTriangle size={12} className="text-rose-500" />
                    </p>
                    <h3 className="text-3xl font-black text-rose-600 mt-2 tracking-tighter">
                        {outOfStockCount}
                    </h3>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-xl flex items-center gap-4 mb-6 border border-slate-200 shadow-sm">
                <Search className="text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name or SKU..." 
                    className="bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4 font-black">Material Identifier</th>
                                <th className="px-6 py-4 font-black">SKU Prefix</th>
                                <th className="px-6 py-4 font-black">Current Stock</th>
                                <th className="px-6 py-4 font-black">Availability</th>
                                <th className="px-6 py-4 font-black">Valuation</th>
                                <th className="px-6 py-4 font-black text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-20 text-slate-500"><Loader2 className="animate-spin mx-auto mb-2 text-indigo-600" /> Loading materials...</td></tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-20 text-slate-500">No materials found in registry.</td></tr>
                            ) : filteredMaterials.map((material) => {
                                const currentStatus = calculateStockStatus(material.quantity, material.min_stock_level);
                                return (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        key={material.id || material._id} 
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="font-black text-slate-900">{material.name}</div>
                                            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{material.category}</div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500 font-mono text-[11px] font-black">{material.sku}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900">{material.quantity}</span>
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{material.unit}</span>
                                            </div>
                                            <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full ${currentStatus === 'In Stock' ? 'bg-emerald-500' : currentStatus === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                    style={{ width: `${Math.min((material.quantity / (material.min_stock_level * 2)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStockStatusClasses(currentStatus)}`}>
                                                {currentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-900 font-black tracking-tighter">${Number(material.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isAdmin && (
                                                    <button 
                                                        onClick={() => handleOpenHistoryModal(material)}
                                                        title="View Stock History"
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 shadow-sm"
                                                    >
                                                        <History size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleOpenStockModal(material)}
                                                    title="Adjust stock quantity"
                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-white rounded-xl border border-transparent hover:border-blue-100 shadow-sm"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                                {!isEmployee && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenModal(material)}
                                                            className="text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 shadow-sm"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {!isManager && (
                                                            <button 
                                                                onClick={() => handleDelete(material.id)}
                                                                className="text-slate-400 hover:text-rose-600 transition-colors p-2 hover:bg-white rounded-xl border border-transparent hover:border-rose-100 shadow-sm"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <MaterialModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMaterial}
                material={selectedMaterial}
                loading={modalLoading}
                existingCategories={categories}
            />

            <StockUpdateModal 
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                onSave={handleUpdateStock}
                material={stockTarget}
                loading={modalLoading}
            />

            <StockHistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                material={historyTarget}
            />
        </div>
    );
};

export default MaterialTracking;
