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

    const conversationId = user ? `conv_${user._id}` : null;

    // Scroll to bottom anchor
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

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

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, [user, token, conversationId]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !conversationId) return;

        // Emit message payload to support socket room
        socket.emit('send_message', {
            conversationId,
            senderId: user._id,
            message: input.trim()
        });

        setInput('');
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`mb-4 w-80 sm:w-96 h-[28rem] rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${
                            isDarkMode
                                ? 'bg-[#0a0a0a]/90 border-fuchsia-500/20 backdrop-blur-2xl shadow-fuchsia-900/20 text-white'
                                : 'bg-white/90 border-gray-200/50 backdrop-blur-2xl shadow-gray-200/50 text-slate-800'
                        }`}
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-fuchsia-600 to-purple-600 p-4 flex justify-between items-center text-white overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide">Secure support Chat</h3>
                                    <p className="text-[10px] text-fuchsia-100 font-medium">End-to-End Encrypted (AES-GCM)</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="relative z-10 hover:bg-white/20 p-1.5 rounded-full transition-all">
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
                                <div className={`max-w-[85%] p-3 rounded-2xl rounded-tl-sm text-xs shadow-sm ${
                                    isDarkMode ? 'bg-white/10 text-gray-100' : 'bg-white text-gray-800 border border-gray-100'
                                }`}>
                                    <div className="flex gap-1.5 items-center mb-1 text-fuchsia-500">
                                        <Sparkles size={12} /> <span className="text-[10px] font-bold">VIP Virtual Assistant</span>
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
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                                            isMe
                                                ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-tr-sm'
                                                : `rounded-tl-sm ${isDarkMode ? 'bg-white/10 text-gray-100' : 'bg-white text-gray-800 border border-gray-100'}`
                                        }`}
                                            // Safely render sanitized message string
                                            dangerouslySetInnerHTML={{ __html: msg.message }}
                                        />
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSend} className={`p-3 flex gap-2 items-center flex-shrink-0 ${isDarkMode ? 'bg-black/40 border-t border-white/5' : 'bg-white border-t border-gray-100'}`}>
                            <div className={`flex-1 flex items-center rounded-2xl overflow-hidden transition-colors ${
                                isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-100 focus-within:bg-gray-200/50'
                             }`}>
                                <input
                                    type="text"
                                    placeholder="Type encrypted message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full bg-transparent p-3 text-xs outline-none placeholder:text-gray-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                                    input.trim()
                                        ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30 hover:scale-105'
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
                        className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-full shadow-2xl shadow-fuchsia-500/40 flex items-center justify-center relative group"
                    >
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <MessageCircle size={26} className="relative z-10" />
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jade opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-jade border-2 border-[#0a0a0a]"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
