import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, ShieldCheck, AlertCircle, ShoppingCart, Info, Bell } from 'lucide-react';

/**
 * ProductFeedGrid component implements the exact Stitch screen design tokens
 * for the product dashboard (Emerald accents, Slate borders, 4px border-radius inputs/buttons,
 * 12px internal card padding, 16px gutter spacing, and monospace technical IDs).
 * 
 * Supports dual-conditional behavior: uses props.products if passed; otherwise falls back to
 * internal API query handshake.
 */
export default function ProductFeedGrid({ products: propsProducts, onAddToCart, user, onToggleStock, onNotify }) {
    const [internalProducts, setInternalProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const hasPropsProducts = Array.isArray(propsProducts);

    useEffect(() => {
        if (hasPropsProducts) {
            // Bypass internal loading/error when props.products are supplied
            setLoading(false);
            setError(null);
            return;
        }

        const fetchFeed = async () => {
            try {
                setLoading(true);
                setError(null);
                const API_ENDPOINT = 'https://zago-backend-943575366790.us-central1.run.app/api/products?unlocked=false&sort=-newest';
                
                const { data } = await axios.get(API_ENDPOINT);
                
                // Securely unpack payload
                const unpackedProducts = data.products || data || [];
                setInternalProducts(unpackedProducts);
            } catch (err) {
                console.error('Product Feed Connection Error:', err.message);
                setError(err.message || 'Failed to establish stable API socket query handshake.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [hasPropsProducts]);

    const activeProducts = hasPropsProducts ? propsProducts : internalProducts;

    // Loader Skeleton matching the Stitch blueprint style
    if (loading) {
        return (
            <div className="stitch-theme grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div 
                        key={i} 
                        className="bg-[#1a1c1f] border border-white/5 rounded-lg p-3 animate-pulse flex flex-col justify-between h-72"
                    >
                        <div className="w-full h-36 bg-white/5 rounded mb-3"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/5 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-white/5 rounded w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Network Interception Error State: displays fallback warning instead of crashing DOM
    if (error && !hasPropsProducts) {
        return (
            <div className="stitch-theme p-6 text-center max-w-md mx-auto my-12 bg-[#1a1c1f] border border-red-500/20 rounded-lg">
                <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
                <h4 className="font-mono text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Network Connection Outage</h4>
                <p className="text-xs text-[#bbcac3] mb-4">
                    The backend API gateway is currently unreachable. Check your active geofence configurations or internet connection.
                </p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="w-full btn-stitch-secondary font-mono text-xs"
                >
                    Retry Connection Hook
                </button>
            </div>
        );
    }

    return (
        <div className="stitch-theme p-4">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#bbcac3] font-sans flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25C2A0] animate-pulse"></span>
                    Inventory Matrix Index
                </h3>
                <span className="font-mono text-[10px] text-gray-500">{activeProducts.length} Records Loaded</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeProducts.map((p, index) => {
                    // Extract fields supporting both prototype definitions and active backend fields
                    const productName = p.productName || p.title || 'System Product';
                    const pricingTier = p.pricingTier || p.price || 0;
                    const thumbnail = p.thumbnail || p.image || '';
                    const categoryName = p.category || 'General';
                    const thcRating = p.thc || '0%';
                    const pCode = p._id ? p._id.substring(18) : `SYS-${index}`;
                    
                    const sellerId = p.sellerId?._id || p.sellerId;
                    const currentUserId = user?._id;
                    const isSeller = user && sellerId && (sellerId === currentUserId);
                    const inStock = p.inStock !== false;

                    return (
                        <div 
                            key={p._id || index}
                            className="bg-[#1e2023] border border-white/10 rounded-lg p-3 relative hover:border-[#00E5FF] transition-all flex flex-col justify-between h-96 group overflow-hidden"
                            style={{
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                            }}
                        >
                            {/* Accent indicator bar */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#25C2A0] group-hover:bg-[#00E5FF] transition-colors"></div>

                            {/* Image area */}
                            <div className="relative w-full h-36 bg-black/40 rounded overflow-hidden flex items-center justify-center border border-white/5 mb-3 flex-shrink-0">
                                {thumbnail ? (
                                    <img 
                                        src={thumbnail} 
                                        alt={productName} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <span className="material-symbols-outlined text-[24px] text-gray-600">inventory</span>
                                )}
                                
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] bg-black/60 border border-white/10 font-bold uppercase tracking-wider text-[#bbcac3]">
                                    {categoryName}
                                </div>

                                {/* Out of stock design-token overlay */}
                                {!inStock && (
                                    <div className="absolute inset-0 bg-[#0c0e11]/80 backdrop-blur-xs flex items-center justify-center z-10">
                                        <span className="text-[10px] font-mono text-[#ffbc47] tracking-wider uppercase border border-[#ffbc47]/30 px-3 py-1 rounded bg-[#1a1c1f] telemetry">
                                            OUT OF STOCK
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Text content details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-1 flex-1">
                                            {productName}
                                        </h4>
                                        <span className="font-mono text-xs font-bold text-[#bbcac3] flex-shrink-0">
                                            KSh {pricingTier.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 font-mono text-[9px] text-gray-500">
                                        <span>ID: <span className="text-[#4dddb9] telemetry">{pCode}</span></span>
                                        <span>THC: <span className="telemetry">{thcRating}</span></span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/5">
                                    <div className="flex gap-2">
                                        {inStock ? (
                                            <button 
                                                onClick={() => onAddToCart && onAddToCart(p)}
                                                className="flex-1 btn-stitch-primary text-xs flex items-center justify-center gap-1.5 py-2"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                                                <span>Acquire</span>
                                            </button>
                                        ) : (
                                            <button 
                                                disabled={!user}
                                                onClick={() => onNotify && onNotify(p._id)}
                                                className="flex-1 btn-stitch-secondary text-xs flex items-center justify-center gap-1.5 py-2 font-mono"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">notifications</span>
                                                <span>Notify Resupply</span>
                                            </button>
                                        )}
                                        <button className="btn-stitch-secondary px-2 flex items-center justify-center py-2" title="Inspect Telemetry">
                                            <span className="material-symbols-outlined text-[14px]">query_stats</span>
                                        </button>
                                    </div>

                                    {/* Seller operations panel */}
                                    {isSeller && (
                                        <button 
                                            onClick={() => onToggleStock && onToggleStock(p._id)}
                                            className="w-full btn-stitch-secondary hover:text-[#ffbc47] hover:border-[#ffbc47] text-[10px] py-1 border-dashed text-gray-400 transition-colors"
                                        >
                                            {inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
