import React, { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Home, Search, ShoppingBag, Menu, X, Sun, Moon, LogOut, Shield, Map, Activity, ChevronRight, ChevronLeft } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import GraffitiLogo from '../components/GraffitiLogo';
import UserChatbox from '../components/Chat/UserChatbox';

const NavItem = ({ icon, label, path, special, badge, danger, isMenuOpen, isDarkMode, isActive, onClick }) => {
    let base = 'group relative flex items-center gap-3 px-4 py-3.5 rounded-full cursor-pointer transition-all duration-400 overflow-hidden ';
    if (danger) {
        base += 'hover:bg-red-500/10 text-red-400 hover:text-red-300';
    } else if (special) {
        base += isDarkMode
            ? 'bg-gradient-to-r from-jade/20 to-jade-light/10 border border-jade/30 text-jade hover:border-jade/60'
            : 'bg-gradient-to-r from-jade/12 to-jade/5 border border-jade/30 text-jade-dark hover:border-jade/50';
    } else if (isActive) {
        base += isDarkMode
            ? 'bg-gradient-to-r from-burgundy/30 to-lilac/10 border border-lilac/20 text-white'
            : 'bg-gradient-to-r from-burgundy/12 to-lilac/8 border border-burgundy/20 text-burgundy';
    } else {
        base += isDarkMode
            ? 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/8'
            : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 border border-transparent';
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div onClick={onClick} className={base}>
            {isActive && !danger && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-lilac to-burgundy" />
            )}
            <span className={`relative flex-shrink-0 transition-transform duration-300 ${!danger && 'group-hover:scale-110'} ${isActive && !danger ? (isDarkMode ? 'text-lilac' : 'text-burgundy') : ''}`}>
                {icon}
            </span>
            <AnimatePresence>
                {(isMenuOpen || isMobile) && (
                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="font-semibold text-sm whitespace-nowrap flex-1">
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
            {badge > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1.5 right-1.5 h-5 min-w-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-md">
                    {badge}
                </motion.span>
            )}
        </div>
    );
};

