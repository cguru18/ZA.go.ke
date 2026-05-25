import React, { useEffect, useState, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { MapPin, Trash2, Radio, AlertCircle, Navigation } from 'lucide-react';

// ─────────────────────────────────────────────
//  Custom SVG Icon Definitions (brand assets)
// ─────────────────────────────────────────────

const courierSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <circle cx="20" cy="20" r="18" stroke="#00a36c" stroke-width="2" stroke-opacity="0.35">
    <animate attributeName="r" from="14" to="20" dur="1.8s" begin="0s" repeatCount="indefinite" />
    <animate attributeName="stroke-opacity" from="0.6" to="0" dur="1.8s" begin="0s" repeatCount="indefinite" />
  </circle>
  <circle cx="20" cy="20" r="15" fill="#0b2210" stroke="#00a36c" stroke-width="1.5"/>
  <path d="M11 25.5C11 24.1193 12.1193 23 13.5 23H17L19.5 19H17" stroke="#00a36c" stroke-width="2" stroke-linecap="round"/>
  <circle cx="13.5" cy="27" r="2.5" stroke="#00a36c" stroke-width="2"/>
  <circle cx="26.5" cy="27" r="2.5" stroke="#00a36c" stroke-width="2"/>
  <path d="M21 19H27L25 23H21" stroke="#00a36c" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const dropOffSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
  <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.5 18 46 18 46C18 46 36 29.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="#800020" stroke="#0a0a0a" stroke-width="1"/>
  <circle cx="18" cy="18" r="10" fill="#0a0a0a" stroke="#00a36c" stroke-width="1.5"/>
  <path d="M18 13V23M15 18H21" stroke="#00a36c" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const courierIcon = L.divIcon({
    html: courierSVG,
    className: 'ht-map-icon',
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
});

const dropOffIcon = L.divIcon({
    html: dropOffSVG,
    className: 'ht-map-icon',
    iconSize:   [36, 46],
    iconAnchor: [18, 46], // tip of the pin
});

// Nairobi CBD default
const NAIROBI_CENTER = [-1.286389, 36.817223];

// ─────────────────────────────────────────────
//  Inner component: handles map click for admin
// ─────────────────────────────────────────────
function AdminClickHandler({ isAdmin, onAdminClick }) {
    useMapEvents({
        click(e) {
            if (!isAdmin) return;
            onAdminClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function LiveMap() {
    const { user } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);

    const isAdmin = user?.role === 'ADMIN';
    const token   = user?.token || localStorage.getItem('token');

    const [socket,     setSocket]     = useState(null);
    const [points,     setPoints]     = useState([]);
    const [courierPos, setCourierPos] = useState(NAIROBI_CENTER);
    const [mapError,   setMapError]   = useState(null);
    const [isLive,     setIsLive]     = useState(false);
    const [pointCount, setPointCount] = useState(0);

    // GPS Native Access
    const [userLocation, setUserLocation] = useState(null);
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // Center map on user location if close to Nairobi or for demo
                setUserLocation([latitude, longitude]);
            });
        }
    }, []);

    const [displayPos, setDisplayPos] = useState(NAIROBI_CENTER);
    const targetPos = React.useRef(NAIROBI_CENTER);
    const mapCenter = userLocation || NAIROBI_CENTER;

    useEffect(() => {
        let animationFrameId;
        const animate = () => {
            setDisplayPos(prev => {
                const [curLat, curLng] = prev;
                const [tarLat, tarLng] = targetPos.current;
                
                // Lerp factor (adjust for speed/fluidity)
                const lerpFactor = 0.1; 
                const nextLat = curLat + (tarLat - curLat) * lerpFactor;
                const nextLng = curLng + (tarLng - curLng) * lerpFactor;
                
                // Stop if close enough
                if (Math.abs(nextLat - tarLat) < 0.00001 && Math.abs(nextLng - tarLng) < 0.00001) {
                    return [tarLat, tarLng];
                }
                return [nextLat, nextLng];
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // ── Socket setup ──────────────────────────────────────────
    useEffect(() => {
        const sock = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { transports: ['websocket', 'polling'] });

        sock.on('connect', () => {
            setIsLive(true);
            sock.emit('join_map'); 
        });

        sock.on('disconnect', () => setIsLive(false));

        sock.on('init_points', (pts) => {
            setPoints(pts);
            setPointCount(pts.length);
        });

        sock.on('new_dropoff_synced', (pt) => {
            setPoints(prev => {
                if (prev.find(p => p.id === pt.id)) return prev;
                return [...prev, pt];
            });
            setPointCount(c => c + 1);
        });

        // Handle Batched Courier Movements
        sock.on('global:courier_batch', (batch) => {
            if (batch && batch.length > 0) {
                const latest = batch[batch.length - 1];
                targetPos.current = [latest.lat, latest.lng];
                setCourierPos([latest.lat, latest.lng]);
            }
        });

        // Also listen for single order updates if needed (Command 2)
        sock.on('order:update', (data) => {
            if (data.lat && data.lng) {
                targetPos.current = [data.lat, data.lng];
                setCourierPos([data.lat, data.lng]);
            }
        });

        sock.on('map_cleared', () => {
            setPoints([]);
            setPointCount(0);
        });

        sock.on('map_error', (err) => {
            setMapError(err.message);
            setTimeout(() => setMapError(null), 4000);
        });

        setSocket(sock);
        return () => sock.disconnect();
    }, []);

    // ── Admin: add a point ────────────────────────────────────
    const handleAdminClick = useCallback((lat, lng) => {
        if (!socket || !isAdmin) return;
        const newPoint = {
            id:    Date.now(),
            lat,
            lng,
            label: `Drop-off #${pointCount + 1}`,
        };
        // Pass JWT as second argument for server-side verification
        socket.emit('admin_add_point', newPoint, token);
    }, [socket, isAdmin, pointCount, token]);

    // ── Admin: clear all ──────────────────────────────────────
    const handleClearAll = () => {
        if (!socket || !isAdmin) return;
        if (!window.confirm('Clear ALL drop-off points for every user?')) return;
        socket.emit('admin_clear_all', token);
    };

    // ── Tile theme ────────────────────────────────────────────
    const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttr = isDarkMode
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    const boxStyle = `rounded-2xl backdrop-blur-lg border ${
        isDarkMode
            ? 'bg-black/60 border-jade-500/30 text-gray-100'
            : 'bg-white/80 border-jade-500/20 text-gray-800'
    }`;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-graffiti text-jade-500 flex items-center gap-3">
                        <Radio className="animate-pulse" size={28} />
                        Live Feed Map
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time drop-off sync across all connected users &amp; couriers
                    </p>
                </div>

                {/* Live status pill */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        isLive
                            ? 'bg-jade-500/15 text-jade-400 border-jade-500/30'
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-jade-500 animate-pulse' : 'bg-gray-500'}`} />
                        {isLive ? 'LIVE' : 'OFFLINE'}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${boxStyle}`}>
                        <MapPin size={11} className="inline mr-1 text-jade-400" />
                        {points.length} Drop-offs
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {mapError && (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {mapError}
                </div>
            )}

            {/* Map wrapper */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40"
                 style={{ height: '600px' }}>

                {/* Admin Controls Overlay */}
                {isAdmin && (
                    <div className="absolute top-4 left-4 z-[1000] w-56 p-4 rounded-2xl bg-black/70 border border-jade-500/40 backdrop-blur-md shadow-xl">
                        <h3 className="text-jade-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                            <MapPin size={13} /> Admin Controls
                        </h3>
                        <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                            Click anywhere on the map to add a universal drop-off point. Points persist across sessions.
                        </p>
                        <button
                            onClick={handleClearAll}
                            className="w-full py-2 flex items-center justify-center gap-2 bg-burgundy-500/15 border border-burgundy-500/40 text-burgundy-400 hover:bg-burgundy-500/30 transition-colors text-xs font-bold rounded-xl uppercase tracking-wider"
                        >
                            <Trash2 size={12} />
                            Clear All Points
                        </button>
                    </div>
                )}

                {/* Courier position tooltip */}
                <div className="absolute bottom-4 right-4 z-[1000] px-4 py-2 rounded-full bg-black/70 border border-jade-500/30 backdrop-blur-md text-xs text-jade-400 flex items-center gap-2">
                    <Navigation size={13} className="animate-pulse" />
                    Courier @ {displayPos[0].toFixed(4)}, {displayPos[1].toFixed(4)}
                </div>

                {/* The Leaflet Map */}
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    <TileLayer url={tileUrl} attribution={tileAttr} />

                    {/* Admin click handler — no-op for non-admins */}
                    <AdminClickHandler isAdmin={isAdmin} onAdminClick={handleAdminClick} />

                    {/* Courier marker — moves with courier_update events via Lerp */}
                    <Marker position={displayPos} icon={courierIcon} className="courier-marker-active">
                        <Popup>
                            <div className="text-center text-sm">
                                <strong style={{ color: '#00a36c' }}>Heat &amp; Treats Courier</strong>
                                <br />
                                <span style={{ fontSize: '11px', color: '#888' }}>Live position</span>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Drop-off markers — synced in real-time */}
                    {points.map((point) => (
                        <Marker
                            key={point.id}
                            position={[point.lat, point.lng]}
                            icon={dropOffIcon}
                        >
                            <Popup>
                                <div className="text-center text-sm">
                                    <strong style={{ color: '#800020' }}>{point.label}</strong>
                                    <br />
                                    <span style={{ fontSize: '10px', color: '#888' }}>
                                        Real-time synced ✓
                                    </span>
                                    <br />
                                    <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>
                                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Points table */}
            {points.length > 0 && (
                <div className={`mt-6 ${boxStyle} p-5`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <MapPin size={14} className="text-jade-500" />
                        Active Drop-off Points
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/10">
                                <tr>
                                    <th className="pb-2 pr-6">Label</th>
                                    <th className="pb-2 pr-6">Latitude</th>
                                    <th className="pb-2">Longitude</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {points.map(pt => (
                                    <tr key={pt.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-2.5 pr-6 font-bold text-jade-400">{pt.label}</td>
                                        <td className="py-2.5 pr-6 font-mono text-xs text-gray-400">{pt.lat.toFixed(6)}</td>
                                        <td className="py-2.5 font-mono text-xs text-gray-400">{pt.lng.toFixed(6)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
