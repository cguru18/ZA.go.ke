import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Leaf, Zap, Shield } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

/* ─── Animated brand panel features list ──────────────────────────────────── */
const FEATURES = [
    { icon: <Leaf size={16} />, text: 'Premium infused product range' },
    { icon: <Zap  size={16} />, text: 'Live GPS courier tracking' },
    { icon: <Shield size={16} />, text: 'Secure 24-hour access vault' },
];

export default function Login() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading,  setLoading]  = useState(false);
    const { login }               = useContext(AuthContext);
    const navigate                = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-full py-8">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-2xl"
                style={{
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,162,200,0.1)',
                }}
            >
                {/* ── Left Brand Panel ─────────────────────────────────────── */}
                <div
                    className="hidden md:flex flex-col justify-between p-10 w-5/12 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(145deg, #1a0a12 0%, #2d0a1a 40%, #0a0d1a 100%)',
                    }}
                >
                    {/* Animated aurora blobs */}
                    <div
                        className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-20 animate-aurora"
                        style={{ background: 'radial-gradient(circle, #800020, transparent 70%)' }}
                    />
                    <div
                        className="absolute bottom-[-40px] left-[-40px] w-56 h-56 rounded-full opacity-15 animate-aurora delay-300"
                        style={{ background: 'radial-gradient(circle, #c8a2c8, transparent 70%)' }}
                    />
                    <div
                        className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-10 animate-aurora delay-500"
                        style={{ background: 'radial-gradient(circle, #00a86b, transparent 70%)' }}
                    />

                    {/* Logo area */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                             style={{ background: 'rgba(200,162,200,0.1)', border: '1px solid rgba(200,162,200,0.2)' }}>
                            <span className="w-2 h-2 rounded-full bg-jade animate-blink" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-jade/80">Live Platform</span>
                        </div>
                        <h1 className="font-graffiti text-5xl text-white mb-2 text-glow-burgundy" style={{ lineHeight: 1.1 }}>
                            ZA<span className="text-lilac">.</span>go
                        </h1>
                        <p className="text-gray-400 text-sm font-light leading-relaxed">
                            Nairobi's premier premium<br />delivery experience.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="relative z-10 space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                                className="flex items-center gap-3 text-sm text-gray-300"
                            >
                                <span className="flex-shrink-0 p-1.5 rounded-lg text-lilac"
                                      style={{ background: 'rgba(200,162,200,0.12)', border: '1px solid rgba(200,162,200,0.15)' }}>
                                    {f.icon}
                                </span>
                                {f.text}
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom gradient border */}
                    <div className="absolute bottom-0 right-0 w-px h-full"
                         style={{ background: 'linear-gradient(180deg, transparent, rgba(200,162,200,0.15), transparent)' }} />
                </div>

                {/* ── Right Form Panel ─────────────────────────────────────── */}
                <div
                    className="flex-1 flex flex-col justify-center p-8 md:p-12"
                    style={{ background: 'rgba(10,10,20,0.97)', borderLeft: '1px solid rgba(200,162,200,0.08)' }}
                >
                    <div className="max-w-sm mx-auto w-full">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                            className="mb-8"
                        >
                            <h2 className="text-3xl font-bold text-white mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Welcome back
                            </h2>
                            <p className="text-gray-500 text-sm">Sign in to your ZA.go account</p>
                        </motion.div>

                        {/* Error banner */}
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3.5 rounded-2xl text-sm font-medium text-red-300 flex items-center gap-2.5"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                <span className="w-4 h-4 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 text-[10px]">!</span>
                                {errorMsg}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Email */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative"
                            >
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-premium pl-11"
                                    required
                                    autoComplete="email"
                                />
                            </motion.div>

                            {/* Password */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <PasswordInput
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </motion.div>

                            {/* Forgot password */}
                            <div className="text-right -mt-1">
                                <button type="button" className="text-xs text-lilac/70 hover:text-lilac transition-colors">
                                    Forgot password?
                                </button>
                            </div>

                            {/* CTA */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                type="submit"
                                disabled={loading}
                                className="btn-shimmer relative mt-2 w-full py-3.5 rounded-2xl font-bold tracking-wide text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: loading
                                        ? 'rgba(128,0,32,0.5)'
                                        : 'linear-gradient(135deg, #800020 0%, #a0002a 50%, #c8a2c8 100%)',
                                    boxShadow: loading ? 'none' : '0 8px 24px rgba(128,0,32,0.4), 0 0 0 1px rgba(200,162,200,0.15)',
                                }}
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={16} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <span className="text-xs text-gray-600 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        </div>

                        {/* Sign up link */}
                        <p className="text-center text-sm text-gray-500">
                            New to ZA.go?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/signup')}
                                className="text-jade hover:text-jade-light font-semibold transition-colors"
                            >
                                Create account
                            </button>
                        </p>

                        {/* Admin link */}
                        <p className="text-center text-xs text-gray-700 mt-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin-login')}
                                className="hover:text-gray-500 transition-colors flex items-center gap-1 mx-auto"
                            >
                                <Shield size={11} /> Admin access
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
