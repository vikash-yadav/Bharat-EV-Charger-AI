import React, { useState, useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { Loader2, Compass, AlertTriangle, Key, MapPin, Navigation } from "lucide-react";
import { ChargerStation } from "../types";

const API_KEY = (() => {
  const rawKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  return rawKey.trim().replace(/^["']|["']$/g, "");
})();

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.length > 5;

const ROUTE_PRESETS_COORDS: Record<string, { origin: { lat: number; lng: number }; destination: { lat: number; lng: number } }> = {
  "mumbai-pune": {
    origin: { lat: 18.9220, lng: 72.8347 }, // Gateway of India
    destination: { lat: 18.5362, lng: 73.8940 }, // Koregaon Park
  },
  "delhi-agra": {
    origin: { lat: 28.5562, lng: 77.1000 }, // Indira Gandhi T3
    destination: { lat: 27.1730, lng: 78.0421 }, // Taj Mahal
  },
  "blr-chennai": {
    origin: { lat: 12.9740, lng: 77.6101 }, // MG Road
    destination: { lat: 13.0475, lng: 80.2824 }, // Marina Beach
  }
};

interface GoogleMapsViewProps {
  filteredStations: ChargerStation[];
  selectedStation: ChargerStation;
  onSelectStation: (station: ChargerStation) => void;
  selectedRoutePreset: string;
  userLiveLocation: { lat: number; lng: number } | null;
}

// Sub-component to compute and draw the directions route using classic DirectionsService
function RouteDirections({ selectedRoutePreset }: { selectedRoutePreset: string }) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);

  useEffect(() => {
    if (!routesLib || !map) return;

    const renderer = new routesLib.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // Maintain our custom styled charger markers
      polylineOptions: {
        strokeColor: "#0284c7", // Sky/ocean cyan premium route path color
        strokeOpacity: 0.85,
        strokeWeight: 6,
      }
    });

    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLib, map]);

  useEffect(() => {
    if (!directionsRenderer || !routesLib || !selectedRoutePreset) return;

    const coords = ROUTE_PRESETS_COORDS[selectedRoutePreset];
    if (!coords) return;

    const directionsService = new routesLib.DirectionsService();

    directionsService.route(
      {
        origin: coords.origin,
        destination: coords.destination,
        travelMode: routesLib.TravelMode.DRIVING || "DRIVING",
      },
      (result: any, status: any) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
        } else {
          console.error("Classic Directions Service failed:", status);
        }
      }
    );
  }, [directionsRenderer, routesLib, selectedRoutePreset]);

  return null;
}

// Helper sub-component to let map automatically pan to specific target coordinates dynamic events
function MapRecenterController({ targetCenter }: { targetCenter: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && targetCenter) {
      map.panTo({ lat: targetCenter.lat, lng: targetCenter.lng });
    }
  }, [map, targetCenter]);
  return null;
}

