import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, ShieldCheck, AlertCircle, Lock, Unlock, ShoppingCart, Eye, Sparkles } from 'lucide-react';

/**
 * High-End Mock Catalog representing the expanding storage matrix container.
 * Combined dynamically with backend API products.
 */
const LOCAL_FALLBACK_MENU = [
    {
        _id: "mock_matcha_cronut",
        title: "Glazed Matcha Cronut",
        price: 350,
        image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=600&auto=format&fit=crop",
        category: "pastries",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Flaky puff pastry layered with organic matcha white chocolate glaze.",
        featured: true // spans 2 columns
    },
    {
        _id: "mock_espresso_pain",
        title: "Espresso Pain au Chocolat",
        price: 420,
        image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop",
        category: "pastries",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Dark Belgian chocolate ganache infused with a shot of single-origin espresso.",
        featured: false
    },
    {
        _id: "mock_caramel_tart",
        title: "Salted Caramel Pecan Tart",
        price: 550,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop",
        category: "pastries",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Rich buttery shortcrust pastry filled with roasted pecans and house-made salted caramel.",
        featured: false
    },
    {
        _id: "mock_red_croissant",
        title: "Red Velvet Croissant",
        price: 380,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop",
        category: "pastries",
        thc: "0.0%",
        inStock: false,
        ageLimit: "Family friendly",
        description: "Vibrant red velvet flaky pastry with a sweet cream cheese core.",
        featured: false
    },
    {
        _id: "mock_hibiscus_ginger",
        title: "Hibiscus Ginger Elixir",
        price: 300,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop",
        category: "Drinks",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Sparkling cold-brewed hibiscus flowers sweetened with cold-pressed local ginger syrup.",
        featured: true // spans 2 columns
    },
    {
        _id: "mock_macadamia_latte",
        title: "Vanilla Macadamia Latte",
        price: 480,
        image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop",
        category: "Drinks",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Double shot of espresso, macadamia nut milk, and Madagascar vanilla pod syrup.",
        featured: false
    },
    {
        _id: "mock_blueberry_lavender",
        title: "Blueberry Lavender Cold Brew",
        price: 450,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=600&auto=format&fit=crop",
        category: "Drinks",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Smooth 18-hour cold brew infused with wild blueberries and organic lavender stems.",
        featured: false
    },
    {
        _id: "mock_passion_mint",
        title: "Passionfruit Mint Cooler",
        price: 320,
        image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=600&auto=format&fit=crop",
        category: "Drinks",
        thc: "0.0%",
        inStock: true,
        ageLimit: "Family friendly",
        description: "Fresh passionfruit pulp, muddled garden mint, sparkling water, and raw honey.",
        featured: false
    },
    {
        _id: "mock_cocoa_truffles",
        title: "Midnight Cocoa Truffles",
        price: 850,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
        category: "Sweets $ Treats",
        thc: "15%",
        inStock: true,
        ageLimit: "18+",
        description: "Premium dark chocolate ganache shells dusted with organic cocoa powder.",
        featured: false
    },
    {
        _id: "mock_honeycomb_brittle",
        title: "Infused Honeycomb Brittle",
        price: 950,
        image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?q=80&w=600&auto=format&fit=crop",
        category: "Sweets $ Treats",
        thc: "20%",
        inStock: true,
        ageLimit: "18+",
        description: "Crunchy golden honeycomb candy coated in premium dark chocolate.",
        featured: true // spans 2 columns
    },
    {
        _id: "mock_rose_fudge",
        title: "Rosewater Cardamom Fudge",
        price: 750,
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?q=80&w=600&auto=format&fit=crop",
        category: "Sweets $ Treats",
        thc: "12%",
        inStock: true,
        ageLimit: "18+",
        description: "Traditional slow-cooked fudge scented with organic Persian rosewater and freshly ground green cardamom.",
        featured: false
    },
    {
        _id: "mock_lavender_macarons",
        title: "Velvet Lavender Macarons",
        price: 1200,
        image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?q=80&w=600&auto=format&fit=crop",
        category: "Sweets $ Treats",
        thc: "18%",
        inStock: true,
        ageLimit: "18+",
        description: "Light-as-air macaron shells filled with lavender-infused white chocolate buttercream.",
        featured: false
    }
];

