/**
 * HEAT & TREATS - GLASSBOX DASHBOARD
 * UI: Tailwind CSS, Framer Motion, Lucide-React
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Home, Search, Leaf, Menu, X, ShoppingBag, MapPin } from 'lucide-react';

export default function Dashboard() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [checkoutStatus, setCheckoutStatus] = useState(null);

    // Sidebar Grid Menu Logic (Collapse/Expand to the left)
    const sidebarVariantsDesktop = {
        open: { width: "260px", x: 0 },
        closed: { width: "80px", x: 0 }
    };

    const sidebarVariantsMobile = {
        open: { x: 0 },
        closed: { x: "-100%" }
    };

    const handleCheckout = async () => {
        // Get user coordinates (mocking for now, in a real app use navigator.geolocation)
        const userCoords = { lat: -1.286389, lng: 36.817223 }; // Example: Nairobi CBD

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logistics/validate-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userLat: userCoords.lat, userLng: userCoords.lng })
            });

            const data = await response.json();

            if (!data.safeZone) {
                setCheckoutStatus({ type: 'error', message: data.message });
            } else {
                setCheckoutStatus({ type: 'success', message: 'Proceeding to payment for Nairobi delivery!' });
            }
        } catch (error) {
            setCheckoutStatus({ type: 'error', message: 'Server unreachable. Please ensure backend is running.' });
        }
    };

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-gray-200 overflow-hidden relative">
            
            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-white">
                    <Menu />
                </button>
                <h1 className="text-xl font-graffiti text-burgundy-500">ZA.go</h1>
                <Leaf className="text-jade-500" />
            </div>

            {/* Animated Sidebar Menu */}
            <AnimatePresence>
                <motion.nav 
                    animate={isMenuOpen ? "open" : "closed"}
                    variants={window.innerWidth < 768 ? sidebarVariantsMobile : sidebarVariantsDesktop}
                    initial={window.innerWidth < 768 ? "closed" : "open"}
                    className="glass-sidebar h-full flex flex-col p-4 z-40 fixed md:relative"
                >
                    <div className="flex justify-between items-center mb-8 md:hidden">
                        <h2 className="text-2xl font-graffiti text-burgundy-500">ZA.go</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="text-white">
                            <X />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 mt-12 md:mt-4">
                        <NavItem icon={<User className="text-lilac-400"/>} label="Profile" isOpen={isMenuOpen} />
                        <NavItem icon={<Home />} label="Home" isOpen={isMenuOpen} />
                        <NavItem icon={<Search />} label="Search" isOpen={isMenuOpen} />
                        
                        {/* Weed Leaf Cart Button */}
                        <div onClick={handleCheckout}>
                            <NavItem icon={<ShoppingBag className="text-jade-500"/>} label="Checkout" isOpen={isMenuOpen} special />
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="mt-auto p-2 bg-white/5 rounded-lg text-xs uppercase tracking-widest hidden md:block"
                    >
                        {isMenuOpen ? "Collapse" : "Menu"}
                    </button>
                </motion.nav>
            </AnimatePresence>

            {/* Overlay for mobile when menu is open */}
            {isMenuOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/60 z-30"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gradient-to-br from-black via-forest-900 to-black pt-20 md:pt-8 w-full">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div className="hidden md:block">
                        <h1 className="text-4xl font-graffiti text-burgundy-500 mb-2">Treats & Heat</h1>
                        <p className="text-gray-400 text-sm">Premium delivery in Nairobi</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 w-full md:w-auto">
                        <MapPin size={16} className="text-jade-500" />
                        <span className="text-xs text-jade-500 flex-1">Yandex GPS: Connected</span>
                        <div className="w-2 h-2 bg-jade-500 rounded-full animate-pulse shadow-[0_0_8px_#00a36c]"></div>
                    </div>
                </header>

                {checkoutStatus && (
                    <div className={`p-4 mb-6 rounded-xl border backdrop-blur-md ${checkoutStatus.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' : 'bg-jade-500/10 border-jade-500/50 text-jade-200'}`}>
                        {checkoutStatus.message}
                    </div>
                )}

                {/* Product Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ProductCard title="Purple Haze Gummy" thc="25mg" price="$15" color="lilac" />
                    <ProductCard title="Forest Kush Brownie" thc="50mg" price="$22" color="jade" />
                    <ProductCard title="Smoothie: Velvet Dream" thc="Infused" price="$18" color="burgundy" />
                    <ProductCard title="CBD Chill Drops" thc="0mg" price="$30" color="blue" />
                    <ProductCard title="Golden Ticket Truffles" thc="100mg" price="$40" color="yellow" />
                    <ProductCard title="Midnight Express Vape" thc="85%" price="$55" color="purple" />
                </div>
            </main>
        </div>
    );
}

// Sub-components for clean Lego logic
const NavItem = ({ icon, label, isOpen, special }) => (
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${special ? 'bg-jade-500/10 border border-jade-500/30 shadow-[0_0_15px_rgba(0,163,108,0.2)]' : 'hover:bg-white/10'} ${!isOpen ? 'md:justify-center' : ''}`}>
        {icon}
        {(isOpen || window.innerWidth < 768) && <span className="font-semibold text-sm whitespace-nowrap">{label}</span>}
    </div>
);

const ProductCard = ({ title, thc, price, color }) => {
    // Map colors to actual tailwind classes since dynamic interpolation (bg-${color}-500) 
    // can be stripped by Tailwind's JIT compiler.
    const colorMap = {
        lilac: 'bg-purple-400',
        jade: 'bg-emerald-500',
        burgundy: 'bg-rose-800',
        blue: 'bg-blue-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-600'
    };
    
    const bgColor = colorMap[color] || 'bg-gray-500';

    return (
        <div className="glass-card p-6 border border-white/5 bg-white/5 rounded-2xl backdrop-blur-md hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-xl group">
            <div className={`w-full h-40 mb-4 rounded-xl ${bgColor} bg-opacity-20 flex items-center justify-center overflow-hidden`}>
                <Leaf className={`w-12 h-12 text-white/30 group-hover:scale-110 transition-transform`} />
            </div>
            <h3 className="font-bold text-lg text-white">{title}</h3>
            <div className="flex justify-between items-center mt-4">
                <span className="text-xs font-bold text-jade-500 uppercase tracking-widest">{thc} THC</span>
                <span className="text-xl font-bold text-white">{price}</span>
            </div>
            <button className="w-full mt-6 py-3 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-colors">
                Add to Cart
            </button>
        </div>
    );
};
