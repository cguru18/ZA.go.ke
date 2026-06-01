import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Send, Users, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

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

    // 1. Fetch all unique active conversation threads
    const fetchConversations = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/conversations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                setConversations(data.conversations);
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

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, [user, token, activeChat]);

    // 4. Bind socket connection to selected room on switch
    const selectConversation = (id) => {
        setActiveChat(id);
        if (socket) {
            socket.emit('join_conversation', id);
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
        background: isDarkMode ? 'rgba(10,10,20,0.85)' : '#fff',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDarkMode ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.08)'
    };

    return (
        <div className="rounded-3xl overflow-hidden flex h-[35rem] w-full" style={containerStyle}>
            {/* Sidebar: Conversation Threads */}
            <div className={`w-80 flex flex-col border-r ${isDarkMode ? 'border-white/5 bg-black/10' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                    <Users size={16} className="text-fuchsia-500" />
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Support Queue</h3>
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
                                    className={`w-full p-3 rounded-2xl text-left flex flex-col gap-1 transition-all ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 border border-fuchsia-500/30' 
                                            : `border border-transparent ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`
                                    }`}
                                >
                                    <span className="font-bold text-xs text-white truncate">
                                        {c.conversationId.replace('conv_', 'User: ')}
                                    </span>
                                    <span className="text-[10px] text-gray-400 truncate">
                                        {c.lastMessage}
                                    </span>
                                    <span className="text-[9px] text-gray-500 text-right mt-1">
                                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
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
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/10 flex-shrink-0">
                            <div>
                                <h4 className="font-bold text-sm text-white">
                                    Active Session: {activeChat.replace('conv_', '')}
                                </h4>
                                <p className="text-[10px] text-fuchsia-400 flex items-center gap-1 mt-0.5">
                                    <Sparkles size={10} /> End-to-End Encrypted Tunnel
                                </p>
                            </div>
                        </div>

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
                                            className={`max-w-[70%] p-3.5 rounded-2xl text-xs shadow-sm ${
                                                isMe
                                                    ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white rounded-tr-sm'
                                                    : `rounded-tl-sm ${isDarkMode ? 'bg-white/10 text-gray-100' : 'bg-white text-gray-800 border border-gray-100'}`
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: msg.message }}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className={`p-4 flex gap-2 items-center flex-shrink-0 ${isDarkMode ? 'bg-black/40 border-t border-white/5' : 'bg-white border-t border-gray-100'}`}>
                            <div className={`flex-1 flex items-center rounded-2xl overflow-hidden transition-colors ${
                                isDarkMode ? 'bg-white/5 focus-within:bg-white/10' : 'bg-gray-100 focus-within:bg-gray-200/50'
                             }`}>
                                <input
                                    type="text"
                                    placeholder="Enter encrypted support response..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full bg-transparent p-3.5 text-xs outline-none placeholder:text-gray-400 text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${
                                    input.trim()
                                        ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30'
                                        : `bg-transparent ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`
                                }`}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-3">
                        <MessageSquare size={48} className="opacity-20 text-fuchsia-500 mb-2" />
                        <h4 className="text-base font-bold text-gray-400">Support Console Empty</h4>
                        <p className="text-xs max-w-xs leading-relaxed">Select a conversation thread in the left sidebar to open an encrypted messaging tunnel.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
