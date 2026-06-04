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
                className="relative w-full max-w-md z-10 stitch-theme"
            >
                {/* Shield header */}
                <div className="text-center mb-7">
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-lg mb-4 relative"
                        style={{
                            background: 'linear-gradient(135deg,#25C2A0,#00e5ff)',
                            boxShadow: '0 16px 40px rgba(37,194,160,0.25), 0 0 60px rgba(0,229,255,0.1)',
                        }}
                    >
                        <Shield size={36} className="text-[#00382c]" />
                        {/* spinning ring */}
                        <div className="absolute inset-[-4px] rounded-lg border border-dashed animate-spin-slow"
                            style={{ borderColor: 'rgba(0,229,255,0.3)' }} />
                    </motion.div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: textCol, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
                        Command Center
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.1em] font-bold" style={{ color: '#bbcac3' }}>
                        ZA.go — Dual-Factor Secure Access
                    </p>
                </div>

                {/* Mode toggle */}
                <div className="flex rounded-md p-1 mb-6 border border-[#3c4a45] bg-[#0c0e11]">
                    {[
                        { key: 'login',  label: 'Admin Login',    icon: <LogIn size={14} /> },
                        { key: 'signup', label: 'Register Admin', icon: <UserPlus size={14} /> },
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => { setMode(key); setStatus(null); setGeneratedKey(null); }}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300"
                            style={{
                                background: mode === key ? '#25C2A0' : 'transparent',
                                color: mode === key ? '#00382c' : '#bbcac3',
                                boxShadow: mode === key ? '0 0 10px rgba(37,194,160,0.2)' : 'none',
                                borderRadius: '4px'
                            }}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                {/* Card */}
                <div className="p-8 rounded-lg relative overflow-hidden border border-[#3c4a45] bg-[#111316] shadow-2xl">

                    {/* Orb decoration inside card */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-5 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.4), transparent 70%)' }} />

                    {/* Status banner */}
                    <AnimatePresence>
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-5 p-3 rounded-sm text-xs font-semibold flex items-center gap-2.5 font-mono"
                                style={{
                                    background: status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(37,194,160,0.1)',
                                    border: status.type === 'error' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(37,194,160,0.25)',
                                    color: status.type === 'error' ? '#f87171' : '#4fdebb',
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
                                className="mb-5 p-4 rounded-sm"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                            >
                                <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                                    <Key size={13} /> Your Encryption Key — Save It Now!
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-amber-300 text-xs break-all flex-1 p-2.5 rounded-sm"
                                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        {generatedKey}
                                    </p>
                                    <button onClick={handleCopy}
                                        className="p-2.5 rounded-sm transition-all flex-shrink-0"
                                        style={{ background: copied ? 'rgba(0,168,107,0.2)' : 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: copied ? '#34d399' : '#f59e0b' }}>
                                        {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-amber-600/70 text-[10px] mt-2 italic font-mono">
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
                                    <label className="block label-caps mb-2">Full Name</label>
                                    <input name="fullName" type="text" placeholder="Jane Doe" value={form.fullName} onChange={handleChange} className="input-technical w-full" required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div>
                            <label className="block label-caps mb-2">Email Address</label>
                            <input name="email" type="email" placeholder="admin@za.go.ke" value={form.email} onChange={handleChange} className="input-technical w-full" required />
                        </div>

                        {/* Password */}
                        <PasswordInput name="password" label="Password" value={form.password} onChange={handleChange} placeholder="••••••••••••" inputClassName="input-technical" required />

                        {/* Login-only: AES key */}
                        <AnimatePresence>
                            {mode === 'login' && (
                                <motion.div key="encKey" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <PasswordInput name="encryptionKey" label="AES-256 Encryption Key" value={form.encryptionKey} onChange={handleChange} placeholder="Your 64-character hex key" inputClassName="input-technical font-mono text-sm" required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Signup-only: Master password */}
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div key="masterPw" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <PasswordInput name="masterPassword" label="Master Password" value={form.masterPassword} onChange={handleChange} placeholder="Provided by system owner" inputClassName="input-technical" required />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 w-full btn-stitch-primary py-4 text-xs font-bold font-mono tracking-widest uppercase text-[#00382c]"
                        >
                            {isLoading
                                ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                : <><Lock size={14} /> {mode === 'login' ? 'Authenticate' : 'Secure Register'}</>
                            }
                        </button>
                    </form>
                </div>

                <p className="text-center font-mono text-[10px] mt-5" style={{ color: '#bbcac3' }}>
                    Dual-Factor Authentication · ZA.go Security Protocol v2.0
                </p>
            </motion.div>
        </div>
    );
}
