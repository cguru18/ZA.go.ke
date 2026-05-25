import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, X, Phone, Zap, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Checkout() {
    const { cart, cartTotal, clearCart, removeFromCart } = useContext(CartContext);
    const { user }    = useContext(AuthContext);
    const navigate    = useNavigate();
    const [phone, setPhone]   = useState('');
    const [status, setStatus] = useState(null);
    const [progress, setProgress] = useState(0);
    const [processing, setProcessing] = useState(false);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!user) { setStatus({ type: 'error', message: 'Please login to checkout.' }); return; }
        if (cart.length === 0) { setStatus({ type: 'error', message: 'Your cart is empty.' }); return; }

        setProcessing(true); setProgress(25);
        setStatus({ type: 'info', message: 'Fetching your location...' });

        if (!navigator.geolocation) {
            setStatus({ type: 'error', message: 'Geolocation is not supported by your browser.' });
            setProcessing(false); setProgress(0); return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setStatus({ type: 'info', message: 'Validating location (Nairobi County)…' });
            
            try {
                const loc = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logistics/validate-location`, { userLat: userCoords.lat, userLng: userCoords.lng });
                if (!loc.data.safeZone) { setStatus({ type: 'error', message: loc.data.message }); setProcessing(false); setProgress(0); return; }

                setProgress(75); setStatus({ type: 'info', message: 'Initiating M-Pesa STK Push… Check your phone' });
                const pay = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/stkpush`,
                    { phone, amount: cartTotal, userId: user._id, items: cart.map(c => ({ name: c.title, qty: c.qty, price: c.price })) },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );

                const transactionId = pay.data.transactionId;
                
                // Poll for the mock Webhook result
                const pollInterval = setInterval(async () => {
                    const statusRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/status/${transactionId}`);
                    if (statusRes.data.status === 'Paid') {
                        clearInterval(pollInterval);
                        setProgress(100); setStatus({ type: 'success', message: 'Payment Confirmed! Order Placed.' });
                        clearCart(); setProcessing(false);
                        setTimeout(() => navigate('/profile'), 3000);
                    } else if (statusRes.data.status === 'Failed') {
                        clearInterval(pollInterval);
                        setStatus({ type: 'error', message: 'Payment Failed.' });
                        setProcessing(false); setProgress(0);
                    }
                }, 2000);

            } catch (err) {
                setStatus({ type: 'error', message: err.response?.data?.message || 'Checkout failed.' });
                setProcessing(false); setProgress(0);
            }
        }, (error) => {
            setStatus({ type: 'error', message: 'Failed to access location. Please enable location services.' });
            setProcessing(false); setProgress(0);
        });
    };

    const statusConfig = {
        error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  color: '#f87171', icon: <AlertCircle size={15} /> },
        success: { bg: 'rgba(0,168,107,0.1)',  border: 'rgba(0,168,107,0.25)',  color: '#34d399', icon: <CheckCircle size={15} /> },
        info:    { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', color: '#93c5fd', icon: <Info size={15} /> },
    };

    return (
        <div className="max-w-5xl mx-auto">
            <motion.h2 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                className="font-graffiti text-4xl mb-8" style={{ color: '#800020', textShadow: '0 0 20px rgba(128,0,32,0.3)' }}>
                Your Cart
            </motion.h2>

            <div className="flex flex-col lg:flex-row gap-7">
                {/* ── Cart items ── */}
                <div className="flex-1">
                    {cart.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 rounded-3xl"
                            style={{ background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <ShoppingBag size={48} className="mb-4 opacity-20 text-gray-500" />
                            <p className="text-gray-500 text-lg font-semibold">Your cart is empty</p>
                            <button onClick={() => navigate('/')} className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                                style={{ background: 'linear-gradient(135deg,#800020,#c8a2c8)', boxShadow: '0 4px 16px rgba(128,0,32,0.3)' }}>
                                Browse Products
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {cart.map((item, i) => (
                                    <motion.div key={item._id}
                                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-5 rounded-2xl flex justify-between items-center gap-4 transition-all duration-300"
                                        style={{ background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,168,107,0.25)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white truncate">{item.title}</h4>
                                            <p className="text-sm mt-0.5" style={{ color: '#00a86b' }}>KSh {item.price?.toLocaleString()} × {item.qty}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="text-lg font-black text-white">KSh {(item.price * item.qty).toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(item._id)}
                                                className="p-1.5 rounded-xl transition-all hover:scale-110"
                                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Total */}
                            <div className="p-5 rounded-2xl flex justify-between items-center mt-2"
                                style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.2)' }}>
                                <span className="text-gray-400 font-semibold uppercase tracking-widest text-sm">Total</span>
                                <span className="text-3xl font-black" style={{ color: '#00a86b' }}>KSh {cartTotal?.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Payment panel ── */}
                <div className="w-full lg:w-96">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="p-7 rounded-3xl relative overflow-hidden"
                        style={{
                            background: 'rgba(10,10,20,0.95)',
                            border: progress === 100 ? '1px solid rgba(0,168,107,0.5)' : '1px solid rgba(255,255,255,0.08)',
                            boxShadow: progress === 100 ? '0 0 40px rgba(0,168,107,0.2)' : '0 8px 32px rgba(0,0,0,0.5)',
                            transition: 'all 0.5s ease',
                        }}>

                        {/* M-Pesa watermark */}
                        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                            <svg width="140" height="140" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="#4CAF50" />
                                <path d="M30 50 L45 65 L70 35" stroke="white" strokeWidth="10" fill="none" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"
                            style={{ background: 'linear-gradient(135deg,#00a86b,#c8a2c8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            <Zap size={18} className="text-jade" style={{ WebkitTextFillColor: '#00a86b' }} /> M-Pesa Express
                        </h3>

                        {/* Status */}
                        <AnimatePresence>
                            {status && (
                                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="mb-5 p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2.5"
                                    style={{ background: statusConfig[status.type]?.bg, border: `1px solid ${statusConfig[status.type]?.border}`, color: statusConfig[status.type]?.color }}>
                                    {statusConfig[status.type]?.icon} {status.message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleCheckout} className="flex flex-col gap-5 relative z-10">
                            {/* Phone input */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Phone Number</label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                                    <input type="text" placeholder="2547XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                                        disabled={processing || progress === 100}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl font-mono text-base outline-none transition-all"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                                            color: '#fff', fontSize: '1rem',
                                        }}
                                        required />
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${progress}%`, background: progress === 100 ? '#00a86b' : 'linear-gradient(90deg,#800020,#00a86b)', boxShadow: progress === 100 ? '0 0 12px rgba(0,168,107,0.8)' : 'none' }} />
                                </div>
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                    {['Initiated', 'Awaiting PIN', 'Confirmed'].map((step, i) => {
                                        const threshold = [25, 75, 100][i];
                                        return <span key={step} style={{ color: progress >= threshold ? '#00a86b' : '#4b5563' }}>{step}</span>;
                                    })}
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={cart.length === 0 || processing || progress === 100}
                                className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: progress === 100
                                        ? '#00a86b'
                                        : cart.length === 0 || processing
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'linear-gradient(135deg,#007a4e,#00a86b)',
                                    boxShadow: (cart.length > 0 && !processing && progress !== 100) ? '0 8px 24px rgba(0,168,107,0.4)' : 'none',
                                }}>
                                {processing
                                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                                    : progress === 100
                                        ? <><CheckCircle size={16} /> Payment Successful</>
                                        : <><Zap size={16} /> Pay KSh {cartTotal?.toLocaleString()}</>
                                }
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
