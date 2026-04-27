import React from 'react';
import { motion } from 'framer-motion';
import { 
    Briefcase, Calendar, DollarSign, 
    MoreVertical, ChevronRight, AlertCircle,
    User, CheckCircle2, XCircle
} from 'lucide-react';

const DealKanban = ({ deals, onUpdateStage, actionLoading }) => {
    const stages = ['Prospecting', 'Negotiation', 'Final', 'Won', 'Lost'];

    const getStageDeals = (stage) => deals.filter(deal => deal.stage === stage);

    const getPriorityColor = (amount) => {
        if (amount > 100000) return 'border-fuchsia-500';
        if (amount > 50000) return 'border-indigo-500';
        return 'border-slate-200';
    };

    return (
        <div className="flex gap-6 overflow-x-auto pb-10 min-h-[70vh] scrollbar-hide">
            {stages.map((stage) => {
                const stageDeals = getStageDeals(stage);
                const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);

                return (
                    <div key={stage} className="flex-shrink-0 w-[350px]">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">{stage}</h3>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-lg">
                                    {stageDeals.length}
                                </span>
                            </div>
                            <p className="text-slate-900 font-black text-sm">₹{stageTotal.toLocaleString()}</p>
                        </div>

                        <div className="space-y-4 min-h-[500px] bg-slate-50/50 rounded-[32px] p-4 border border-slate-100/50">
                            {stageDeals.map((deal) => (
                                <motion.div
                                    layoutId={deal._id}
                                    key={deal._id}
                                    className={`bg-white p-6 rounded-[24px] border-l-4 ${getPriorityColor(deal.amount)} shadow-sm hover:shadow-xl transition-all cursor-pointer group relative`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Briefcase size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                                                {deal.customer_id?.name || deal.prospect_name || 'Prospect'}
                                            </span>
                                        </div>
                                        <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>

                                    <h4 className="text-[15px] font-black text-slate-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {deal.title}
                                    </h4>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="space-y-1">
                                            <p className="text-indigo-600 font-black text-lg">₹{deal.amount.toLocaleString()}</p>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                                <Calendar size={10} /> 
                                                {new Date(deal.expected_close_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {stage !== 'Won' && stage !== 'Lost' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onUpdateStage(deal._id, 'Won');
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    title="Finalize Won"
                                                >
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* SLA Warning Placeholder */}
                                    {new Date(deal.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000) && stage === 'Prospecting' && (
                                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-pulse">
                                            <AlertCircle size={12} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {stageDeals.length === 0 && (
                                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[24px] text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                    Empty Stage
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DealKanban;
