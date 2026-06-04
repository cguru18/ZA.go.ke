import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, Users, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import ClientProfileView from './ClientProfileView';

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

export default function AdminChatConsole({ initialConversationId = null }) {
    const { user, token } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(initialConversationId); // holds conversationId
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    const [activeUserProfile, setActiveUserProfile] = useState(null);
    const [isCustomerTyping, setIsCustomerTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (initialConversationId) {
            setActiveChat(initialConversationId);
        }
    }, [initialConversationId]);

    // Clean up typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    // 1. Fetch all unique active conversation threads
    const fetchConversations = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/conversations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                // Dynamically sort conversation threads using lastMessageTimestamp configuration
                const sorted = [...data.conversations].sort((a, b) => {
                    const timeA = new Date(a.lastMessageTimestamp || a.timestamp || 0);
                    const timeB = new Date(b.lastMessageTimestamp || b.timestamp || 0);
                    return timeB - timeA;
                });
                setConversations(sorted);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    };


    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;
        fetchConversations();
    }, [user, token]);

    // 2. Fetch message logs when a specific conversation is selected
    useEffect(() => {
        if (!activeChat || !token) return;

        const fetchMessages = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/conversations/${activeChat}/messages`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (data.success) {
                    const sanitized = data.messages.map(m => ({
                        ...m,
                        message: sanitizeHTML(m.message)
                    }));
                    setMessages(sanitized);
                    setActiveUserProfile(data.userProfile || null);
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
            }
        };

        fetchMessages();
    }, [activeChat, token]);

    // 3. Connect to Support Socket Channel
    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;

        const socketIo = io(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/support`, {
            auth: {
                role: 'ADMIN',
                adminEmail: user.email,
                adminSecretKey: user.token, // Admin auth matching server specs
                token: token
            },
            reconnectionAttempts: 5
        });

        socketIo.on('connect', () => {
            console.log('Admin support console socket connected');
            if (activeChat) {
                socketIo.emit('join_conversation', activeChat);
            }
        });

        // Triggered when a new user writes or conversation initializes
        socketIo.on('new_inquiry_alert', (data) => {
            fetchConversations();
        });

        socketIo.on('receive_message', (msg) => {
            // Append message if it belongs to the active view
            if (msg.conversationId === activeChat) {
                setMessages(prev => [
                    ...prev,
                    {
                        ...msg,
                        message: sanitizeHTML(msg.message)
                    }
                ]);
            }
            // Refresh conversation previews
            fetchConversations();
        });

        socketIo.on('typing_status', (data) => {
            if (data.roomId === activeChat) {
                setIsCustomerTyping(data.isTyping);
            }
        });

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, [user, token, activeChat]);

    // 4. Bind socket connection to selected room on switch
    const selectConversation = (id) => {
        setActiveChat(id);
        setIsCustomerTyping(false); // Reset typing status when switching threads
        if (socket) {
            socket.emit('join_conversation', id);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);

        if (socket && activeChat) {
            // Emit typing start
            socket.emit('typing_status', { roomId: activeChat, isTyping: true });

            // Clear previous timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Set timeout to emit typing stop after 2 seconds
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_status', { roomId: activeChat, isTyping: false });
            }, 2000);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !activeChat) return;

        socket.emit('send_message', {
            conversationId: activeChat,
            senderId: user._id || user.id,
            message: input.trim()
        });

        // Clear typing timeout and emit typing stop immediately
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_status', { roomId: activeChat, isTyping: false });

        setInput('');
    };

    if (!user || user.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center p-12 text-center">
                <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/25 max-w-sm">
                    <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white mb-2">Restricted Access</h3>
                    <p className="text-gray-400 text-sm">This console requires verified Administrator authorization credentials.</p>
                </div>
            </div>
        );
    }

    const containerStyle = {
        background: isDarkMode ? '#111316' : '#fff',
        border: isDarkMode ? '1px solid #3c4a45' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDarkMode ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)'
    };

    return (
        <div className="rounded-lg overflow-hidden flex h-[35rem] w-full stitch-theme" style={containerStyle}>
            {/* Sidebar: Conversation Threads */}
            <div className={`w-80 flex flex-col border-r ${isDarkMode ? 'border-[#3c4a45] bg-[#0c0e11]' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className={`p-4 border-b flex items-center gap-2 ${isDarkMode ? 'border-[#3c4a45]' : 'border-gray-200'}`}>
                    <Users size={16} className="text-[#25C2A0]" />
                    <h3 className="font-bold text-xs text-gray-400 label-caps">Support Queue</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 text-xs">
                            No active support threads
                        </div>
                    ) : (
                        conversations.map((c) => {
                            const isActive = activeChat === c.conversationId;
                            return (
                                <button
                                    key={c.conversationId}
                                    onClick={() => selectConversation(c.conversationId)}
                                    className={`w-full p-3 rounded-md text-left flex items-start gap-3 transition-all relative border ${
                                        isActive 
                                            ? 'bg-[#25C2A0]/10 border-[#25C2A0]/30 text-white' 
                                            : `border-transparent ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`
                                    }`}
                                >
                                    {/* Avatar with dynamic fallback */}
                                    <div className="relative shrink-0">
                                        <img 
                                            src={c.userProfile?.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'} 
                                            alt={c.userProfile?.fullName || 'User'} 
                                            className="w-10 h-10 rounded-full object-cover border border-[#85948e]"
                                        />
                                        {c.userProfile?.tier === 'VIP' && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-amber-500 border border-[#0a0a0a] items-center justify-center text-[8px] font-black text-black">V</span>
                                        )}
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-bold text-xs text-white truncate">
                                                {c.userProfile?.fullName || c.conversationId.replace('conv_', 'User ')}
                                            </span>
                                            <span className="text-[8px] text-gray-500 whitespace-nowrap font-mono">
                                                {new Date(c.lastMessageTimestamp || c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 truncate mb-1">
                                            {c.lastMessage}
                                        </p>
                                        {c.userProfile && (
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase ${
                                                c.userProfile.tier === 'VIP'
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'bg-[#25C2A0]/10 text-[#4fdebb] border border-[#25C2A0]/20'
                                            }`}>
                                                {c.userProfile.tier}
                                            </span>
                                        )}
                                    </div>

                                    {/* Unread Counter Badge */}
                                    {c.unreadCount > 0 && (
                                        <span className="absolute top-3.5 right-3 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#00e5ff] text-[#001f24] shadow-lg animate-pulse">
                                            {c.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        {(() => {
                            const activeConv = conversations.find(c => c.conversationId === activeChat);
                            return (
                                <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${isDarkMode ? 'bg-[#1a1c1f] border-[#3c4a45]' : 'bg-black/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={activeConv?.userProfile?.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'} 
                                            alt="User Profile" 
                                            className="w-10 h-10 rounded-full object-cover border border-[#85948e]"
                                        />
                                        <div>
                                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                                {activeConv?.userProfile?.fullName || 'Active Session'}
                                                {activeConv?.userProfile && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                                        activeConv.userProfile.tier === 'VIP' ? 'bg-[#25C2A0]/20 text-[#4fdebb]' : 'bg-[#00e3fd]/20 text-[#bdf4ff]'
                                                    }`}>
                                                        {activeConv.userProfile.tier}
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-[9px] text-gray-500 font-mono">
                                                {activeConv?.userProfile?.email || activeChat.replace('conv_', '')}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-[#00e5ff] flex items-center gap-1 font-mono">
                                            <Sparkles size={10} /> Secure Tunnel
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}


                        {/* Messages Log */}
                        <div className={`flex-1 p-5 overflow-y-auto flex flex-col gap-3 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === user._id || msg.senderId === user.id;
                                return (
                                    <div
                                        key={msg._id || idx}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] p-3.5 rounded-[4px] text-xs shadow-sm ${
                                                isMe
                                                    ? 'bg-[#25C2A0]/20 text-[#4fdebb] border border-[#25C2A0]/30 rounded-tr-none font-mono'
                                                    : `rounded-tl-none ${isDarkMode ? 'bg-[#1e2023] border border-[#3c4a45] text-gray-100' : 'bg-white text-gray-800 border border-gray-100'}`
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: msg.message }}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Customer Typing status indicator */}
                        {isCustomerTyping && (
                            <div className={`px-5 py-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide border-t flex-shrink-0 ${
                                isDarkMode ? 'bg-[#111316] border-[#3c4a45] text-[#00e5ff]' : 'bg-gray-50 border-gray-100 text-[#00616d]'
                            }`}>
                                <div className="flex gap-1 items-center font-mono">
                                    <span>Customer is typing</span>
                                    <span className="flex gap-0.5">
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <form onSubmit={handleSend} className={`p-4 flex gap-2 items-center flex-shrink-0 ${isDarkMode ? 'bg-black/40 border-t border-[#3c4a45]' : 'bg-white border-t border-gray-100'}`}>
                            <div className={`flex-1 flex items-center rounded-[4px] overflow-hidden transition-colors ${
                                isDarkMode ? 'bg-[#1a1c1f] border border-[#3c4a45] focus-within:border-[#00e5ff]' : 'bg-gray-100 focus-within:bg-gray-200/50'
                             }`}>
                                <input
                                    type="text"
                                    placeholder="Enter encrypted support response..."
                                    value={input}
                                    onChange={handleInputChange}
                                    className={`w-full bg-transparent p-3.5 text-xs outline-none placeholder:text-gray-500 font-mono ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className={`p-3 rounded-[4px] flex items-center justify-center transition-all ${
                                    input.trim()
                                        ? 'bg-[#25C2A0] text-[#00382c] hover:bg-[#4fdebb] shadow-lg shadow-[#25C2A0]/20'
                                        : `bg-transparent ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`
                                }`}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-3">
                        <MessageSquare size={48} className="opacity-20 text-[#25C2A0] mb-2" />
                        <h4 className="text-base font-bold text-gray-400 label-caps">Support Console Empty</h4>
                        <p className="text-xs max-w-xs leading-relaxed">Select a conversation thread in the left sidebar to open an encrypted messaging tunnel.</p>
                    </div>
                )}
            </div>

            {/* Right Sidebar: Dynamic Client Profile Drawer */}
            <ClientProfileView profile={activeUserProfile} isDarkMode={isDarkMode} />
        </div>
    );
}
