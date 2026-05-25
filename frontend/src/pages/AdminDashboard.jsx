import React, { useState, useEffect, useContext, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import {
    RefreshCcw, TrendingUp, Users, Truck, MessageSquare,
    Lock, Volume2, MapPin, AlertTriangle, CheckCircle2,
    XCircle, Eye, EyeOff, ShieldAlert, Map, Activity, Zap
} from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AccountingTable from '../components/AccountingTable';
import FreshnessMonitor from '../components/FreshnessMonitor';
import CyberGalaxy from '../components/CyberGalaxy';
import Skeleton from '../components/Skeleton';
import LoadingBar from '../components/LoadingBar';

// Reuse icons from LiveMap for consistency
const courierSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <circle cx="20" cy="20" r="18" stroke="#00a86b" stroke-width="2" stroke-opacity="0.35">
    <animate attributeName="r" from="14" to="20" dur="1.8s" begin="0s" repeatCount="indefinite" />
    <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.8s" begin="0s" repeatCount="indefinite" />
  </circle>
  <circle cx="20" cy="20" r="15" fill="#0b2210" stroke="#00a86b" stroke-width="1.5"/>
  <path d="M11 25.5C11 24.1193 12.1193 23 13.5 23H17L19.5 19H17" stroke="#00a86b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="13.5" cy="27" r="2.5" stroke="#00a86b" stroke-width="2"/>
  <circle cx="26.5" cy="27" r="2.5" stroke="#00a86b" stroke-width="2"/>
  <path d="M21 19H27L25 23H21" stroke="#00a86b" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const dropOffSVG = (color = '#800020') => `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
  <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.5 18 46 18 46C18 46 36 29.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="${color}" stroke="#0a0a0a" stroke-width="1"/>
  <circle cx="18" cy="18" r="10" fill="#0a0a0a" stroke="#00a86b" stroke-width="1.5"/>
  <path d="M18 13V23M15 18H21" stroke="#00a86b" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const courierIcon = L.divIcon({ html: courierSVG, className: 'ht-map-icon', iconSize: [40, 40], iconAnchor: [20, 20] });
const dropOffIcon = (color) => L.divIcon({ html: dropOffSVG(color), className: 'ht-map-icon', iconSize: [36, 46], iconAnchor: [18, 46] });
const NAIROBI_CENTER = [-1.286389, 36.817223];

function playPing() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
}

const MemoizedCyberGalaxy = memo(CyberGalaxy);
const MemoizedAccountingTable = memo(AccountingTable);
const MemoizedFreshnessMonitor = memo(FreshnessMonitor);

function ConfirmCodeChangeModal({ onConfirm, onCancel }) {
    const [typed, setTyped] = useState('');
    const PHRASE = 'CHANGE CODE';
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
                style={{ background: 'rgba(10,10,20,0.97)', border: '1px solid rgba(128,0,32,0.3)', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(128,0,32,0.1)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(128,0,32,0.15)', border: '1px solid rgba(128,0,32,0.3)' }}>
                        <ShieldAlert size={22} className="text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Change Vault Access Code?</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Invalidates the code for ALL users immediately.</p>
                    </div>
                </div>
                <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>Customers with the old code will be locked out instantly. Distribute the new code first.</span>
                </div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">
                    Type <span className="font-mono text-red-400">CHANGE CODE</span> to confirm
                </label>
                <input value={typed} onChange={e => setTyped(e.target.value.toUpperCase())} placeholder="CHANGE CODE"
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none mb-5 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${typed === PHRASE ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`, color: '#fff' }} />
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                    <button disabled={typed !== PHRASE} onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                        style={{
                            background: typed === PHRASE ? 'rgba(128,0,32,0.25)' : 'rgba(255,255,255,0.03)',
                            border: typed === PHRASE ? '1px solid rgba(192,0,60,0.5)' : '1px solid rgba(255,255,255,0.05)',
                            color: typed === PHRASE ? '#f87171' : '#4b5563',
                            cursor: typed === PHRASE ? 'pointer' : 'not-allowed',
                        }}>Confirm Change</button>
                </div>
            </motion.div>
        </div>
    );
}

