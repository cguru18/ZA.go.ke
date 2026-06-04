import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Strict sanitization filter to prevent Cross-Site Scripting (XSS)
const sanitizeHTML = (str) => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

export default function UserChatbox() {
    const { user, token } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);
    
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const [adminInfo, setAdminInfo] = useState({
        fullName: "Agent Mwiti",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150",
        status: "offline",
        lastSeen: null
    });
    const [isAdminTyping, setIsAdminTyping] = useState(false);

    const conversationId = user ? `conv_${user._id}` : null;
    const typingTimeoutRef = useRef(null);

    const formatLastSeen = (dateString) => {
        if (!dateString) return 'Offline';
        const date = new Date(dateString);
        const diffMs = new Date() - date;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Last seen just now';
        if (diffMins < 60) return `Last seen ${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Last seen ${diffHours}h ago`;
        return `Last seen ${date.toLocaleDateString()}`;
    };

    // Scroll to bottom anchor
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Clear typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    // 1. Fetch decrypted message history from database on mount
    useEffect(() => {
        if (!user || !isOpen) return;

        const fetchHistory = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/messages`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (data.success) {
                    const sanitized = data.messages.map(m => ({
                        ...m,
                        message: sanitizeHTML(m.message)
                    }));
                    setMessages(sanitized);
                }
            } catch (err) {
                console.error('Failed to load message history:', err);
            }
        };

        fetchHistory();
    }, [user, isOpen, token]);

    // 2. Initialize Socket.io support channel connection
    useEffect(() => {
        if (!user) return;

        const socketIo = io(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/support`, {
            auth: {
                role: 'CUSTOMER',
                customerId: user._id,
                token: token
            },
            reconnectionAttempts: 5
        });

        socketIo.on('connect', () => {
            // Join specific room for a conversation
            socketIo.emit('join_conversation', conversationId);
        });

        socketIo.on('receive_message', (msg) => {
            setMessages(prev => [
                ...prev, 
                {
                    ...msg,
                    message: sanitizeHTML(msg.message)
                }
            ]);
        });

        socketIo.on('admin_status_change', (data) => {
            setAdminInfo(prev => ({
                ...prev,
                status: data.status,
                lastSeen: data.lastSeen ? new Date(data.lastSeen) : prev.lastSeen
            }));
        });

        socketIo.on('typing_status', (data) => {
            setIsAdminTyping(data.isTyping);
        });

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, [user, token, conversationId]);

    const handleInputChange = (e) => {
        setInput(e.target.value);

        if (socket && conversationId) {
            // Emit typing start
            socket.emit('typing_status', { roomId: conversationId, isTyping: true });

            // Clear previous timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Set timeout to emit typing stop after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_status', { roomId: conversationId, isTyping: false });
            }, 2000);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !conversationId) return;

        // Emit message payload to support socket room
        socket.emit('send_message', {
            conversationId,
            senderId: user._id,
            message: input.trim()
        });

        // Clear typing timeout and emit typing stop immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_status', { roomId: conversationId, isTyping: false });

        setInput('');
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 stitch-theme">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`mb-4 w-80 sm:w-96 h-[28rem] rounded-lg shadow-2xl flex flex-col overflow-hidden border ${
                            isDarkMode
                                ? 'bg-[#111316] border-[#3c4a45] text-[#e2e2e6] shadow-black/80'
                                : 'bg-white border-gray-200 text-slate-800'
                        }`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center border-b flex-shrink-0 ${
                            isDarkMode ? 'bg-[#1e2023] border-[#3c4a45] text-white' : 'bg-gray-100 border-gray-200 text-slate-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                {/* Admin Avatar */}
                                <div className="relative shrink-0">
                                    <img 
                                        src={adminInfo.avatar} 
                                        alt={adminInfo.fullName} 
                                        className="w-10 h-10 rounded-full object-cover border border-[#85948e]"
                                    />
                                    <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                                        {adminInfo.status === 'online' ? (
                                            <>
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e5ff] border border-[#111316]"></span>
                                            </>
                                        ) : (
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-500 border border-[#111316]"></span>
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xs font-mono text-[#4fdebb]">{adminInfo.fullName}</h3>
                                    <p className="text-[10px] text-gray-400 font-semibold label-caps mt-0.5">
                                        {adminInfo.status === 'online' ? 'Online' : formatLastSeen(adminInfo.lastSeen)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className={`hover:bg-white/10 p-1.5 rounded-full transition-all ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-3 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                            <div className="text-center my-1.5">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-black ${isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'}`}>
                                    Audit Safe
                                </span>
                            </div>
                            
                            <div className="flex justify-start">
                                <div className={`max-w-[85%] p-3 rounded-[4px] rounded-tl-sm text-xs shadow-sm ${
                                    isDarkMode ? 'bg-[#1e2023] border border-[#3c4a45] text-gray-100' : 'bg-white text-gray-800 border border-gray-100'
                                }`}>
                                    <div className="flex gap-1.5 items-center mb-1 text-[#00e5ff]">
                                        <Sparkles size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider font-mono">VIP Virtual Assistant</span>
                                    </div>
                                    Hello {user.fullName.split(' ')[0]}! This connection is encrypted. Send a message to contact our active support agents.
                                </div>
                            </div>

                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user._id;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg._id || idx}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-3 rounded-[4px] text-xs shadow-sm ${
                                            isMe
                                                ? 'bg-[#25C2A0]/20 text-[#4fdebb] border border-[#25C2A0]/30 rounded-tr-none font-mono'
                                                : `rounded-tl-none ${isDarkMode ? 'bg-[#1e2023] border border-[#3c4a45] text-gray-100' : 'bg-white text-gray-800 border border-gray-100'}`
                                        }`}
                                            // Safely render sanitized message string
                                            dangerouslySetInnerHTML={{ __html: msg.message }}
                                        />
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing status indicator element */}
                        {isAdminTyping && (
                            <div className={`px-4 py-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide border-t flex-shrink-0 ${
                                isDarkMode ? 'bg-[#111316] border-[#3c4a45] text-[#00e5ff]' : 'bg-white border-gray-100 text-[#00616d]'
                            }`}>
                                <div className="flex gap-1 items-center font-mono">
                                    <span>{adminInfo.fullName} is typing</span>
                                    <span className="flex gap-0.5">
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={handleSend} className={`p-3 flex gap-2 items-center flex-shrink-0 ${isDarkMode ? 'bg-black/40 border-t border-[#3c4a45]' : 'bg-white border-t border-gray-100'}`}>
                            <div className={`flex-1 flex items-center rounded-[4px] overflow-hidden transition-colors ${
                                isDarkMode ? 'bg-[#1a1c1f] border border-[#3c4a45] focus-within:border-[#00e5ff]' : 'bg-gray-100 focus-within:bg-gray-200/50'
                             }`}>
                                <input
                                    type="text"
                                    placeholder="Type encrypted message..."
                                    value={input}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent p-3 text-xs outline-none placeholder:text-gray-500 font-mono text-[#e2e2e6]"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className={`p-3 rounded-[4px] flex items-center justify-center transition-all ${
                                    input.trim()
                                        ? 'bg-[#25C2A0] text-[#00382c] hover:bg-[#4fdebb] shadow-lg shadow-[#25C2A0]/20 hover:scale-105'
                                        : `bg-transparent ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`
                                }`}
                            >
                                <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 bg-gradient-to-br from-[#25C2A0] to-[#00e5ff] text-[#00382c] rounded-full shadow-2xl shadow-[#25C2A0]/30 flex items-center justify-center relative group border border-[#25C2A0]/20"
                    >
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <MessageCircle size={26} className="relative z-10" />
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e5ff] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00e5ff] border border-[#0a0a0a]"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