// Marker with InfoWindow to prevent stale closures and properly manage popup anchors
function ChargerMarker({ 
  station, 
  isSelected, 
  onSelect 
}: { 
  key?: string;
  station: ChargerStation; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // Pin color coding based on operators
  const getPinProps = () => {
    switch (station.operator) {
      case "Tata Power":
        return { background: "#059669", borderColor: "#fff", glyphColor: "#fff" }; // Emerald
      case "Statiq":
        return { background: "#ea580c", borderColor: "#fff", glyphColor: "#fff" }; // Orange
      case "ChargeZone":
        return { background: "#7c3aed", borderColor: "#fff", glyphColor: "#fff" }; // Violet
      case "Jio-bp":
        return { background: "#0284c7", borderColor: "#fff", glyphColor: "#fff" }; // Sky
      default:
        return { background: "#2563eb", borderColor: "#fff", glyphColor: "#fff" }; // Blue
    }
  };

  useEffect(() => {
    if (isSelected) {
      setShowInfoWindow(true);
    } else {
      setShowInfoWindow(false);
    }
  }, [isSelected]);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: station.latitude, lng: station.longitude }}
        onClick={() => {
          onSelect();
          setShowInfoWindow(true);
        }}
        title={station.name}
      >
        <Pin {...getPinProps()} scale={isSelected ? 1.25 : 1.0} />
      </AdvancedMarker>

      {showInfoWindow && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setShowInfoWindow(false)}
        >
          <div className="p-1 px-2 font-sans max-w-[190px]">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wide font-extrabold">{station.operator}</p>
            <h5 className="font-extrabold text-[12px] text-slate-900 leading-tight mt-0.5">{station.name}</h5>
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-600">
              <span className="font-semibold">{station.powerOutputKw}kW | {station.chargerType.replace(" Fast", "")}</span>
              <strong className="text-emerald-700 font-extrabold">₹{station.pricingInrPerKwh}/u</strong>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function GoogleMapsView({
  filteredStations,
  selectedStation,
  onSelectStation,
  selectedRoutePreset,
  userLiveLocation
}: GoogleMapsViewProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [recenterTarget, setRecenterTarget] = useState<{ lat: number; lng: number; _ts: number } | null>(null);

  // Set the map's recenter target on initial location capture
  useEffect(() => {
    if (userLiveLocation && !recenterTarget) {
      setRecenterTarget({ ...userLiveLocation, _ts: Date.now() });
    }
  }, [userLiveLocation, recenterTarget]);
  
  if (!hasValidKey) {
    return (
      <div 
        className="bg-slate-950 border border-slate-800 text-slate-200 h-80 w-full flex flex-col items-center justify-center p-6 text-center select-none" 
        id="maps-unauthorized-overlay"
      >
        <div className="max-w-md space-y-4">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400">
            <Key className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">Google Maps Platform API Key Required</h3>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
              Connect real-world Google Maps navigation routing & Live Directions telemetry natively.
            </p>
          </div>
          
          <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-left space-y-2 text-[9px] text-slate-300 font-medium leading-relaxed">
            <p>
              <strong className="text-amber-400">Step 1:</strong> Get an API key from {" "}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300 font-bold"
              >
                Google Cloud Console
              </a>
            </p>
            <p>
              <strong className="text-amber-400">Step 2:</strong> Paste your API key in the AI Studio environment variable prompt or configure it manually:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Add <code className="text-rose-400 font-mono font-bold bg-slate-950 px-1 py-0.5 rounded">GOOGLE_MAPS_PLATFORM_KEY</code> and save your API key.</li>
            </ul>
          </div>
          <p className="text-[9px] text-slate-500 font-semibold italic">The applet compiles and updates automatically once the secret is saved.</p>
        </div>
      </div>
    );
  }

  // Find center. Default to first filtered station, or Central India coordinates
  const defaultCenter = filteredStations.length > 0
    ? { lat: filteredStations[0].latitude, lng: filteredStations[0].longitude }
    : { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="relative h-80 w-full overflow-hidden" id="google-maps-live-root">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={filteredStations.length > 4 ? 5 : 12}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: "100%", height: "100%" }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {/* Pan to requested coordinate changes dynamically */}
          {recenterTarget && (
            <MapRecenterController targetCenter={recenterTarget} />
          )}

          {/* Render user's real live position (Pulse Blue Pin) */}
          {userLiveLocation && (
            <AdvancedMarker
              position={userLiveLocation}
              title="My Current Location (GPS)"
            >
              <div className="relative flex items-center justify-center" id="user-location-pulsar">
                <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-blue-500/50"></span>
                <span className="relative rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                </span>
              </div>
            </AdvancedMarker>
          )}

          {/* Render markers for all visible stations */}
          {filteredStations.map((station) => (
            <ChargerMarker
              key={station.id}
              station={station}
              isSelected={selectedStation.id === station.id}
              onSelect={() => onSelectStation(station)}
            />
          ))}

          {/* Render Directions API path matching selected route preset */}
          {selectedRoutePreset && (
            <RouteDirections selectedRoutePreset={selectedRoutePreset} />
          )}
        </Map>
      </APIProvider>

      {/* Mini HUD map overlay */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-slate-200/80 p-2 rounded-lg pointer-events-none shadow-md z-[10]" id="live-map-hud">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">Live Google Maps Live Routing ACTIVE</p>
        </div>
      </div>

      {/* Center My Location Action Button Overlay */}
      {userLiveLocation && (
        <button
          type="button"
          onClick={() => {
            setRecenterTarget({ lat: userLiveLocation.lat, lng: userLiveLocation.lng, _ts: Date.now() });
          }}
          className="absolute bottom-3 left-3 bg-white/95 hover:bg-slate-100 text-blue-700 hover:text-blue-800 border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-lg z-[10] flex items-center gap-1.5 transition-all duration-150 cursor-pointer text-[10px] font-extrabold"
          id="recenter-current-gps-hud"
        >
          <Compass className="w-4 h-4 text-blue-600 font-extrabold animate-spin" style={{ animationDuration: "12s" }} />
          <span>Locate Me (My GPS)</span>
        </button>
      )}

      {/* Actionable Map Error Troubleshooting overlay */}
      <div className="absolute top-3 right-3 z-[10]" id="maps-troubleshooting-anchor">
        <button
          type="button"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-2.5 py-1.5 rounded-md text-[9px] shadow-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer border border-amber-500"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Map Loading Error? Click Here</span>
        </button>
      </div>

      {/* Pop-up Guide specifically dealing with ApiNotActivatedMapError */}
      {showDiagnostics && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-[20] p-5 flex flex-col justify-between overflow-y-auto" id="maps-troubleshooting-dialog">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-white">How to Fix "ApiNotActivatedMapError"</h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowDiagnostics(false)}
                className="text-slate-400 hover:text-white font-extrabold text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
              The Google Maps Platform API key is successfully read by the application, but you must activate the developer modules on your Google Cloud Console for it to load.
            </p>

            <div className="space-y-2 text-[10px]">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <p className="text-white font-bold text-[9.5px]">🔌 Step 1: Enable Maps JavaScript API</p>
                <p className="text-slate-400 text-[9px] leading-relaxed">
                  Go to the following link to enable rendering maps inside the web interface:
                </p>
                <a 
                  href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 font-extrabold underline break-all text-[9px] block hover:text-cyan-300 mt-0.5"
                >
                  Enable Maps JavaScript API →
                </a>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                <p className="text-white font-bold text-[9.5px]">🛰️ Step 2: Enable Directions API</p>
                <p className="text-slate-400 text-[9px] leading-relaxed">
                  Go to the following link to enable routing/traffic calculations between charging stations:
                </p>
                <a 
                  href="https://console.cloud.google.com/apis/library/directions-backend.googleapis.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-cyan-400 font-extrabold underline break-all text-[9px] block hover:text-cyan-300 mt-0.5"
                >
                  Enable Directions API →
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[9px] text-slate-400 font-semibold mt-4">
            <span>⏱️ Takes less than 1 min to activate</span>
            <button
              type="button"
              onClick={() => setShowDiagnostics(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded transition-colors"
            >
              I Enabled It • Dismiss Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
