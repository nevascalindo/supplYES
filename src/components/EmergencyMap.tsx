/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, MapPin, Navigation, Info } from "lucide-react";

interface EmergencyRequest {
  id: string;
  companyName: string;
  categoryName: string;
  itemDescription: string;
  address: string;
  lat: number;
  lng: number;
  timestamp: string;
}

interface EmergencyMapProps {
  registeredArea: string;
  emergencyRequests: EmergencyRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string | null) => void;
}

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "joinville": { lat: -26.3045, lng: -48.8456 },
  "pinheiros": { lat: -23.5621, lng: -46.6853 },
  "centro": { lat: -23.5489, lng: -46.6388 },
  "moema": { lat: -23.5986, lng: -46.6616 },
  "vila mariana": { lat: -23.5824, lng: -46.6432 },
  "lapa": { lat: -23.5228, lng: -46.7029 },
  "itaim bibi": { lat: -23.5835, lng: -46.6865 },
  "itaim": { lat: -23.5835, lng: -46.6865 },
  "bras": { lat: -23.5358, lng: -46.6186 },
  "brás": { lat: -23.5358, lng: -46.6186 },
  "guarulhos": { lat: -23.4628, lng: -46.5333 },
  "zona sul": { lat: -23.6182, lng: -46.6713 },
  "zona leste": { lat: -23.5458, lng: -46.5386 },
  "zona oeste": { lat: -23.5385, lng: -46.7214 },
  "consolacao": { lat: -23.5532, lng: -46.6575 },
  "consolação": { lat: -23.5532, lng: -46.6575 }
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  registeredArea,
  emergencyRequests,
  selectedRequestId,
  onSelectRequest
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const rangeCircleRef = useRef<any>(null);
  const supplierMarkerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  
  // Dynamic supplier coordinates with offline/online state
  const [supplierCoords, setSupplierCoords] = useState<{ lat: number; lng: number }>({ lat: -23.5358, lng: -46.6186 });

  // Dynamically resolve coordinates when registeredArea changes
  useEffect(() => {
    if (!registeredArea) return;
    const textLower = registeredArea.toLowerCase().trim();
    
    // Check offline dictionary instantly
    let matched = false;
    for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
      if (textLower.includes(key)) {
        setSupplierCoords(coords);
        matched = true;
        break;
      }
    }

    // Call dynamic free map geolocation API to resolve any custom city (like Joinville or general street name)
    const controller = new AbortController();
    const query = `${registeredArea}, Brasil`;
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9"
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const first = data[0];
          const newCoords = {
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon)
          };
          setSupplierCoords(newCoords);
          
          // Re-center Leaflet dynamically if map instance is up and active
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 12);
          }
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn("Dynamic Nominatim geocoding lookup failed or limited, using fallback coords:", err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [registeredArea]);

  // Load Leaflet dynamically to avoid React 19 SSR / Bundling conflicts
  useEffect(() => {
    let active = true;

    const loadLeaflet = async () => {
      try {
        if ((window as any).L) {
          if (active) setLeafletLoaded(true);
          return;
        }

        // Dynamically inject stylesheet
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Dynamically inject script
        if (!document.getElementById("leaflet-js")) {
          const script = document.createElement("script");
          script.id = "leaflet-js";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => {
            if (active) setLeafletLoaded(true);
          };
          script.onerror = () => {
            if (active) setLoadError(true);
          };
          document.body.appendChild(script);
        } else {
          // Script tag exists, wait for L to be global
          const checkGlobal = setInterval(() => {
            if ((window as any).L) {
              clearInterval(checkGlobal);
              if (active) setLeafletLoaded(true);
            }
          }, 100);
        }
      } catch (err) {
        console.error("Error loading leaflet", err);
        if (active) setLoadError(true);
      }
    };

    loadLeaflet();

    return () => {
      active = false;
    };
  }, []);

  // Initialize and update Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // 1. Initialize Map instance
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [supplierCoords.lat, supplierCoords.lng],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      // OpenStreetMap Tiles (Beautiful grayscale theme for premium design feeling)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Center view if coordinates updated
    map.setView([supplierCoords.lat, supplierCoords.lng], 12);

    // 2. Add or Update Supplier (Registered Area) Marker and Radius Circle
    if (supplierMarkerRef.current) {
      map.removeLayer(supplierMarkerRef.current);
    }
    if (rangeCircleRef.current) {
      map.removeLayer(rangeCircleRef.current);
    }

    // Custom CSS style for Supplier Home Marker (EMERALD DOT - NO EMOJIS)
    const supplierIcon = L.divIcon({
      className: "custom-supplier-icon-wrapper",
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-950 border-2 border-white shadow-lg text-white select-none">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    supplierMarkerRef.current = L.marker([supplierCoords.lat, supplierCoords.lng], { icon: supplierIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-1 font-sans text-neutral-805">
          <p class="font-extrabold text-[12px] uppercase tracking-wide text-neutral-900 leading-tight">Seu Centro de Distribuição</p>
          <p class="text-[11px] text-neutral-500 font-medium mt-1"><b>Endereço:</b> ${registeredArea || "Área Cadastrada"}</p>
          <span class="inline-block mt-1.5 text-[9px] bg-neutral-100 text-neutral-900 font-bold px-2 py-0.5 rounded-full border">Área de Atendimento Base</span>
        </div>
      `);

    // Draw supplier delivery radius circle (soft blue translucent circle area)
    rangeCircleRef.current = L.circle([supplierCoords.lat, supplierCoords.lng], {
      radius: 4000, // 4km range
      color: "rgba(10, 10, 10, 0.4)",
      fillColor: "rgba(10, 10, 10, 0.08)",
      weight: 1.5,
      dashArray: "4, 4"
    }).addTo(map);

    // 3. Render Emergency Locations with Blinking Red Zones (NO EMOJIS - USES TEXT "SOS")
    // Clear old emergency markers
    Object.keys(markersRef.current).forEach((id) => {
      map.removeLayer(markersRef.current[id].marker);
      map.removeLayer(markersRef.current[id].pulseCircle);
    });
    markersRef.current = {};

    emergencyRequests.forEach((req) => {
      // Create blinking red zone marker
      const blinkIcon = L.divIcon({
        className: `emergency-blink-icon-${req.id}`,
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <span class="absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-60 animate-[ping_1.6s_infinite] pointer-events-none"></span>
            <span class="absolute inline-flex h-7 w-7 rounded-full bg-red-400 opacity-40 animate-[ping_2.5s_infinite] pointer-events-none"></span>
            <div class="relative w-6 h-6 rounded-full bg-red-650 border border-white text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-115 transition-transform">
              <span class="text-[8px] font-black tracking-tight">SOS</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const elementMarker = L.marker([req.lat, req.lng], { icon: blinkIcon })
        .addTo(map)
        .on("click", () => {
          onSelectRequest(req.id);
        });

      // Blinking red background circle for the territory
      const trackingCircle = L.circle([req.lat, req.lng], {
        radius: 1200, // Red blinking footprint
        color: "rgba(239, 68, 68, 0.45)",
        fillColor: "rgba(239, 68, 68, 0.15)",
        weight: 1.5
      }).addTo(map);

      // Simple HTML Popup
      elementMarker.bindPopup(`
        <div class="p-1 font-sans text-neutral-800 max-w-[200px]">
          <p class="font-extrabold text-[12px] text-red-650 leading-tight flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
            SOS: ${req.companyName}
          </p>
          <div class="mt-2 text-[11px] leading-relaxed space-y-1">
            <p><b>Necessidade:</b> <span class="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">${req.categoryName}</span></p>
            <p class="font-medium text-neutral-500">"${req.itemDescription}"</p>
            <p class="text-xs font-semibold text-neutral-400 mt-1">${req.timestamp}</p>
          </div>
        </div>
      `);

      markersRef.current[req.id] = {
        marker: elementMarker,
        pulseCircle: trackingCircle
      };
    });

  }, [leafletLoaded, emergencyRequests, supplierCoords, registeredArea]);

  // Handle selectedRequestId centering
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !selectedRequestId) return;
    const map = mapInstanceRef.current;
    const targetData = emergencyRequests.find(r => r.id === selectedRequestId);
    if (targetData) {
      map.setView([targetData.lat, targetData.lng], 14, {
        animate: true,
        duration: 1.2
      });

      // Open popup automatically
      const markerObj = markersRef.current[selectedRequestId];
      if (markerObj && markerObj.marker) {
        markerObj.marker.openPopup();
      }
    }
  }, [selectedRequestId, leafletLoaded, emergencyRequests]);

  const handleRecenter = () => {
    if (!leafletLoaded || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([supplierCoords.lat, supplierCoords.lng], 12, { animate: true });
    onSelectRequest(null);
  };

  if (loadError) {
    return (
      <div className="w-full h-80 rounded-3xl bg-neutral-50 border border-neutral-150 flex flex-col items-center justify-center p-6 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <h4 className="font-bold text-sm text-neutral-850">Falha ao Carregar o Mapa</h4>
        <p className="text-xs text-neutral-400 max-w-sm font-medium">Não foi possível carregar a API pública de mapas do OpenStreetMap. Verifique sua conexão de rede ou tente recarregar.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-neutral-200/60 shadow-inner flex flex-col justify-end">
      
      {/* Dynamic script loading loader */}
      {!leafletLoaded && (
        <div className="absolute inset-0 z-30 bg-neutral-900/10 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-neutral-800 border-t-neutral-100 rounded-full animate-spin" />
          <span className="text-xs font-bold text-brand-charcoal animate-pulse">Carregando Mapa Interativo de Emergências...</span>
        </div>
      )}

      {/* Map Container Target div */}
      <div ref={mapContainerRef} className="w-full h-full z-10" id="osm-emergency-map" />

      {/* Map floating hud labels */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none p-3.5 bg-white/92 backdrop-blur-md rounded-2xl border border-neutral-200/50 shadow-md max-w-[240px] text-[11px] font-medium space-y-2 flex flex-col items-start text-neutral-800 leading-snug">
        <p className="font-extrabold uppercase tracking-wide text-neutral-950 text-[10px]">
          Legenda do Território
        </p>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-neutral-950 border border-white flex items-center justify-center shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <span>Seu CD / Sua Sede</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span>Região com SOS Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-3 rounded bg-neutral-500/10 border border-dashed border-neutral-800/40"></span>
          <span>Raio de Atendimento (4km)</span>
        </div>
      </div>

      {/* Map Floating Control bar */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button
          onClick={handleRecenter}
          className="p-3 bg-neutral-900 text-white hover:bg-neutral-850 active:scale-95 transition-all text-xs font-bold rounded-xl shadow-lg border-none flex items-center gap-1.5 cursor-pointer max-w-fit"
          title="Focar no Meu CD"
        >
          <Navigation className="w-3.5 h-3.5 fill-white rotate-45" />
          <span className="hidden sm:inline text-[10px] uppercase font-bold tracking-tight">Focar no Meu CD</span>
        </button>
      </div>

    </div>
  );
};
