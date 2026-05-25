import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Lock, Shield, UserPlus, LogIn, Copy, CheckCheck, AlertTriangle, Key } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

export default function AdminLogin() {
    const { isDarkMode }  = useContext(ThemeContext);
    const { loginDirect } = useContext(AuthContext);
    const navigate        = useNavigate();

    const [mode,         setMode]         = useState('login');
    const [status,       setStatus]       = useState(null);
    const [isLoading,    setIsLoading]    = useState(false);
    const [generatedKey, setGeneratedKey] = useState(null);
    const [copied,       setCopied]       = useState(false);

    const [form, setForm] = useState({ fullName: '', email: '', password: '', encryptionKey: '', masterPassword: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);
        setGeneratedKey(null);
        try {
            if (mode === 'login') {
                const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/login`, {
                    email: form.email, password: form.password, encryptionKey: form.encryptionKey
                });
                if (data.success) {
                    loginDirect({ ...data.admin, token: data.token });
                    setStatus({ type: 'success', message: 'Access granted — redirecting…' });
                    setTimeout(() => navigate('/admin'), 1200);
                }
            } else {
                const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/signup`, {
                    fullName: form.fullName, email: form.email, password: form.password, masterPassword: form.masterPassword
                });
                if (data.success) {
                    setGeneratedKey(data.encryptionKey);
                    setStatus({ type: 'success', message: data.message });
                }
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'An error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    /* ── Dynamic surface vars ─────────────────────────────────────────────── */
    const surface  = isDarkMode ? 'rgba(10,10,20,0.97)'        : 'rgba(255,255,255,0.98)';
    const border   = isDarkMode ? 'rgba(200,162,200,0.12)'     : 'rgba(128,0,32,0.1)';
    const inputBg  = isDarkMode ? 'rgba(255,255,255,0.04)'     : 'rgba(0,0,0,0.03)';
    const inputBdr = isDarkMode ? 'rgba(255,255,255,0.09)'     : 'rgba(0,0,0,0.1)';
    const labelCol = isDarkMode ? '#9ca3af'                    : '#6b7280';
    const textCol  = isDarkMode ? '#f3f4f6'                    : '#111827';

    const inputStyle = {
        width: '100%', background: inputBg, border: `1px solid ${inputBdr}`,
        borderRadius: '2.5rem', color: textCol, padding: '0.875rem 1.5rem',
        fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', outline: 'none',
        transition: 'all 0.3s ease',
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: isDarkMode ? 'linear-gradient(135deg,#06060f 0%,#0d0d1a 100%)' : 'linear-gradient(135deg,#f8f8ff 0%,#ece9f7 100%)' }}>

            {/* Background aurora orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-10 animate-aurora"
                    style={{ background: 'radial-gradient(circle, #800020, transparent 70%)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-8 animate-aurora delay-300"
                    style={{ background: 'radial-gradient(circle, #c8a2c8, transparent 70%)' }} />
                <div className="absolute top-[40%] right-[20%] w-[25vw] h-[25vw] rounded-full opacity-6 animate-aurora delay-500"
                    style={{ background: 'radial-gradient(circle, #00a86b, transparent 70%)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="relative w-full max-w-md z-10"
            >
                {/* Shield header */}
                <div className="text-center mb-7">
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
                        style={{
                            background: 'linear-gradient(135deg,#800020,#c8a2c8)',
                            boxShadow: '0 16px 40px rgba(128,0,32,0.4), 0 0 60px rgba(200,162,200,0.15)',
                        }}
                    >
                        <Shield size={36} className="text-white" />
                        {/* spinning ring */}
                        <div className="absolute inset-[-4px] rounded-3xl border-2 border-dashed animate-spin-slow"
                            style={{ borderColor: 'rgba(200,162,200,0.3)' }} />
                    </motion.div>
                    <h1 className="text-3xl font-bold mb-1" style={{ color: textCol, fontFamily: 'Outfit, sans-serif' }}>
                        Command Center
                    </h1>
                    <p className="text-xs uppercase tracking-widest" style={{ color: labelCol }}>
                        ZA.go — Dual-Factor Secure Access
                    </p>
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-full p-1.5 mb-6"
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', border: `1px solid ${border}` }}>
                    {[
                        { key: 'login',  label: 'Admin Login',    icon: <LogIn size={14} /> },
                        { key: 'signup', label: 'Register Admin', icon: <UserPlus size={14} /> },
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => { setMode(key); setStatus(null); setGeneratedKey(null); }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all duration-400"
                            style={{
                                background: mode === key
                                    ? 'linear-gradient(135deg,#800020,#c8a2c8)'
                                    : 'transparent',
                                color: mode === key ? '#fff' : labelCol,
                                boxShadow: mode === key ? '0 10px 20px rgba(128,0,32,0.3)' : 'none',
                            }}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                {/* Card */}
                <div className="p-8 rounded-3xl relative overflow-hidden"
                    style={{ background: surface, border: `1px solid ${border}`, boxShadow: isDarkMode ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,162,200,0.08)' : '0 24px 60px rgba(0,0,0,0.12)' }}>

                    {/* Orb decoration inside card */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-15 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(200,162,200,0.6), transparent 70%)' }} />

                    {/* Status banner */}
                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-5 p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2.5"
                                style={{
                                    background: status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(0,168,107,0.1)',
                                    border: status.type === 'error' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(0,168,107,0.25)',
                                    color: status.type === 'error' ? '#f87171' : '#34d399',
                                }}
                            >
                                {status.type === 'error' ? <AlertTriangle size={15} /> : <CheckCheck size={15} />}
                                {status.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* One-time key display */}
                    <AnimatePresence>
                        {generatedKey && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-4 rounded-2xl"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                            >
                                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Key size={13} /> Your Encryption Key — Save It Now!
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-amber-300 text-xs break-all flex-1 p-2.5 rounded-xl"
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        {generatedKey}
                                    </p>
                                    <button onClick={handleCopy}
                                        className="p-2.5 rounded-xl transition-all flex-shrink-0"
                                        style={{ background: copied ? 'rgba(0,168,107,0.2)' : 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: copied ? '#34d399' : '#f59e0b' }}>
                                        {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-amber-600/70 text-[10px] mt-2 italic">
                                    This key will NEVER be shown again. Store it securely.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                        {/* Signup-only: Full Name */}
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div key="fullName" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: labelCol }}>Full Name</label>
                                    <input name="fullName" type="text" placeholder="Jane Doe" value={form.fullName} onChange={handleChange} style={inputStyle} required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: labelCol }}>Email Address</label>
                            <input name="email" type="email" placeholder="admin@za.go.ke" value={form.email} onChange={handleChange} style={inputStyle} required />
                        </div>

                        {/* Password */}
                        <PasswordInput name="password" label="Password" value={form.password} onChange={handleChange} placeholder="••••••••••••" required />

                        {/* Login-only: AES key */}
                        <AnimatePresence>
                            {mode === 'login' && (
                                <motion.div key="encKey" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <PasswordInput name="encryptionKey" label="AES-256 Encryption Key" value={form.encryptionKey} onChange={handleChange} placeholder="Your 64-character hex key" inputClassName="font-mono text-sm" required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Signup-only: Master password */}
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div key="masterPw" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <PasswordInput name="masterPassword" label="Master Password" value={form.masterPassword} onChange={handleChange} placeholder="Provided by system owner" required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 w-full py-4 rounded-full font-black tracking-[0.2em] uppercase text-white flex items-center justify-center gap-3 transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                            style={{
                                background: isLoading
                                    ? 'rgba(128,0,32,0.4)'
                                    : 'linear-gradient(135deg,#800020 0%,#a0002a 50%,#c8a2c8 100%)',
                                boxShadow: isLoading ? 'none' : '0 12px 30px rgba(128,0,32,0.5), 0 0 0 1px rgba(200,162,200,0.15)',
                            }}
                        >
                            {/* shimmer sweep */}
                            {!isLoading && <span className="absolute inset-0 btn-shimmer pointer-events-none" />}
                            {isLoading
                                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Lock size={18} /> {mode === 'login' ? 'Authenticate' : 'Secure Register'}</>
                            }
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-[11px] mt-5" style={{ color: labelCol }}>
                    Dual-Factor Authentication · ZA.go Security Protocol v2.0
                </p>
            </motion.div>
        </div>
    );
}