function KpiCard({ title, value, sub, icon, color, index, loading }) {
    if (loading) return <Skeleton className="h-[140px] w-full" />;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
            className="relative rounded-3xl p-6 overflow-hidden group transition-all duration-400 hover:-translate-y-1"
            style={{ background: 'rgba(13,13,26,0.85)', border: `1px solid rgba(255,255,255,0.06)`, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = color + '55'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
        >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-20 transition-opacity duration-400 group-hover:opacity-40"
                style={{ background: color }} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <span style={{ color }}>{icon}</span> {title}
            </h3>
            <p className="text-3xl font-black text-white mb-1">{value}</p>
            {sub && <p className="text-xs text-gray-600">{sub}</p>}
        </motion.div>
    );
}

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeChats, setActiveChats] = useState([]);
    const [pingEnabled, setPingEnabled] = useState(true);
    const [vaultCodeVisible, setVaultCodeVisible] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [rotateStatus, setRotateStatus] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeTelemetry, setActiveTelemetry] = useState({ freshness: 100, countdown: 1800 });
    const [galaxyVariant, setGalaxyVariant] = useState('lilac');
    const [repulsionLevel, setRepulsionLevel] = useState(1);
    const [displayPos, setDisplayPos] = useState(NAIROBI_CENTER);
    const [highlightedOrderId, setHighlightedOrderId] = useState(null);
    const [mapPoints, setMapPoints] = useState([]);
    const targetPos = useRef(NAIROBI_CENTER);

    // Lerp logic for smooth courier movement
    useEffect(() => {
        let frame;
        const animate = () => {
            setDisplayPos(prev => {
                const [cL, cG] = prev, [tL, tG] = targetPos.current;
                const nextL = cL + (tL - cL) * 0.1, nextG = cG + (tG - cG) * 0.1;
                return (Math.abs(nextL - tL) < 0.00001 && Math.abs(nextG - tG) < 0.00001) ? [tL, tG] : [nextL, nextG];
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    const pingEnabledRef = useRef(true);
    useEffect(() => { pingEnabledRef.current = pingEnabled; }, [pingEnabled]);

    // ── Queries ───────────────────────────────────────────────
    const { data: dashboardData, isFetching: dashboardFetching, isLoading: dashboardLoading } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: async () => {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/reports`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            return data;
        },
        placeholderData: keepPreviousData,
        staleTime: 10000,
        refetchInterval: 30000,
    });

    const { data: vaultData, isFetching: vaultFetching } = useQuery({
        queryKey: ['vaultCode'],
        queryFn: async () => {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/vault-code`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            return data;
        },
        placeholderData: keepPreviousData,
        staleTime: 60000,
    });

    const kpis = dashboardData?.kpis || { grossRevenue: 0, processingFees: 0, netProfit: 0, traffic24h: 0 };
    const orders = dashboardData?.orders || [];
    const vaultCode = vaultData?.code || '——';
    const vaultExpiry = vaultData?.expiresAt;
    const vaultLocked = vaultData?.isLocked;
    const vaultLockedBy = vaultData?.lockedBy;

    const handleNewInquiry = useCallback((msg) => {
        if (pingEnabledRef.current) playPing();
        setActiveChats(prev => {
            const exists = prev.find(c => c.senderId === msg.senderId);
            if (exists) return prev.map(c => c.senderId === msg.senderId ? { ...c, unread: c.unread + 1, lastMessage: msg.message, timestamp: msg.timestamp } : c);
            return [{ senderId: msg.senderId, unread: 1, lastMessage: msg.message, timestamp: msg.timestamp }, ...prev];
        });
    }, []);

    useEffect(() => {
        const token = user?.token || localStorage.getItem('token');
        const adminSecretKey = sessionStorage.getItem('adminSecretKey') || localStorage.getItem('adminSecretKey') || '';
        
        const sock = io(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/support`, {
            auth: { role: 'ADMIN', adminEmail: user?.email || '', adminSecretKey, token },
            reconnectionAttempts: 5, reconnectionDelay: 2000
        });

        sock.on('new_inquiry_alert', handleNewInquiry);
        sock.on('receive_message', (msg) => { if (!msg.isFromAdmin) handleNewInquiry(msg); });
        
        // Handle Batched Updates
        sock.on('order:update_batch', (batch) => {
            if (batch && batch.length > 0) {
                const latest = batch[batch.length - 1];
                setActiveTelemetry({ freshness: latest.freshness, countdown: latest.countdown });
                targetPos.current = [latest.lat, latest.lng];
            }
        });

        sock.on('init_points', (pts) => setMapPoints(pts));
        sock.on('new_dropoff_synced', (pt) => setMapPoints(p => [...p.filter(x => x.id !== pt.id), pt]));
        sock.emit('join_map'); // Join map room for background telemetry

        sock.on('geofence_breach', () => { 
            setGalaxyVariant('security'); 
            if (pingEnabledRef.current) playPing(); 
            setTimeout(() => setGalaxyVariant('lilac'), 10000); 
        });
        
        sock.on('mpesa_progress', (p) => setRepulsionLevel(1 + p * 4));
        
        return () => sock.disconnect();
    }, [handleNewInquiry, user]);

    const handleRotateCode = async () => {
        setShowConfirmModal(false); setIsRotating(true); setRotateStatus(null);
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/rotate-codes`, 
                { adminEmail: user?.email || 'admin' },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            if (data.success) {
                queryClient.setQueryData(['vaultCode'], data);
                setRotateStatus({ type: 'success', msg: 'Vault code changed successfully.' });
            } else { setRotateStatus({ type: 'error', msg: data.message }); }
        } catch (err) {
            setRotateStatus({ type: 'error', msg: err.response?.status === 423 ? err.response.data?.message : 'Failed to change vault code.' });
            queryClient.invalidateQueries({ queryKey: ['vaultCode'] });
        } finally {
            setIsRotating(false);
            setTimeout(() => setRotateStatus(null), 6000);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Order ID', 'M-Pesa Receipt', 'Customer', 'Gross (KSh)', 'Fee (0.5%)', 'Net (KSh)', 'Status'];
        const rows = orders.map(o => [
            new Date(o.createdAt).toLocaleDateString('en-KE'), o.orderId || o._id,
            o.mpesaReceiptNumber || 'N/A', o.customerId?.fullName || 'Unknown',
            Number(o.grossRevenue).toFixed(2), (Number(o.grossRevenue) * 0.005).toFixed(2),
            (Number(o.grossRevenue) * 0.995).toFixed(2), o.paymentStatus
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `za_report_${Date.now()}.csv` });
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const expiryLabel = vaultExpiry ? `Expires ${new Date(vaultExpiry).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : 'Active 24-Hour Code';
    const canRotate = !isRotating && !vaultLocked;

    return (
        <>
            <LoadingBar active={dashboardFetching || vaultFetching} />
            {showConfirmModal && <ConfirmCodeChangeModal onCancel={() => setShowConfirmModal(false)} onConfirm={handleRotateCode} />}

            <div className="relative min-h-screen overflow-hidden bg-black">
                {/* 1. The High-Fidelity Map Layer as Canvas */}
                <div className="absolute inset-0 z-0 opacity-40 grayscale-[0.5] contrast-[1.2]">
                    <MapContainer center={NAIROBI_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={displayPos} icon={courierIcon} className="courier-marker-active" />
                        {mapPoints.map(pt => (
                            <Marker key={pt.id} position={[pt.lat, pt.lng]} icon={dropOffIcon(highlightedOrderId === pt.orderId ? '#800020' : '#4a4a4a')} />
                        ))}
                    </MapContainer>
                </div>

                <MemoizedCyberGalaxy variant={galaxyVariant} repulsionMultiplier={repulsionLevel} />

                <main className="relative z-10 max-w-7xl mx-auto p-4 sm:p-8">
                    {/* ── Header ── */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="font-graffiti text-4xl md:text-5xl mb-1" style={{ color: '#800020', textShadow: '0 0 30px rgba(128,0,32,0.5)' }}>
                                Command Center
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-jade animate-blink" />
                                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Live Dashboard</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: 'rgba(0,168,107,0.1)', border: '1px solid rgba(0,168,107,0.2)' }}>
                                <Activity size={14} className="text-jade animate-pulse" />
                                <span className="text-xs font-bold text-jade">Systems Active</span>
                            </div>
                            <button onClick={() => setPingEnabled(p => !p)}
                                className="p-2.5 rounded-2xl transition-all"
                                style={{ background: pingEnabled ? 'rgba(200,162,200,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${pingEnabled ? 'rgba(200,162,200,0.3)' : 'rgba(255,255,255,0.06)'}`, color: pingEnabled ? '#c8a2c8' : '#6b7280' }}>
                                <Volume2 size={16} />
                            </button>
                        </div>
                    </motion.div>

                    {/* ── KPI Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <KpiCard index={0} title="Net Profit" icon={<TrendingUp size={15} />} color="#00a86b"
                            loading={dashboardLoading}
                            value={`KSh ${kpis.netProfit.toLocaleString()}`}
                            sub={`Gross: ${kpis.grossRevenue.toLocaleString()} · Fees: ${kpis.processingFees.toLocaleString()}`} />
                        <KpiCard index={1} title="24H Traffic" icon={<Users size={15} />} color="#c8a2c8"
                            loading={dashboardLoading}
                            value={kpis.traffic24h} sub="unique visitors" />
                        <KpiCard index={2} title="Active Logistics" icon={<Truck size={15} />} color="#f97316"
                            loading={dashboardLoading}
                            value={kpis.activeDeliveries || 0} sub="pending deliveries" />
                        
                        {/* Map card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                            onClick={() => navigate('/map')}
                            className="relative rounded-3xl p-6 overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-400"
                            style={{ background: 'rgba(0,168,107,0.08)', border: '1px solid rgba(0,168,107,0.2)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity" style={{ background: '#00a86b' }} />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-jade mb-3 flex items-center gap-2"><Map size={15} /> Drop-off Map</h3>
                            <p className="text-xl font-black text-white mb-1">Manage Points</p>
                            <p className="text-xs text-jade/60">Add & clear delivery zones →</p>
                            <MapPin size={13} className="inline text-jade mt-2 mr-1" />
                            <span className="text-[11px] font-bold text-jade uppercase tracking-wider">Open Map Manager</span>
                        </motion.div>
                    </div>

                    {/* ── Vault Panel ── */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mb-6 p-6 rounded-3xl relative overflow-hidden"
                        style={{ background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(128,0,32,0.3)', boxShadow: '0 0 40px rgba(128,0,32,0.1), 0 8px 32px rgba(0,0,0,0.5)' }}>
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(128,0,32,0.06) 0%, transparent 60%, rgba(200,162,200,0.04) 100%)' }} />

                        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                            {/* Left */}
                            <div className="flex-1">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: '#c0003c' }}>
                                    <Lock size={13} /> Premium Vault Access Code
                                    <span className="text-gray-600 normal-case tracking-normal font-normal text-[10px] ml-1">{expiryLabel}</span>
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl font-black font-mono tracking-[0.3em] text-white transition-all duration-300"
                                        style={{ filter: vaultCodeVisible ? 'none' : 'blur(10px)', userSelect: vaultCodeVisible ? 'auto' : 'none' }}>
                                        {vaultCodeVisible ? vaultCode : '●●●●●●'}
                                    </span>
                                    <button onClick={() => setVaultCodeVisible(v => !v)}
                                        className="p-2 rounded-xl transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>
                                        {vaultCodeVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {vaultLocked && (
                                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Being changed by {vaultLockedBy || 'another admin'}…
                                    </p>
                                )}
                            </div>

                            {/* Right */}
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <AnimatePresence>
                                    {rotateStatus && (
                                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                                            style={{
                                                background: rotateStatus.type === 'success' ? 'rgba(0,168,107,0.12)' : 'rgba(239,68,68,0.12)',
                                                border: rotateStatus.type === 'success' ? '1px solid rgba(0,168,107,0.3)' : '1px solid rgba(239,68,68,0.3)',
                                                color: rotateStatus.type === 'success' ? '#34d399' : '#f87171',
                                            }}>
                                            {rotateStatus.type === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                            {rotateStatus.msg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => queryClient.invalidateQueries({ queryKey: ['vaultCode'] })} 
                                        className="p-2.5 rounded-xl transition-all"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
                                        <RefreshCcw size={15} className={vaultFetching ? 'animate-spin' : ''} />
                                    </button>
                                    <button disabled={!canRotate} onClick={() => setShowConfirmModal(true)}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                                        style={{
                                            background: canRotate ? 'rgba(128,0,32,0.2)' : 'rgba(255,255,255,0.03)',
                                            border: canRotate ? '1px solid rgba(192,0,60,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                            color: canRotate ? '#f87171' : '#4b5563',
                                            cursor: canRotate ? 'pointer' : 'not-allowed',
                                        }}>
                                        {isRotating ? <><RefreshCcw size={14} className="animate-spin" /> Changing…</>
                                            : vaultLocked ? <><Lock size={14} /> Locked</>
                                                : <><Zap size={14} /> Change Code</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Bottom Grid ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            {dashboardLoading ? (
                                <Skeleton className="h-[400px] w-full" />
                            ) : (
                                <MemoizedAccountingTable data={orders} onExport={handleExportCSV} />
                            )}
                        </div>

                        {/* Inquiries panel */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                            className="rounded-3xl p-6 flex flex-col h-[500px]"
                            style={{ background: 'rgba(13,13,26,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-fuchsia-500" /> Live Inquiries
                                </h3>
                                {activeChats.length > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(217,70,239,0.2)', border: '1px solid rgba(217,70,239,0.3)', color: '#e879f9' }}>
                                        {activeChats.reduce((a, c) => a + c.unread, 0)} new
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-auto space-y-3">
                                {activeChats.map(chat => (
                                    <motion.div key={chat.senderId}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => setHighlightedOrderId(chat.orderId)}
                                        className={`p-4 rounded-full cursor-pointer transition-all duration-300 relative group border ${
                                            highlightedOrderId === chat.orderId ? 'bg-burgundy/20 border-burgundy/40' : 'bg-white/5 border-white/10'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${highlightedOrderId === chat.orderId ? 'bg-burgundy animate-pulse' : 'bg-lilac'}`} />
                                            <h4 className="font-bold text-gray-200 text-sm">Order Context: {chat.orderId || 'General'}</h4>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-1 pl-5">{chat.lastMessage}</p>
                                        {chat.unread > 0 && (
                                            <span className="absolute top-3 right-5 h-5 w-5 rounded-full text-[9px] font-black flex items-center justify-center bg-burgundy text-white shadow-lg">
                                                {chat.unread}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                                {activeChats.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                        <MessageSquare size={40} className="mb-3 opacity-20" />
                                        <p className="text-sm">No active support streams</p>
                                        <p className="text-xs mt-1 opacity-50">Waiting for customer queries…</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Freshness monitor */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6">
                        <MemoizedFreshnessMonitor freshness={activeTelemetry.freshness} countdown={activeTelemetry.countdown} />
                    </motion.div>
                </main>
            </div>
        </>
    );
}

