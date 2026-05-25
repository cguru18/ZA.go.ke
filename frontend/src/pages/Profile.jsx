import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { Download, User, Mail, Lock, TrendingUp, Package, CheckCircle, Clock } from 'lucide-react';

export default function Profile() {
    const { user } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (!user) return;
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/transactions`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(r => setTransactions(r.data))
            .catch(() => {});
    }, [user]);

    const handleDownload = async () => {
        try {
            const r = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/transactions/download`, { headers: { Authorization: `Bearer ${user.token}` }, responseType: 'blob' });
            const a = Object.assign(document.createElement('a'), { href: window.URL.createObjectURL(new Blob([r.data])), download: 'transactions.csv' });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } catch {}
    };

    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
            <User size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-semibold">Please login to view your profile</p>
        </div>
    );

    const totalSpend = transactions.reduce((a, t) => a + (Number(t.totalAmount) || 0), 0);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.h2 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="font-graffiti text-4xl mb-8" style={{ color: '#800020', textShadow: '0 0 20px rgba(128,0,32,0.3)' }}>
                Your Profile
            </motion.h2>

            {/* Profile card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-6 mb-6 rounded-3xl relative overflow-hidden"
                style={{ background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(200,162,200,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle,#c8a2c8,transparent)' }} />
                <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#800020,#c8a2c8)', boxShadow: '0 8px 20px rgba(128,0,32,0.4)' }}>
                        {(user.fullName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xl font-bold text-white">{user.fullName}</p>
                        <p className="text-sm text-gray-500">ZA.go Member</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: <User size={14} />, label: 'Full Name', value: user.fullName },
                        { icon: <Mail size={14} />, label: 'Email', value: user.email },
                        { icon: <Lock size={14} />, label: 'Password', value: '••••••••' },
                    ].map(({ icon, label, value }) => (
                        <div key={label} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2 mb-1.5" style={{ color: '#00a86b' }}>
                                {icon}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                            </div>
                            <p className="text-white font-semibold truncate">{value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                    { icon: <Package size={16} />, label: 'Total Orders', value: transactions.length, color: '#c8a2c8' },
                    { icon: <TrendingUp size={16} />, label: 'Total Spent', value: `KSh ${totalSpend.toLocaleString()}`, color: '#00a86b' },
                ].map(({ icon, label, value, color }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                        className="p-5 rounded-2xl" style={{ background: 'rgba(13,13,26,0.85)', border: `1px solid ${color}22` }}>
                        <div className="flex items-center gap-2 mb-2" style={{ color }}>
                            {icon}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                        </div>
                        <p className="text-2xl font-black text-white">{value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Transaction history */}
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-graffiti text-2xl" style={{ color: '#00a86b' }}>Transaction History</h3>
                <button onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg,#007a4e,#00a86b)', boxShadow: '0 4px 16px rgba(0,168,107,0.35)' }}>
                    <Download size={15} /> Download CSV
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <Package size={40} className="mx-auto mb-3 opacity-20" />
                        <p>No previous purchases found.</p>
                    </div>
                ) : transactions.map((tx, i) => (
                    <motion.div key={tx._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,168,107,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                        <div>
                            <p className="font-bold text-white mb-1">Order #{tx._id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {tx.items?.map((item, idx) => (
                                    <span key={idx} className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                                        style={{ background: 'rgba(200,162,200,0.1)', border: '1px solid rgba(200,162,200,0.2)', color: '#c8a2c8' }}>
                                        {item.name} ×{item.qty}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xl font-black mb-1" style={{ color: '#00a86b' }}>KSh {tx.totalAmount?.toLocaleString()}</p>
                            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 justify-end"
                                style={{ color: tx.status === 'Paid' ? '#00a86b' : '#f59e0b' }}>
                                {tx.status === 'Paid' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                {tx.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
