import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(username, email, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#f5f7fa] px-4 font-['Inter']">
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[440px]"
            >
                {/* Logo or Brand Mark */}
                <div className="flex justify-center mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <UserPlus className="text-white" size={24} />
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[28px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 mt-2 text-sm">Join the tracking & management portal</p>
                    </div>

                {error && (
                    <div className="bg-rose-50 p-4 rounded-xl flex items-center gap-3 mb-8 border border-rose-100">
                        <AlertCircle className="text-rose-500 shrink-0" size={18} />
                        <p className="text-rose-700 text-xs font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                placeholder="john_doe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-widest mb-2 px-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 mt-2 ring-offset-2 focus:ring-2 focus:ring-indigo-500"
                    >
                        {loading ? <Loader className="animate-spin text-white" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-50 text-center">
                    <p className="text-slate-500 text-sm">
                        Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">Sign in here</Link>
                    </p>
                </div>
                </div>
                
                {/* Footer Info */}
                <p className="text-center text-slate-400 text-xs mt-10 tracking-wide font-medium uppercase">
                    Smart Material Tracking &copy; 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