export default function Layout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const { user, logout }            = useContext(AuthContext);
    const { cart }                    = useContext(CartContext);
    const navigate                    = useNavigate();
    const location                    = useLocation();

    const handleNavigation = (path) => {
        if (path === '/_logout') {
            logout();
            navigate('/login');
            return;
        }
        navigate(path);
        if (window.innerWidth < 768) setIsMenuOpen(false);
    };

    const sidebarBg = isDarkMode
        ? 'linear-gradient(180deg,rgba(6,6,15,.97) 0%,rgba(13,13,26,.94) 100%)'
        : 'linear-gradient(180deg,rgba(255,255,255,.98) 0%,rgba(248,248,255,.96) 100%)';
    const mainBg = isDarkMode
        ? 'radial-gradient(ellipse at 30% 20%,rgba(200,162,200,.04) 0%,transparent 60%),linear-gradient(180deg,#06060f 0%,#0d0d1a 100%)'
        : 'radial-gradient(ellipse at 30% 20%,rgba(200,162,200,.05) 0%,transparent 60%),linear-gradient(180deg,#f8f8ff 0%,#f0f0fa 100%)';
    const border = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    const renderNavItem = (props) => (
        <NavItem 
            {...props} 
            isMenuOpen={isMenuOpen} 
            isDarkMode={isDarkMode} 
            isActive={location.pathname === props.path || (props.path !== '/' && location.pathname.startsWith(props.path))}
            onClick={() => handleNavigation(props.path)}
        />
    );

    return (
        <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-[#06060f] text-gray-200' : 'bg-[#f8f8ff] text-gray-900'}`}>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setIsMenuOpen(false)} />
                )}
            </AnimatePresence>

            {/* Mobile header - Minimalist */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
                style={{ background: 'transparent', backdropFilter: 'blur(10px)' }}>
                <div onClick={() => handleNavigation('/')} className="cursor-pointer scale-90"><GraffitiLogo /></div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className={`p-2.5 rounded-full transition-all border ${isDarkMode ? 'text-gray-300 border-white/10' : 'text-gray-600 border-black/10'}`}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={() => setIsMenuOpen(true)} className={`p-2.5 rounded-full transition-all border ${isDarkMode ? 'text-gray-300 border-white/10' : 'text-gray-600 border-black/10'}`}>
                        <Menu size={18} />
                    </button>
                </div>
            </div>

            <motion.nav
                animate={{ width: isMenuOpen ? '260px' : '88px' }}
                initial={{ width: '88px' }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="hidden md:flex flex-shrink-0 h-full flex-col p-5 z-40 relative"
                style={{ background: sidebarBg, borderRight: isDarkMode ? '1px solid rgba(200,162,200,.08)' : '1px solid rgba(128,0,32,.08)' }}
            >
                {/* Logo & Desktop Toggle */}
                <div className="relative flex items-center justify-between mb-8">
                    <div onClick={() => handleNavigation('/')} className="cursor-pointer">
                        {isMenuOpen ? <div className="w-32"><GraffitiLogo /></div> : <h2 className="text-2xl font-graffiti text-burgundy w-10 text-center">Z</h2>}
                    </div>
                    
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="hidden md:flex absolute -right-9 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center z-50 shadow-2xl border transition-all duration-300 hover:scale-110 active:scale-95"
                        style={{ 
                            background: isDarkMode ? 'rgba(13,13,26,0.98)' : '#fff',
                            borderColor: isDarkMode ? 'rgba(200,162,200,0.4)' : 'rgba(128,0,32,0.2)',
                            color: isDarkMode ? '#c8a2c8' : '#800020',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {isMenuOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                <div className="h-px mb-5 rounded-full" style={{ background: isDarkMode ? 'linear-gradient(90deg,transparent,rgba(200,162,200,.2),transparent)' : 'linear-gradient(90deg,transparent,rgba(128,0,32,.12),transparent)' }} />

                <div className="flex flex-col gap-4 flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-6 custom-scrollbar"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}>
                    {renderNavItem({ icon: <Home size={20} />, label: "Home", path: "/" })}
                    {user ? (
                        <>
                            {renderNavItem({ icon: <User size={20} />, label: "Profile", path: "/profile" })}
                            {renderNavItem({ icon: <Search size={20} />, label: "Search", path: "/search" })}
                            {renderNavItem({ icon: <ShoppingBag size={20} />, label: "Checkout", path: "/checkout", special: true, badge: cart.length })}
                            {renderNavItem({ icon: <Map size={20} />, label: "Live Map", path: "/map" })}
                            {user?.role === 'ADMIN' && renderNavItem({ icon: <Shield size={20} />, label: "Admin Panel", path: "/admin" })}
                        </>
                    ) : (
                        <>
                            {renderNavItem({ icon: <User size={20} />, label: "Login", path: "/login" })}
                            {renderNavItem({ icon: <User size={20} />, label: "Sign Up", path: "/signup" })}
                            {renderNavItem({ icon: <Shield size={20} />, label: "Admin", path: "/admin-login" })}
                        </>
                    )}
                </div>

                <div className="mt-auto flex flex-col gap-5 pt-4 border-t border-white/5">
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-full border ${isDarkMode ? 'bg-jade/10 border-jade/20' : 'bg-jade/5 border-jade/10'}`}>
                                <span className="w-2.5 h-2.5 rounded-full bg-jade animate-blink flex-shrink-0" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-jade/80' : 'text-jade-dark'}`}>System Online</span>
                                <Activity size={14} className={`ml-auto ${isDarkMode ? 'text-jade/50' : 'text-jade/60'}`} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {user && renderNavItem({ icon: <LogOut size={20} />, label: "Logout", path: "/_logout", danger: true })}

                    <div className="hidden md:flex items-center">
                        <button onClick={toggleTheme}
                            className={`w-full p-3.5 rounded-full flex justify-center items-center transition-all border ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5 border-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-black/5 border-black/5'}`}>
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            <main className="flex-1 h-[100svh] overflow-y-auto md:p-8" style={{ background: mainBg }}>
                <div className="pb-24 md:pb-0">
                    <Outlet />
                </div>
            </main>

            <UserChatbox />

            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 safe-area-bottom"
                style={{ background: 'linear-gradient(to top, rgba(10,10,20,0.95), transparent)' }}>
                <div className="flex items-center justify-around p-2 rounded-full backdrop-blur-xl border"
                    style={{ background: isDarkMode ? 'rgba(20,20,35,0.85)' : 'rgba(255,255,255,0.9)', borderColor: border }}>
                    {renderNavItem({ icon: <Home size={22} />, label: "", path: "/" })}
                    {renderNavItem({ icon: <Search size={22} />, label: "", path: "/search" })}
                    {renderNavItem({ icon: <ShoppingBag size={22} />, label: "", path: "/checkout", badge: cart.length })}
                    {renderNavItem({ icon: <Map size={22} />, label: "", path: "/map" })}
                    {user?.role === 'ADMIN' && renderNavItem({ icon: <Shield size={22} />, label: "", path: "/admin" })}
                </div>
            </div>
        </div>
    );
}
