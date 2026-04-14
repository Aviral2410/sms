import React, { useEffect, useRef, useState } from 'react';
import { 
  TransportRouteResponse, 
  TransportStopResponse, 
  TransportVehiclePositionResponse 
} from '../../lib/api';

// CDN URLs for Leaflet
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

interface TransportLiveMapProps {
  route: TransportRouteResponse;
  stops: TransportStopResponse[];
  latestPosition: TransportVehiclePositionResponse | null;
  className?: string;
  mode?: 'SCHEMATIC' | 'REAL_MAP';
}

export const TransportLiveMap: React.FC<TransportLiveMapProps> = ({ 
  route, 
  stops, 
  latestPosition,
  className = "",
  mode = 'SCHEMATIC'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const vehicleMarker = useRef<any>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Load Leaflet Script and CSS dynamically for Premium Mode
  useEffect(() => {
    if (mode !== 'REAL_MAP' || isLeafletReady) return;

    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.onload = () => setIsLeafletReady(true);
      document.head.appendChild(script);
    } else {
      setIsLeafletReady(true);
    }
  }, [mode, isLeafletReady]);

  // Initialize Real Map
  useEffect(() => {
    if (mode === 'REAL_MAP' && isLeafletReady && mapRef.current && !leafletInstance.current) {
      const L = (window as any).L;
      const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
      const centerLat = sortedStops.length > 0 ? sortedStops[0].latitude : 0;
      const centerLng = sortedStops.length > 0 ? sortedStops[0].longitude : 0;

      leafletInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([centerLat, centerLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletInstance.current);

      // Add Custom Bus Icon
      const busIcon = L.divIcon({
        className: 'custom-bus-icon',
        html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🚌</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      vehicleMarker.current = L.marker([centerLat, centerLng], { icon: busIcon }).addTo(leafletInstance.current);

      // Add Stops
      sortedStops.forEach(stop => {
        L.circleMarker([stop.latitude, stop.longitude], {
          radius: 6,
          fillColor: 'var(--accent-primary, #6366f1)',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        }).addTo(leafletInstance.current)
          .bindPopup(`<b>${stop.stopName}</b><br>Pickup: ${stop.pickupTime}`);
      });

      // Draw Path
      L.polyline(sortedStops.map(s => [s.latitude, s.longitude]), {
        color: 'var(--accent-primary, #6366f1)',
        weight: 3,
        opacity: 0.5,
        dashArray: '5, 10'
      }).addTo(leafletInstance.current);
    }

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [mode, isLeafletReady, stops]);

  // Update Vehicle Position on Real Map
  useEffect(() => {
    if (mode === 'REAL_MAP' && leafletInstance.current && vehicleMarker.current && latestPosition) {
      const L = (window as any).L;
      const pos = [latestPosition.latitude, latestPosition.longitude];
      vehicleMarker.current.setLatLng(pos);
      leafletInstance.current.panTo(pos);
    }
  }, [mode, latestPosition]);

  // Schematic Render (Free Mode)
  if (mode === 'SCHEMATIC') {
    const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);
    if (sortedStops.length === 0) {
      return (
        <div className={`aspect-video bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-700/50 ${className}`}>
          <p className="text-slate-400">No stops configured for this route.</p>
        </div>
      );
    }

    const lats = sortedStops.map(s => s.latitude);
    const lngs = sortedStops.map(s => s.longitude);
    if (latestPosition) {
      lats.push(latestPosition.latitude);
      lngs.push(latestPosition.longitude);
    }
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const rangeLat = maxLat - minLat || 0.01;
    const rangeLng = maxLng - minLng || 0.01;

    const normalize = (lat: number, lng: number) => ({
      x: 10 + ((lng - minLng) / rangeLng) * 80,
      y: 90 - ((lat - minLat) / rangeLat) * 80
    });

    const pathPoints = sortedStops.map(s => normalize(s.latitude, s.longitude));

    return (
      <div className={`relative aspect-video bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <polyline
            points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--accent-primary, #6366f1)"
            strokeWidth="1"
            strokeDasharray="2,2"
            className="opacity-50"
          />
          {pathPoints.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="1.5" fill="var(--accent-primary, #6366f1)" />
              <text x={p.x} y={p.y - 3} fontSize="2" fill="white" textAnchor="middle" className="font-medium">{sortedStops[i].stopName}</text>
            </g>
          ))}
          {latestPosition && (() => {
            const p = normalize(latestPosition.latitude, latestPosition.longitude);
            return (
              <g className="animate-bounce">
                <circle cx={p.x} cy={p.y} r="2.5" fill="#ef4444" className="animate-pulse" />
                <text x={p.x} y={p.y + 6} fontSize="3" fill="#ef4444" textAnchor="middle" className="font-bold">🚌 {route.vehicleNumber}</text>
              </g>
            );
          })()}
        </svg>
        <div className="absolute top-4 left-4 p-2 bg-black/60 rounded text-[10px] uppercase font-black tracking-widest text-slate-400">
          Schematic Visualization (Free View)
        </div>
      </div>
    );
  }

  // Real Map Render (Premium Mode)
  return (
    <div className={`relative aspect-video rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full z-0" />
      {!isLeafletReady && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white animate-pulse font-black uppercase text-xs">Decrypting Satellite Feed...</div>
        </div>
      )}
      <div className="absolute top-4 left-4 p-2 bg-black/80 rounded border border-accent-primary/40 text-[10px] uppercase font-black tracking-widest text-accent-primary z-[1000]">
        🛰️ Premium Satellite Stream
      </div>
    </div>
  );
};
