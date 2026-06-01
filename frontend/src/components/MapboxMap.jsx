import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Check token validity
const rawToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const hasValidToken = rawToken && rawToken !== 'your_token_here' && rawToken.startsWith('pk.');

// Use the token if valid, or use a dummy token to bypass Mapbox's empty-token error
mapboxgl.accessToken = hasValidToken ? rawToken : 'pk.eyJ1IjoiemFnby1kZW1vIiwiYSI6ImNsd3F1cTVzMDBndGkya252dzI5azN2bXYifQ.mock-token-to-prevent-crash';

// OpenStreetMap Style fallback for when no valid Mapbox token is present
const osmStyleFallback = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

/**
 * Reusable Mapbox Canvas Container Component.
 * Fallbacks to OpenStreetMap raster tiles if no valid Mapbox token is present.
 */
export default function MapboxMap({ 
  center = [36.8219, -1.2921], // [longitude, latitude] - Nairobi, Kenya
  zoom = 12, 
  styleUrl = 'mapbox://styles/mapbox/streets-v12',
  className = "w-full h-full min-h-[500px] rounded-2xl border border-jade-500/20 shadow-2xl",
  markers = [] 
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use OSM style fallback if no valid token
    const mapStyle = hasValidToken ? styleUrl : osmStyleFallback;

    // Instantiate mapbox gl map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      attributionControl: true
    });

    // Add navigation controls (zoom, rotate)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current = map;

    map.on('load', () => {
      setMapInitialized(true);
    });

    return () => {
      map.remove();
    };
  }, []);

  // Update center smoothly when prop changes
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;
    mapRef.current.flyTo({
      center: center,
      zoom: zoom,
      essential: true,
      duration: 1500
    });
  }, [center, zoom, mapInitialized]);

  // Manage Markers dynamically
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;

    // A list to track markers that we add
    const currentMarkers = [];

    // Add new markers from props
    markers.forEach(markerData => {
      const { coords, popupText, color = '#00a36c' } = markerData;
      if (!coords || coords.length !== 2) return;

      const marker = new mapboxgl.Marker({ color })
        .setLngLat(coords);

      if (popupText) {
        marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div>${popupText}</div>`));
      }

      marker.addTo(mapRef.current);
      currentMarkers.push(marker);
    });

    return () => {
      // Clean up markers on update
      currentMarkers.forEach(m => m.remove());
    };
  }, [markers, mapInitialized]);

  return (
    <div className="relative w-full h-full">
      {!hasValidToken && (
        <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-500 text-[10px] font-bold tracking-wider uppercase shadow-md">
          ⚠️ Token Missing - OSM Raster Tile Workaround Active
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className={className} 
        style={{ width: '100%', height: '500px' }} 
      />
    </div>
  );
}
