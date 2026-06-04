import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom bike/courier icon
const courierIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2983/2983057.png', // A free bike icon URL
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Helper component to smoothly move map center when courier moves
const MapCenterUpdater = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

export default function MapTracker({ lat, lng, eta, status, message }) {
  return (
    <div className="stitch-theme w-full h-full">
      <div className="w-full h-96 bg-[#0c0e11] rounded-lg border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-4 left-4 z-[1000] bg-[#1a1c1f]/90 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-lg min-w-[220px]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#bbcac3] mb-2 label-caps">Courier Telemetry</h4>
          <div className="text-sm space-y-2">
            <p className="flex justify-between items-center">
              <span className="text-[#bbcac3]">Status:</span> 
              <span className="font-bold flex items-center gap-1.5 text-[#25C2A0] text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25C2A0] animate-pulse"></span>
                {status}
              </span>
            </p>
            <p className="flex justify-between items-center">
              <span className="text-[#bbcac3]">ETA:</span> 
              <span className="font-bold text-[#00E5FF] telemetry">{eta ? `${eta} mins` : 'Calculating...'}</span>
            </p>
            <p className="flex justify-between items-center text-xs">
              <span className="text-[#bbcac3]">Coords:</span>
              <span className="text-[#00E5FF] telemetry">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </p>
          </div>
          {message && (
            <div className="mt-3 p-2 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/30 animate-pulse font-mono telemetry">
              {message}
            </div>
          )}
        </div>

      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater lat={lat} lng={lng} />
        
        <Marker position={[lat, lng]} icon={courierIcon}>
          <Popup>
            <div className="text-center font-bold text-gray-800">
              Courier Location<br/>
              <span className="text-xs text-gray-500 font-normal">Updating in real-time</span>
            </div>
          </Popup>
        </Marker>

        {/* Customer Target Marker (Fixed in Nairobi CBD for simulation) */}
        <Marker position={[-1.2921, 36.8219]}>
          <Popup>Delivery Destination</Popup>
        </Marker>
      </MapContainer>
      </div>
    </div>
  );
}