export default function ProductFeedGrid({ products: propsProducts, onAddToCart, user, onToggleStock, onNotify, searchTerm, isUnlocked }) {
    const [internalProducts, setInternalProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [localStockOverrides, setLocalStockOverrides] = useState({});
    
    // Admin Edit overrides state
    const [editedProducts, setEditedProducts] = useState({});
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        price: '',
        description: '',
        thc: '',
        ageLimit: 'Family friendly',
        category: 'pastries',
        inStock: true
    });
    const [editError, setEditError] = useState(null);
    const [editLoading, setEditLoading] = useState(false);

    const handleOpenEditModal = (product) => {
        const productName = product.productName || product.title || '';
        const pricingTier = product.pricingTier || product.price || 0;
        const currentAgeLimit = product.ageLimit || (product.isInfused ? "18+" : "Family friendly");
        
        setEditingProduct(product);
        setEditForm({
            title: productName,
            price: pricingTier,
            description: product.description || '',
            thc: product.thc || '',
            ageLimit: currentAgeLimit,
            category: product.category || 'pastries',
            inStock: product.inStock !== false
        });
        setEditError(null);
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setEditError(null);
        setEditLoading(true);

        const updatedFields = {
            title: editForm.title,
            price: Number(editForm.price),
            description: editForm.description,
            thc: editForm.thc,
            ageLimit: editForm.ageLimit,
            category: editForm.category,
            inStock: editForm.inStock,
            isInfused: editForm.ageLimit === '18+' || editForm.category === 'Sweets $ Treats'
        };

        if (editingProduct._id.startsWith('mock_')) {
            setEditedProducts(prev => ({
                ...prev,
                [editingProduct._id]: updatedFields
            }));
            setEditLoading(false);
            setIsEditModalOpen(false);
            setEditingProduct(null);
        } else {
            try {
                const token = user?.token || localStorage.getItem('token');
                const { data } = await axios.put(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products/${editingProduct._id}`,
                    updatedFields,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (data) {
                    setEditedProducts(prev => ({
                        ...prev,
                        [editingProduct._id]: {
                            ...updatedFields,
                            _id: editingProduct._id
                        }
                    }));
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                }
            } catch (err) {
                console.error('Failed to update product on backend:', err);
                setEditError(err.response?.data?.message || err.message || 'Failed to persist product edits.');
            } finally {
                setEditLoading(false);
            }
        }
    };

    const hasPropsProducts = Array.isArray(propsProducts) && propsProducts.length > 0;

    useEffect(() => {
        if (hasPropsProducts) {
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
                const unpackedProducts = data.products || data || [];
                setInternalProducts(unpackedProducts);
            } catch (err) {
                console.error('Product Feed Connection Error:', err.message);
                // Graceful fallback to local menu
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [hasPropsProducts]);

    // Merge backend products with fallback list to make expanding storage matrix
    const mergedProducts = (() => {
        const base = [...(hasPropsProducts ? propsProducts : internalProducts)];
        
        // Uniquely merge fallback menu
        LOCAL_FALLBACK_MENU.forEach(fallback => {
            const exists = base.some(p => 
                p.title?.toLowerCase() === fallback.title.toLowerCase() || 
                p.productName?.toLowerCase() === fallback.title.toLowerCase()
            );
            if (!exists) {
                base.push(fallback);
            }
        });
        return base;
    })();

    // Apply local overrides for stock status toggling and product edits
    const productsWithOverrides = mergedProducts.map(p => {
        let updated = p;
        if (localStockOverrides[p._id] !== undefined) {
            updated = { ...updated, inStock: localStockOverrides[p._id] };
        }
        if (editedProducts[p._id] !== undefined) {
            updated = { ...updated, ...editedProducts[p._id] };
        }
        return updated;
    });

    // Local Search & Category Filter
    const filteredProducts = productsWithOverrides.filter(p => {
        const productName = p.title || p.productName || '';
        const description = p.description || '';
        
        // Search filter
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            const matchesSearch = productName.toLowerCase().includes(query) || description.toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Category filter
        if (selectedCategory !== 'All') {
            const cat = p.category || 'General';
            if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        }

        return true;
    });

    const handleLocalToggleStock = (productId) => {
        if (productId.startsWith('mock_')) {
            // Toggle local state override
            setLocalStockOverrides(prev => {
                const current = prev[productId] !== undefined 
                    ? prev[productId] 
                    : (LOCAL_FALLBACK_MENU.find(x => x._id === productId)?.inStock !== false);
                return {
                    ...prev,
                    [productId]: !current
                };
            });
        } else if (onToggleStock) {
            onToggleStock(productId);
        }
    };

    // Smooth scroll and focus to the security access form input
    const handleFocusUnlock = () => {
        const input = document.getElementById('vault-access-input');
        if (input) {
            input.focus();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.classList.add('ring-2', 'ring-[#00E5FF]');
            setTimeout(() => input.classList.remove('ring-2', 'ring-[#00E5FF]'), 3000);
        }
    };

    // Category Tabs definition
    const categories = ['All', 'pastries', 'Drinks', 'Sweets $ Treats'];

    // Render an aesthetically appealing dollar sign $
    const renderCategoryName = (cat) => {
        if (cat === 'Sweets $ Treats') {
            return (
                <span className="flex items-center gap-1">
                    <span>Sweets</span>
                    <span className="text-[#00E5FF] font-black drop-shadow-[0_0_8px_#00E5FF] animate-pulse">$</span>
                    <span>Treats</span>
                </span>
            );
        }
        return cat;
    };

    if (loading && mergedProducts.length === 0) {
        return (
            <div className="stitch-theme grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div 
                        key={i} 
                        className="bg-[#1a1c1f] border border-white/5 rounded-lg p-3 animate-pulse flex flex-col justify-between h-80"
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

    return (
        <div className="stitch-theme p-4">
            
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
                {categories.map(cat => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                    const isSweets = cat === 'Sweets $ Treats';
                    const locked = isSweets && !isUnlocked;

                    return (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all duration-300 flex items-center gap-2 border ${
                                isSelected
                                    ? 'bg-[#25C2A0] text-[#00382c] border-[#25C2A0] shadow-[0_0_12px_rgba(37,194,160,0.3)]'
                                    : 'bg-[#1a1c1f] text-[#bbcac3] border-white/5 hover:border-[#00E5FF] hover:text-white'
                            }`}
                        >
                            {renderCategoryName(cat)}
                            {locked && <Lock size={12} className="text-[#ffbc47] shrink-0" />}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#bbcac3] font-sans flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25C2A0] animate-pulse"></span>
                    Inventory Matrix Index
                </h3>
                <span className="font-mono text-[10px] text-gray-500">{filteredProducts.length} Records Loaded</span>
            </div>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                {filteredProducts.map((p, index) => {
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
                    const ageLimit = p.ageLimit || (p.isInfused ? "18+" : "Family friendly");

                    const isSweetsCategory = categoryName === 'Sweets $ Treats';
                    const locked = isSweetsCategory && !isUnlocked;

                    // Featured bento spans 2 columns
                    const bentoGridColSpan = p.featured ? 'md:col-span-2' : 'col-span-1';

                    return (
                        <div 
                            key={p._id || index}
                            className={`bg-[#1e2023] border border-white/10 rounded-lg p-3 relative hover:border-[#00E5FF] transition-all flex flex-col justify-between h-[390px] group overflow-hidden ${bentoGridColSpan}`}
                            style={{
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                            }}
                        >
                            {/* Accent indicator bar */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#25C2A0] group-hover:bg-[#00E5FF] transition-colors"></div>

                            {/* Locked Overlay for Premium Sweets $ Treats */}
                            {locked && (
                                <div className="absolute inset-0 bg-[#0c0e11]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20 text-center transition-all duration-300">
                                    <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-3 animate-pulse">
                                        <Lock size={20} />
                                    </div>
                                    <h5 className="font-mono text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5 telemetry">Premium Access Required</h5>
                                    <p className="text-[10px] text-gray-500 max-w-[200px] mb-4 leading-relaxed">
                                        This product belongs to the premium Sweets $ Treats catalog. Enter security code to unlock.
                                    </p>
                                    <button 
                                        onClick={handleFocusUnlock}
                                        className="btn-stitch-secondary text-[10px] font-sans px-4 py-1.5 flex items-center gap-1.5"
                                    >
                                        <Unlock size={11} />
                                        Unlock Menu
                                    </button>
                                </div>
                            )}

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
                                    {renderCategoryName(categoryName)}
                                </div>

                                {/* Age acceptability badge */}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                    ageLimit === '18+' 
                                        ? 'bg-red-500/15 border border-red-500/30 text-red-400' 
                                        : 'bg-[#25C2A0]/15 border border-[#25C2A0]/30 text-[#25C2A0]'
                                }`}>
                                    {ageLimit}
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
                                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-2 flex-1">
                                            {productName}
                                        </h4>
                                        <span className="font-mono text-xs font-bold text-[#bbcac3] flex-shrink-0">
                                            KSh {pricingTier.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed h-[30px]">
                                        {p.description || "No description provided for this premium item."}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 font-mono text-[9px] text-gray-500">
                                        <span>ID: <span className="text-[#4dddb9] telemetry">{pCode}</span></span>
                                        <span>THC: <span className="telemetry">{thcRating}</span></span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/5">
                                    <div className="flex gap-2">
                                        {user?.role === 'ADMIN' ? (
                                            <button 
                                                onClick={() => handleOpenEditModal(p)}
                                                className="flex-1 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black flex items-center justify-center gap-1.5 py-2.5 rounded transition-all duration-300 font-mono shadow-lg shadow-orange-500/10 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                                <span>EDIT ENTRY</span>
                                            </button>
                                        ) : inStock ? (
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
                                    {(isSeller || p._id.startsWith('mock_')) && (
                                        <button 
                                            onClick={() => handleLocalToggleStock(p._id)}
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

            {/* Premium Glassmorphic Product Edit Modal */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
                    <div 
                        className="w-full max-w-lg rounded-xl overflow-hidden p-6 border shadow-2xl transition-all duration-300 transform scale-100"
                        style={{
                            background: 'rgba(20,22,26,0.97)',
                            borderColor: 'rgba(0, 229, 255, 0.25)',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(0,229,255,0.05)'
                        }}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#00E5FF]">edit_note</span>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2e2e6] font-mono">
                                    Edit Product Entry
                                </h3>
                            </div>
                            <button 
                                onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                                className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-full transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">error</span>
                                <span>{editError}</span>
                            </div>
                        )}

                        {/* Edit Form */}
                        <form onSubmit={handleSaveEdit} className="space-y-4 font-sans text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">Product Title</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        required
                                        value={editForm.title} 
                                        onChange={handleEditFormChange} 
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">Price (KSh)</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        required
                                        value={editForm.price} 
                                        onChange={handleEditFormChange} 
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">THC Strength</label>
                                    <input 
                                        type="text" 
                                        name="thc" 
                                        value={editForm.thc} 
                                        onChange={handleEditFormChange} 
                                        placeholder="e.g. 15% or 0mg"
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">Category</label>
                                    <select 
                                        name="category"
                                        value={editForm.category}
                                        onChange={handleEditFormChange}
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all cursor-pointer font-mono"
                                    >
                                        <option value="pastries">pastries</option>
                                        <option value="Drinks">Drinks</option>
                                        <option value="Sweets $ Treats">Sweets $ Treats</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">Age Restriction</label>
                                    <select 
                                        name="ageLimit"
                                        value={editForm.ageLimit}
                                        onChange={handleEditFormChange}
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all cursor-pointer font-mono"
                                    >
                                        <option value="Family friendly">Family friendly (Non-infused)</option>
                                        <option value="18+">18+ (Infused)</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 font-mono">Description</label>
                                    <textarea 
                                        name="description" 
                                        rows="3"
                                        value={editForm.description} 
                                        onChange={handleEditFormChange} 
                                        className="w-full bg-[#111316] border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[#00E5FF] transition-all font-mono resize-none"
                                    />
                                </div>

                                <div className="col-span-2 flex items-center gap-3 py-2 border-t border-b border-white/5">
                                    <input 
                                        type="checkbox" 
                                        id="edit-instock" 
                                        name="inStock"
                                        checked={editForm.inStock} 
                                        onChange={handleEditFormChange}
                                        className="w-4 h-4 accent-[#25C2A0] rounded cursor-pointer"
                                    />
                                    <label htmlFor="edit-instock" className="text-[11px] font-mono text-gray-300 cursor-pointer select-none">
                                        In Stock (Available for selection / order placement)
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                                    className="flex-1 py-2.5 rounded border border-white/10 text-gray-400 hover:text-white transition-all font-mono"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    type="submit"
                                    disabled={editLoading}
                                    className="flex-1 bg-gradient-to-r from-[#25C2A0] to-[#00E5FF] text-[#00382c] font-black py-2.5 rounded transition-all hover:opacity-90 disabled:opacity-50 font-mono flex items-center justify-center gap-1.5"
                                >
                                    {editLoading ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-[#00382c]/30 border-t-[#00382c] rounded-full animate-spin" />
                                            <span>SAVING...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[15px]">save</span>
                                            <span>SAVE CHANGES</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
