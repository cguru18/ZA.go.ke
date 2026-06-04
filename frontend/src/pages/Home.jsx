import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, ShoppingBag, Search, Lock, Unlock, X, Sparkles, TrendingUp, Star, Zap, Plus, Bell, CheckCircle } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import TrackingIcon from '../components/TrackingIcon';
import MapTracker from '../components/MapTracker';
import ProductFeedGrid from '../components/Products/ProductFeedGrid';

/* ─── Color map for product accent theming ────────────────────────────────── */
const ACCENT_MAP = {
    lilac:    { border: 'rgba(200,162,200,0.25)', glow: 'rgba(200,162,200,0.12)', badge: '#c8a2c8', dot: '#c8a2c8' },
    jade:     { border: 'rgba(0,168,107,0.25)',   glow: 'rgba(0,168,107,0.1)',    badge: '#00a86b', dot: '#00a86b' },
    burgundy: { border: 'rgba(128,0,32,0.35)',    glow: 'rgba(128,0,32,0.12)',    badge: '#800020', dot: '#c0003c' },
    gray:     { border: 'rgba(75,85,99,0.25)',    glow: 'rgba(75,85,99,0.1)',     badge: '#6b7280', dot: '#9ca3af' },
};

/* ─── Individual Product Card ─────────────────────────────────────────────── */
const ProductCard = ({ product, onAddToCart, index, user, onToggleStock, onNotify }) => {
    const accent = ACCENT_MAP[product.color] || ACCENT_MAP.gray;
    const [isHovered, setIsHovered] = useState(false);
    const [added,     setAdded]     = useState(false);
    const [notified,  setNotified]  = useState(false);

    const handleAdd = () => {
        if (!product.inStock) return;
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleNotify = () => {
        onNotify(product._id);
        setNotified(true);
    };

    const isSeller = user && product.sellerId && (product.sellerId._id === user._id || product.sellerId === user._id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative rounded-3xl overflow-hidden transition-all duration-500 group flex flex-col"
            style={{
                background: 'rgba(13,13,26,0.85)',
                border: `1px solid ${isHovered ? accent.border : 'rgba(255,255,255,0.05)'}`,
                boxShadow: isHovered
                    ? `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${accent.border}, inset 0 1px 0 rgba(255,255,255,0.04)`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                transform: isHovered ? 'translateY(-4px)' : 'none',
            }}
        >
            {/* ── Image / Hero Zone ──────────────────────────────────────── */}
            <div className="relative w-full h-52 overflow-hidden flex-shrink-0"
                 style={{ background: `radial-gradient(ellipse at center, ${accent.glow} 0%, rgba(6,6,15,0.8) 70%)` }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                        style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)', filter: product.inStock ? 'none' : 'grayscale(100%) brightness(50%)' }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ filter: product.inStock ? 'none' : 'grayscale(100%) brightness(50%)' }}>
                        <motion.div animate={{ y: isHovered ? [-5, 5, -5] : 0 }} transition={{ repeat: Infinity, duration: 2 }}>
                            <Leaf size={48} style={{ color: accent.badge, opacity: 0.4 }} />
                        </motion.div>
                    </div>
                )}

                {/* Gradient overlay on image */}
                <div className="absolute inset-0"
                     style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(13,13,26,0.85) 100%)' }} />

                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
                     style={{ background: 'rgba(6,6,15,0.8)', border: `1px solid ${accent.border}`, color: accent.badge }}>
                    {product.category}
                </div>

                {/* Infused badge */}
                {product.isInfused && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                         style={{ background: 'rgba(128,0,32,0.85)', border: '1px solid rgba(192,0,60,0.4)', color: '#fff' }}>
                        <Sparkles size={9} /> Infused
                    </div>
                )}

                {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 text-white font-black tracking-widest uppercase rotate-[-10deg]">
                            Out of Stock
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content Zone ───────────────────────────────────────────── */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white leading-tight truncate group-hover:text-gray-100 transition-colors">
                            {product.title}
                        </h3>
                        {product.sellerId && (
                            <div className="text-[10px] text-gray-400 mt-1 truncate">
                                Sold by <span className="font-semibold text-gray-300">{product.sellerId.fullName || 'Community'}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <span className="text-xl font-black" style={{ color: accent.badge }}>
                            KSh {product.price?.toLocaleString()}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px]">
                    {product.description || 'No description provided for this premium item.'}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3">
                    {/* Status & Seller Controls */}
                    <div className="flex items-center gap-2">
                        {isSeller && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleStock(product._id); }}
                                className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors ${product.inStock ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'}`}
                            >
                                Mark {product.inStock ? 'Out of Stock' : 'In Stock'}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <div className="flex items-center text-yellow-400">
                            <Star size={10} fill="currentColor" />
                            <span className="text-[10px] font-bold ml-0.5">{product.avgRating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">({product.reviewCount || 0})</span>
                        <span className="mx-1 text-gray-700">•</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">{product.thc}</span>
                    </div>
                </div>

                {/* Action button */}
                {product.inStock ? (
                    <button
                        onClick={handleAdd}
                        className="relative w-full py-3 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden mt-1"
                        style={{
                            background: added
                                ? 'rgba(0,168,107,0.2)'
                                : isHovered
                                    ? `linear-gradient(135deg, ${accent.badge}22, ${accent.badge}33)`
                                    : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${added ? 'rgba(0,168,107,0.4)' : isHovered ? accent.border : 'rgba(255,255,255,0.06)'}`,
                            color: added ? '#00a86b' : isHovered ? accent.badge : '#9ca3af',
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {added ? (
                                <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                                    <CheckCircle size={14} /> Added
                                </motion.span>
                            ) : (
                                <motion.span key="add" className="flex items-center gap-2">
                                    <ShoppingBag size={14} /> Add to Selection
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                ) : (
                    <button
                        onClick={handleNotify}
                        disabled={notified || !user}
                        className="relative w-full py-3 rounded-2xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-300 mt-1 border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        {notified ? '✓ Notification Set' : <><Bell size={14} /> Notify When Resupplied</>}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Main Home Component ─────────────────────────────────────────────────── */
export default function Home() {
    const { user, token } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();

    const [products,       setProducts]       = useState([]);
    const [productsError,  setProductsError]  = useState('');
    const [searchTerm,     setSearchTerm]     = useState('');
    const [category,       setCategory]       = useState('');
    const [sort,           setSort]           = useState('-newest');
    const [searchFocused,  setSearchFocused]  = useState(false);
    const [isUnlocked,     setIsUnlocked]     = useState(false);
    const [accessCode,     setAccessCode]     = useState('');
    const [unlockError,    setUnlockError]    = useState('');
    const [unlockLoading,  setUnlockLoading]  = useState(false);
    const [isLive,         setIsLive]         = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [trackingData,   setTrackingData]   = useState({
        lat: -1.2921, lng: 36.8219, eta: null, status: 'PENDING', message: null
    });

    const activeOrderId = 'SIM_12345';

    const fetchProducts = async (unlocked, search = '', cat = '', sortBy = '-newest') => {
        try {
            setProductsError('');
            let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products?unlocked=${unlocked}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (cat)    url += `&category=${encodeURIComponent(cat)}`;
            if (sortBy) url += `&sort=${sortBy}`;
            
            const { data } = await axios.get(url);
            setProducts(data.products || data); 
        } catch (err) {
            console.error('Failed to fetch products', err);
            setProductsError(err.response?.data?.message || err.message || 'Failed to retrieve products. Please verify your connection.');
        }
    };

    /* ─ Socket Setup ─ */
    useEffect(() => {
        localStorage.removeItem('isUnlocked');
        const unlocked = sessionStorage.getItem('isUnlocked') === 'true';
        setIsUnlocked(unlocked);

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        socket.on('connect', () => socket.emit('join_order_room', activeOrderId));
        socket.on('order:update',        (d) => { setIsLive(true); setTrackingData(p => ({ ...p, lat: d.lat, lng: d.lng, eta: d.eta })); });
        socket.on('order:prep-trigger',  (d) => setTrackingData(p => ({ ...p, status: d.status, message: d.message || p.message })));
        socket.on('order:boundary-exit', (d) => setTrackingData(p => ({ ...p, message: d.message })));
        return () => socket.disconnect();
    }, []);

    /* ─ Debounced Search Trigger ─ */
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProducts(isUnlocked, searchTerm, category, sort);
        }, 400); 
        return () => clearTimeout(handler);
    }, [searchTerm, isUnlocked, category, sort]);

    const handleToggleStock = async (productId) => {
        try {
            const { data } = await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${productId}/stock`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(products.map(p => p._id === productId ? { ...p, inStock: data.inStock } : p));
        } catch (err) {
            console.error('Failed to toggle stock', err);
        }
    };

    const handleNotify = async (productId) => {
        if (!user) {
            alert('Please login to set notifications.');
            return;
        }
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${productId}/notify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to set notification', err);
        }
    };

    const handleUnlock = async (e) => {
        e.preventDefault();
        setUnlockError('');
        setUnlockLoading(true);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/access/verify`, { code: accessCode });
            if (data.success) {
                setIsUnlocked(true);
                sessionStorage.setItem('isUnlocked', 'true');
                setAccessCode('');
                // Note: The useEffect on isUnlocked will trigger fetchProducts
            }
        } catch (err) {
            setUnlockError(err.response?.data?.message || 'Invalid code');
        } finally {
            setUnlockLoading(false);
        }
    };

    // No longer need frontend filtering as backend handles it
    const filteredProducts = products;

    return (
        <div className="relative max-w-7xl mx-auto">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <motion.header
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5"
            >
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="font-graffiti text-5xl text-glow-burgundy" style={{ color: '#800020' }}>
                            Treats <span className="text-lilac">&</span> Heat
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-jade" />
                        Premium delivery across Nairobi
                    </p>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
                    <TrackingIcon isLive={isLive} onClick={() => setIsMapModalOpen(true)} />

                    {/* Search Bar */}
                    <motion.div
                        animate={{ width: searchFocused ? '280px' : '220px' }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full md:w-auto flex-1 md:flex-none"
                    >
                        <Search
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
                            style={{ color: searchFocused ? '#00a86b' : '#6b7280' }}
                        />
                        <label htmlFor="search-products-input" className="sr-only">Search products</label>
                        <input
                            id="search-products-input"
                            name="searchQuery"
                            autoComplete="off"
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none transition-all duration-300"
                            style={{
                                background: searchFocused ? 'rgba(0,168,107,0.06)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${searchFocused ? 'rgba(0,168,107,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                color: '#e2e2f0',
                                boxShadow: searchFocused ? '0 0 0 3px rgba(0,168,107,0.08)' : 'none',
                            }}
                        />
                    </motion.div>

                    <label htmlFor="sort-select" className="sr-only">Sort products</label>
                    <select
                        id="sort-select"
                        name="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-white/5 border border-white/10 text-gray-300 text-sm rounded-2xl px-3 py-2.5 outline-none focus:border-jade/40 transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                        <option value="-newest" style={{ background: '#0d0d1a' }}>Newest</option>
                        <option value="price" style={{ background: '#0d0d1a' }}>Price: Low to High</option>
                        <option value="-price" style={{ background: '#0d0d1a' }}>Price: High to Low</option>
                    </select>

                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={() => navigate('/sell')}
                            className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 whitespace-nowrap"
                        >
                            <Plus size={16} /> Sell Item
                        </button>
                    )}
                </div>
            </motion.header>

            {/* ── Premium Lock Banner ─────────────────────────────────────── */}
            <AnimatePresence>
                {!isUnlocked && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0,   scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                        transition={{ duration: 0.4 }}
                        className="mb-8 p-6 rounded-3xl relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(128,0,32,0.15) 0%, rgba(200,162,200,0.08) 100%)',
                            border: '1px solid rgba(128,0,32,0.3)',
                            boxShadow: '0 8px 32px rgba(128,0,32,0.15)',
                        }}
                    >
                        {/* Decorative aurora behind the banner */}
                        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                             style={{ background: 'radial-gradient(circle, #800020, transparent)' }} />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl flex-shrink-0"
                                     style={{ background: 'rgba(128,0,32,0.25)', border: '1px solid rgba(128,0,32,0.4)' }}>
                                    <Lock size={20} style={{ color: '#c0003c' }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-0.5 flex items-center gap-2">
                                        Premium Menu Locked
                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full"
                                              style={{ background: 'rgba(128,0,32,0.3)', color: '#c8a2c8', border: '1px solid rgba(200,162,200,0.2)' }}>
                                            VIP
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Enter your 24-hour access code to unlock infused products.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUnlock} className="flex gap-2.5 w-full md:w-auto relative">
                                <label htmlFor="vault-access-input" className="sr-only">Vault Access Code</label>
                                <input
                                    id="vault-access-input"
                                    name="vaultAccessCode"
                                    autoComplete="one-time-code"
                                    type="text"
                                    placeholder="Enter Code (e.g. X7KR4MPN)"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    maxLength={8}
                                    className="flex-1 md:w-52 px-4 py-3 rounded-2xl text-sm font-mono outline-none tracking-widest"
                                    style={{
                                        background: 'rgba(0,0,0,0.4)',
                                        border: unlockError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={unlockLoading}
                                    className="px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide text-white transition-all duration-300 flex items-center gap-2 flex-shrink-0"
                                    style={{
                                        background: unlockLoading
                                            ? 'rgba(128,0,32,0.4)'
                                            : 'linear-gradient(135deg, #800020, #c0003c)',
                                        boxShadow: unlockLoading ? 'none' : '0 4px 16px rgba(128,0,32,0.4)',
                                    }}
                                >
                                    {unlockLoading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Zap size={14} /> Unlock</>
                                    )}
                                </button>

                                {unlockError && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute -bottom-6 left-0 text-xs text-red-400 font-semibold flex items-center gap-1"
                                    >
                                        <span>⚠</span> {unlockError}
                                    </motion.span>
                                )}
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Unlocked Badge ─────────────────────────────────────────── */}
            <AnimatePresence>
                {isUnlocked && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full"
                        style={{
                            background: 'rgba(0,168,107,0.1)',
                            border: '1px solid rgba(0,168,107,0.25)',
                            boxShadow: '0 0 20px rgba(0,168,107,0.1)',
                        }}
                    >
                        <Unlock size={14} style={{ color: '#00a86b' }} />
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00a86b' }}>
                            Premium Menu Unlocked
                        </span>
                        <Sparkles size={12} style={{ color: '#00a86b' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Product Stats Bar ──────────────────────────────────────── */}
            {filteredProducts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 mb-6"
                >
                    <span className="text-xs text-gray-600 uppercase tracking-widest font-semibold">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
                        {searchTerm && ` for "${searchTerm}"`}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </motion.div>
            )}

            {/* ── Product Grid ───────────────────────────────────────────── */}
            {productsError ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl text-center"
                    style={{
                        background: 'rgba(128,0,32,0.12)',
                        border: '1px solid rgba(128,0,32,0.25)',
                        boxShadow: '0 8px 32px rgba(128,0,32,0.08)',
                    }}
                >
                    <div className="w-14 h-14 rounded-full mb-4 flex items-center justify-center"
                         style={{ background: 'rgba(128,0,32,0.2)', border: '1px solid rgba(128,0,32,0.3)' }}>
                        <span className="text-[#f87171] font-bold text-xl">⚠</span>
                    </div>
                    <p className="text-lg font-bold text-white mb-1">Could Not Load Menu</p>
                    <p className="text-sm text-gray-400 max-w-md">{productsError}</p>
                </motion.div>
            ) : filteredProducts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Search size={24} className="text-gray-600" />
                    </div>
                    <p className="text-xl font-semibold text-gray-500">No products found</p>
                    <p className="text-sm text-gray-700 mt-1">Try a different search or unlock the premium menu</p>
                </motion.div>
            ) : (
                <ProductFeedGrid
                    products={filteredProducts}
                    onAddToCart={addToCart}
                    user={user}
                    onToggleStock={handleToggleStock}
                    onNotify={handleNotify}
                    isUnlocked={isUnlocked}
                    searchTerm={searchTerm}
                />
            )}

            {/* ── Map Tracking Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {isMapModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl rounded-3xl overflow-hidden"
                            style={{ border: '1px solid rgba(200,162,200,0.12)', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}
                        >
                            <button
                                onClick={() => setIsMapModalOpen(false)}
                                className="absolute top-4 right-4 z-50 p-2 rounded-full text-white transition-all hover:scale-110"
                                style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.5)' }}
                            >
                                <X size={18} />
                            </button>
                            <MapTracker
                                lat={trackingData.lat}
                                lng={trackingData.lng}
                                eta={trackingData.eta}
                                status={trackingData.status}
                                message={trackingData.message}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
