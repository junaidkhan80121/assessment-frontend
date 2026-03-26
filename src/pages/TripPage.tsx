import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGetTripQuery } from '@/api/tripsApi';

const MapUpdater: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [map, positions]);
  return null;
};

const TripPage: React.FC = () => {
  const { tripId } = useParams();
  const { theme } = useTheme();
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(1500);
  const { data: tripData, isLoading, error } = useGetTripQuery(tripId || '', {
    skip: !tripId,
    pollingInterval,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (tripData?.status === 'COMPUTED' || tripData?.status === 'FAILED') {
      setPollingInterval(0);
      return;
    }

    setPollingInterval(1500);
  }, [tripData?.status])

  const tileUrl = theme === 'light' 
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const routeColor = theme === 'light' ? '#16a34a' : '#00FFA3';

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    if (map) {
      // Small timeout allows CSS transition to start/finish before recalculating size
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isFullScreen, map]);

  if (isLoading) {
    return (
      <div className="flex-grow pt-16 pb-32 min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary-container drop-shadow-[0_0_15px_rgba(0,255,163,0.5)]">progress_activity</span>
          <p className="font-headline tracking-widest uppercase text-sm font-bold">Retrieving Trip Data...</p>
        </div>
      </div>
    );
  }

  const errorMsg =
    (error as { data?: { message?: string; error?: string } } | undefined)?.data?.message ||
    (error as { data?: { message?: string; error?: string } } | undefined)?.data?.error ||
    null

  if (errorMsg || !tripData) {
    return (
      <div className="flex-grow pt-16 pb-32 min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-surface-container-low p-8 rounded-2xl border border-error-container text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Trip Not Found</h2>
          <p className="text-on-surface-variant text-sm mb-6">{errorMsg || "Unable to locate the specified trip ID."}</p>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-surface-container-highest text-on-surface py-3 rounded-lg font-bold hover:bg-surface-bright transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // The API already provides [latitude, longitude] so no need to swap
  const routePositions: [number, number][] = (tripData.route_geometry || []) as [number, number][];
  const routeOptions = (tripData.route_options || []) as any[];
  
  const startPos: [number, number] = [tripData.current_location_lat || 41.5, tripData.current_location_lon || -80.0];
  const dropoffPos: [number, number] = [tripData.dropoff_location_lat || 40.7, tripData.dropoff_location_lon || -74.0];
  const pickupPos: [number, number] = [tripData.pickup_location_lat || startPos[0], tripData.pickup_location_lon || startPos[1]];

  const mapCenter = startPos;
  
  const totalLogsCount = tripData.daily_logs ? tripData.daily_logs.length : 0;
  const isCompliant = tripData.hos_compliant;

  return (
    <div className={`flex-grow pt-16 pb-32 kinetic-grid min-h-screen bg-background ${isFullScreen ? 'overflow-hidden' : ''}`}>
      <style dangerouslySetInnerHTML={{__html:`
        .kinetic-grid {
            background-image: linear-gradient(to right, rgba(58, 74, 63, 0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(58, 74, 63, 0.05) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .leaflet-container {
          width: 100%;
          height: 100%;
          background: ${theme === 'light' ? '#f8fafc' : '#0e0e0e'} !important;
        }
      `}}/>
      {/* Map & Stats Section */}
      <section className="relative">
        {/* Hero Map Container */}
        <div 
          className={`w-full relative overflow-hidden bg-surface-container-lowest transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-[100] h-[100dvh]' : 'h-[65vh] min-h-[400px]'}`}
          style={{ zIndex: isFullScreen ? 100 : 1 }}
        >
          <MapContainer 
            center={mapCenter} 
            zoom={5} 
            scrollWheelZoom={true}
            zoomControl={true}
            className="w-full h-full"
            ref={setMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={tileUrl}
            />
            {routePositions.length > 0 && <MapUpdater positions={routePositions} />}
            {/* Route Lines: fastest plus alternatives */}
            {routeOptions.length > 0 ? (
              <>
                {routeOptions.map((opt, idx) => {
                  const positions = (opt.route_geometry || []) as [number, number][];
                  if (!positions.length) return null;
                  const isFastest = !!opt.is_fastest;
                  return (
                    <Polyline
                      key={idx}
                      positions={positions}
                      pathOptions={{
                        color: isFastest ? routeColor : (theme === 'light' ? '#9CA3AF' : '#4B5563'),
                        weight: isFastest ? 5 : 3,
                        opacity: isFastest ? 0.95 : 0.6,
                        dashArray: isFastest ? undefined : '6, 8',
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                    />
                  );
                })}
              </>
            ) : (
              routePositions.length > 0 && (
                <Polyline 
                  positions={routePositions} 
                  pathOptions={{ 
                    color: routeColor, 
                    weight: 5, 
                    opacity: 0.9,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }} 
                />
              )
            )}
            
            {/* Origin Node (Current Location) */}
            <CircleMarker 
              center={startPos}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 1,
                weight: 2,
              }}
              radius={5}
            />

            {/* Pickup Node */}
            <CircleMarker 
              center={pickupPos}
              pathOptions={{
                color: '#22C55E',
                fillColor: '#22C55E',
                fillOpacity: 1,
                weight: 2,
                className: 'marker-pulse'
              }}
              radius={6}
            />
            
            {/* Destination Node */}
            <CircleMarker 
              center={dropoffPos}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 1,
                weight: 2,
                className: 'marker-pulse'
              }}
              radius={6}
            />
          </MapContainer>
          
          {/* Floating Route Info + Stats Overlay */}
          <div className="absolute top-6 left-6 z-[400] pointer-events-none flex flex-col gap-3">
            <div className="bg-surface-container-low/80 backdrop-blur-xl p-4 rounded-xl border border-outline-variant/20">
              <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">Trip #{tripId?.split('-')[0]}</h1>
              <p className="text-[10px] tracking-widest text-on-surface-variant font-medium mt-1 truncate max-w-[200px] md:max-w-xs uppercase">
                {tripData.current_location.split(',')[0]} → {tripData.dropoff_location.split(',')[0]}
              </p>
            </div>
            <div className="bg-surface-container-low/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-outline-variant/20">
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">Distance</span>
              <p className="font-headline text-xl font-bold text-on-surface">
                {(tripData.total_distance_miles || 0).toFixed(1)}<span className="text-xs ml-1 opacity-60">mi</span>
              </p>
            </div>
            <div className="bg-surface-container-low/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-outline-variant/20">
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">Drive Time</span>
              <p className="font-headline text-xl font-bold text-on-surface">
                {Math.floor(tripData.total_drive_hours || 0)}h {Math.round(((tripData.total_drive_hours || 0) % 1) * 60)}m
              </p>
            </div>
            <div className="bg-surface-container-low/80 backdrop-blur-xl px-4 py-3 rounded-xl border border-outline-variant/20">
              <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">HOS Status</span>
              <div className={`mt-1 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${isCompliant ? 'bg-primary-container text-on-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'bg-error-container text-on-error shadow-[0_0_15px_rgba(255,50,50,0.3)]'}`}>
                {isCompliant ? 'Compliant' : 'Violation'}
              </div>
            </div>
          </div>

          {/* Full-Screen Toggle Button */}
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="absolute top-6 right-6 z-[400] p-3 rounded-full bg-surface-container-highest border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors shadow-lg pointer-events-auto"
            aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <span className="material-symbols-outlined text-lg">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
          </button>
        </div>
      </section>

      {/* Electronic Logging Device (ELD) Section */}
      <section className="mt-8 px-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container">description</span>
            <h2 className="font-headline text-lg font-bold tracking-tight">Electronic Logging Device (ELD)</h2>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{totalLogsCount} days</span>
          </div>
        </div>

        {/* Tabs */}
        {tripData.daily_logs && tripData.daily_logs.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {tripData.daily_logs.map((log: any, index: number) => (
                <button 
                  key={index}
                  onClick={() => setActiveLogIndex(index)}
                  className={`${activeLogIndex === index ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'} px-6 py-2 rounded-full font-headline font-bold text-sm whitespace-nowrap transition-colors`}
                >
                  Day {index + 1}
                </button>
              ))}
            </div>

            {/* Stylized FMCSA Log */}
            <div className="bg-[#F5F5F5] rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-black/10 flex justify-between items-center bg-white">
                <div>
                  <p className="text-[10px] font-bold text-black/40 uppercase">Driver Signature Log</p>
                  <h3 className="text-black font-headline font-bold">Vanguard Fleet Ops</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-black/40 uppercase">Date</p>
                  <p className="text-black font-headline font-bold">{tripData.daily_logs[activeLogIndex]?.date || "N/A"}</p>
                </div>
              </div>

              {/* The Graph */}
              <div className="p-6 bg-white overflow-x-auto">
                <div className="min-w-[600px] h-48 relative border-l-2 border-b-2 border-black/80">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-24 grid-rows-4 opacity-10">
                    {/* Hours 1-24 and Statuses */}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-r border-t border-black/40"></div>
                    ))}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i + 24} className="border-r border-t border-black/40"></div>
                    ))}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i + 48} className="border-r border-t border-black/40"></div>
                    ))}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i + 72} className="border-r border-t border-black/40"></div>
                    ))}
                  </div>

                  {/* Labels */}
                  <div className="absolute -left-12 inset-y-0 flex flex-col justify-around text-[9px] font-bold text-black uppercase tracking-tighter">
                    <span>OFF</span>
                    <span>SB</span>
                    <span>D</span>
                    <span>ON</span>
                  </div>

                  {/* Log Path */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {(() => {
                      const logData = tripData.daily_logs[activeLogIndex] as any;
                      const events = logData?.events as any[] | undefined;
                      if (!logData || !events) return null;
                      
                      const width = 600; 
                      const hourWidth = width / 24;
                      const yMap: Record<string, number> = {
                        'OFF': 20,
                        'SB': 60,
                        'D': 100,
                        'ON': 140
                      };
                      
                      let points = "";
                      let circles: React.ReactNode[] = [];

                      events.forEach((event: any, idx: number) => {
                        const startX = event.start_hour * hourWidth;
                        const endX = event.end_hour * hourWidth;
                        const y = yMap[event.status];

                        // Vertical connecting line from previous event
                        if (idx > 0) {
                           const prevEvent = events[idx - 1];
                           const prevY = yMap[prevEvent.status];
                           points += ` ${startX},${prevY} ${startX},${y}`;
                        } else {
                           points += `${startX},${y}`;
                        }

                        // Horizontal line for duration
                        points += ` ${endX},${y}`;
                        
                        // Circle at start of event
                        circles.push(
                          <circle key={idx} cx={`${(startX / width) * 100}%`} cy={y} fill="#00FFA3" r="3"></circle>
                        );
                      });

                      return (
                        <>
                          <polyline fill="none" points={points} stroke="#003920" strokeWidth="2.5"></polyline>
                          {circles}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-4 bg-[#E0E0E0] border-t border-black/10">
                <div className="p-3 border-r border-black/10">
                  <span className="block text-[8px] font-bold text-black/50 uppercase">Total Off</span>
                  <span className="text-xs font-bold text-black">
                    {Math.floor(tripData.daily_logs[activeLogIndex]?.totals?.OFF_DUTY || 0)}h 
                    {Math.round(((tripData.daily_logs[activeLogIndex]?.totals?.OFF_DUTY || 0) % 1) * 60)}m
                  </span>
                </div>
                <div className="p-3 border-r border-black/10">
                  <span className="block text-[8px] font-bold text-black/50 uppercase">Total SB</span>
                  <span className="text-xs font-bold text-black">
                    {Math.floor(tripData.daily_logs[activeLogIndex]?.totals?.SLEEPER || 0)}h 
                    {Math.round(((tripData.daily_logs[activeLogIndex]?.totals?.SLEEPER || 0) % 1) * 60)}m
                  </span>
                </div>
                <div className="p-3 border-r border-black/10">
                  <span className="block text-[8px] font-bold text-black/50 uppercase">Total Drive</span>
                  <span className="text-xs font-bold text-black">
                    {Math.floor(tripData.daily_logs[activeLogIndex]?.totals?.DRIVING || 0)}h 
                    {Math.round(((tripData.daily_logs[activeLogIndex]?.totals?.DRIVING || 0) % 1) * 60)}m
                  </span>
                </div>
                <div className="p-3">
                  <span className="block text-[8px] font-bold text-black/50 uppercase">Total On</span>
                  <span className="text-xs font-bold text-black">
                    {Math.floor(tripData.daily_logs[activeLogIndex]?.totals?.ON_DUTY_NOT_DRIVING || 0)}h 
                    {Math.round(((tripData.daily_logs[activeLogIndex]?.totals?.ON_DUTY_NOT_DRIVING || 0) % 1) * 60)}m
                  </span>
                </div>
              </div>
            </div>
            
            {/* CTA Section */}
            <div className="mt-4">
              <button className="w-full bg-primary-container text-on-primary h-14 rounded-lg font-headline font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,255,163,0.25)]">
                <span className="material-symbols-outlined">download</span>
                Download PDF Report
              </button>
              <p className="text-center text-[10px] text-on-surface-variant uppercase tracking-widest mt-4">Standard FMCSA Format v2.4</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-high p-8 rounded-xl text-center border border-outline-variant/30">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">assignment_late</span>
            <p className="text-on-surface-variant font-medium">No log sheets available for this trip.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default TripPage;
