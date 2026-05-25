import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, ArrowRight, Check, Leaf, MapPin, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

/* ─── Password strength checker ───────────────────────────────────────────── */
function getPasswordStrength(pwd) {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)           score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const map = [
        { label: 'Too short',  color: '#ef4444' },
        { label: 'Weak',       color: '#f97316' },
        { label: 'Fair',       color: '#eab308' },
        { label: 'Good',       color: '#22c55e' },
        { label: 'Strong',     color: '#00a86b' },
    ];
    return { score, ...map[score] };
}

/* ─── Brand panel perks ───────────────────────────────────────────────────── */
const PERKS = [
    { icon: <Leaf  size={15} />, text: 'Curated premium products' },
    { icon: <MapPin size={15} />, text: 'Real-time Nairobi delivery' },
    { icon: <Star  size={15} />, text: 'VIP infused menu access' },
];

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading,  setLoading]  = useState(false);
    const { signup }              = useContext(AuthContext);
    const navigate                = useNavigate();

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            await signup(fullName, email, password);
            navigate('/');
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Signup failed. Please try again.');
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
                className="w-full max-w-4xl flex rounded-3xl overflow-hidden"
                style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,168,107,0.1)' }}
            >
                {/* ── Left Brand Panel (Jade theme) ──────────────────────── */}
                <div
                    className="hidden md:flex flex-col justify-between p-10 w-5/12 relative overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, #001a0e 0%, #002d18 40%, #0a0d1a 100%)' }}
                >
                    {/* Aurora blobs */}
                    <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-20 animate-aurora"
                         style={{ background: 'radial-gradient(circle, #00a86b, transparent 70%)' }} />
                    <div className="absolute bottom-[-40px] left-[-40px] w-56 h-56 rounded-full opacity-15 animate-aurora delay-300"
                         style={{ background: 'radial-gradient(circle, #c8a2c8, transparent 70%)' }} />
                    <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full opacity-10 animate-aurora delay-500"
                         style={{ background: 'radial-gradient(circle, #800020, transparent 70%)' }} />

                    {/* Header */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                             style={{ background: 'rgba(0,168,107,0.12)', border: '1px solid rgba(0,168,107,0.25)' }}>
                            <span className="w-2 h-2 rounded-full bg-jade animate-blink" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-jade/80">Join Today</span>
                        </div>
                        <h1 className="font-graffiti text-5xl text-white mb-2 text-glow-jade" style={{ lineHeight: 1.1 }}>
                            ZA<span className="text-jade">.</span>go
                        </h1>
                        <p className="text-gray-400 text-sm font-light leading-relaxed">
                            Create your profile and unlock<br />the full ZA.go experience.
                        </p>
                    </div>

                    {/* Perks */}
                    <div className="relative z-10 space-y-4">
                        {PERKS.map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3 text-sm text-gray-300"
                            >
                                <span className="flex-shrink-0 p-1.5 rounded-lg text-jade"
                                      style={{ background: 'rgba(0,168,107,0.12)', border: '1px solid rgba(0,168,107,0.2)' }}>
                                    {p.icon}
                                </span>
                                {p.text}
                            </motion.div>
                        ))}
                    </div>

                    {/* Step indicator (cosmetic) */}
                    <div className="relative z-10 flex items-center gap-2">
                        <span className="w-8 h-1 rounded-full bg-jade" />
                        <span className="w-4 h-1 rounded-full bg-jade/30" />
                        <span className="w-4 h-1 rounded-full bg-jade/30" />
                        <span className="text-[10px] text-gray-600 ml-2 font-medium uppercase tracking-widest">Step 1 of 1</span>
                    </div>
                </div>

                {/* ── Right Form Panel ─────────────────────────────────────── */}
                <div
                    className="flex-1 flex flex-col justify-center p-8 md:p-12"
                    style={{ background: 'rgba(10,10,20,0.97)', borderLeft: '1px solid rgba(0,168,107,0.08)' }}
                >
                    <div className="max-w-sm mx-auto w-full">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mb-8"
                        >
                            <h2 className="text-3xl font-bold text-white mb-1.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Create profile
                            </h2>
                            <p className="text-gray-500 text-sm">Your ZA.go journey starts here</p>
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

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Full Name */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative"
                            >
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
                                <input
                                    id="signup-fullname"
                                    type="text"
                                    placeholder="Full Name (as per ID)"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="input-premium pl-11"
                                    required
                                    autoComplete="name"
                                />
                            </motion.div>

                            {/* Email */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="relative"
                            >
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
                                <input
                                    id="signup-email"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-premium pl-11"
                                    required
                                    autoComplete="email"
                                />
                            </motion.div>

                            {/* Password + Strength Meter */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2.5"
                            >
                                <PasswordInput
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Choose a strong password"
                                    required
                                />

                                {/* Strength meter */}
                                {password && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-1.5"
                                    >
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((s) => (
                                                <div
                                                    key={s}
                                                    className="flex-1 h-1 rounded-full transition-all duration-500"
                                                    style={{
                                                        background: s <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                                                {strength.label}
                                            </span>
                                            {strength.score >= 3 && (
                                                <span className="text-[10px] text-jade flex items-center gap-1">
                                                    <Check size={10} /> Secure
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* CTA */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                type="submit"
                                disabled={loading}
                                className="btn-shimmer relative mt-2 w-full py-3.5 rounded-2xl font-bold tracking-wide text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: loading
                                        ? 'rgba(0,168,107,0.4)'
                                        : 'linear-gradient(135deg, #007a4e 0%, #00a86b 60%, #00d48a 100%)',
                                    boxShadow: loading ? 'none' : '0 8px 24px rgba(0,168,107,0.4), 0 0 0 1px rgba(0,212,138,0.15)',
                                }}
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Profile <ArrowRight size={16} />
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

                        {/* Login link */}
                        <p className="text-center text-sm text-gray-500">
                            Already have a profile?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-burgundy hover:text-burgundy-light font-semibold transition-colors"
                                style={{ color: '#c8a2c8' }}
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
