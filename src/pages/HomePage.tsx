import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import 'leaflet/dist/leaflet.css';
import { config } from '../config';

// --- Autocomplete Input Component ---
const AutocompleteInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  tabIndex
}: {
  label: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder: string,
  icon: React.ElementType,
  tabIndex?: number
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch from Nominatim (OpenStreetMap) with a short debounce built-in
  const fetchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`);
      const data = await resp.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setShowDropdown(true);
    fetchPlaces(e.target.value);
  };

  const handleSelect = (place: any) => {
    const syntheticEvent = {
      target: { value: place.display_name }
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={inputRef}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-on-surface-variant" />
        <label className="text-sm font-bold text-on-surface tracking-wider uppercase">{label}</label>
      </div>
      <Input
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.length >= 3) fetchPlaces(value);
          setShowDropdown(true);
        }}
        placeholder={placeholder}
        className="bg-surface-container-high border-outline-variant text-on-surface h-12 rounded-xl focus-visible:ring-primary focus-visible:ring-2 focus-visible:border-transparent transition-all hover:bg-surface-container-highest"
        tabIndex={tabIndex}
      />

      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl overflow-hidden"
          >
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="px-4 py-3 hover:bg-surface-container-highest/50 cursor-pointer border-b border-outline-variant/30 last:border-0 transition-colors"
                onClick={() => handleSelect(suggestion)}
              >
                <div className="text-on-surface text-sm">{suggestion.display_name}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animated Loading Overlay Modal for HOS Crunching
const LoadingModal = () => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-surface-container p-8 rounded-3xl border border-outline-variant shadow-2xl flex flex-col items-center max-w-sm w-full mx-4"
        >
          {/* Animated Map Ping */}
          <div className="relative w-24 h-24 mb-6">
            <motion.div
              animate={{ scale: [1, 2, 2], opacity: [1, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 bg-primary/30 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1.5], opacity: [1, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-2 bg-primary/40 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary z-10 bg-surface-container-highest rounded-full border-2 border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-4xl animate-pulse">route</span>
            </div>
          </div>

          <h3 className="font-headline text-2xl font-bold mb-2 text-center text-on-surface">Computing Routes</h3>

          <div className="space-y-3 w-full mt-4">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-primary">sync</span>
              <span>Evaluating ORS alternative options...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-tertiary" style={{ animationDelay: '0.4s' }}>sync</span>
              <span>Running FMCSA 70-hour constraint limits...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-error" style={{ animationDelay: '0.8s' }}>sync</span>
              <span>Optimizing daily driver log schedules...</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [cycleHours, setCycleHours] = useState(45);

  const [currentPosition, setCurrentPosition] = useState("");
  const [pickupNode, setPickupNode] = useState("");
  const [destinationVector, setDestinationVector] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePlanTrip = async () => {
    if (!currentPosition || !pickupNode || !destinationVector) {
      setErrorMsg("Please fill out all location fields.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/trips/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_location: currentPosition,
          pickup_location: pickupNode,
          dropoff_location: destinationVector,
          current_cycle_used: cycleHours,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compute trip.');
      }

      navigate(`/trip/${data.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative pt-16 pb-32 min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {isLoading && <LoadingModal />}

      {/* Map Background */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-40 transition-opacity duration-300"
        style={{ zIndex: 0 }}
      >
        <style dangerouslySetInnerHTML={{__html:`
          .leaflet-container {
            width: 100%;
            height: 100%;
            background: ${isDark ? '#0e0e0e' : '#f8fafc'} !important;
          }
        `}}/>
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.carto.com/attributions">CARTO</a>'
            url={isDark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
          />
        </MapContainer>
      </div>

      {/* Subtle Vector Illustration Background */}
      <div className="absolute bottom-0 right-0 w-full h-full opacity-5 pointer-events-none flex justify-end items-end overflow-hidden">
        <svg className="w-3/4 h-3/4 translate-x-1/4 translate-y-1/4 text-primary-container" fill="none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 450L250 450L350 350L750 350" stroke="currentColor" strokeWidth="2"></path>
          <path d="M0 550L300 550L450 400L800 400" stroke="currentColor" strokeWidth="1"></path>
          <rect height="40" stroke="currentColor" strokeWidth="2" width="80" x="200" y="420"></rect>
          <circle cx="215" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
          <circle cx="265" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
        </svg>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center mb-12">
        <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
          Plan Your Trip <br />
          <span className="text-[#00FFA3]">Vanguard</span>
        </h1>
        <p className="text-on-surface-variant max-w-md mx-auto text-sm md:text-base tracking-wide uppercase font-medium">
          Optimizing kinetic logistics through precision engineering
        </p>
      </div>

      {/* Trip Form Card */}
      <div className="relative z-10 w-full max-w-2xl bg-surface-container/80 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-8 shadow-2xl">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <AutocompleteInput
            label="Current Position"
            icon={MapPin}
            placeholder="e.g. Toledo, OH"
            value={currentPosition}
            onChange={(e) => setCurrentPosition(e.target.value)}
            tabIndex={1}
          />

          <AutocompleteInput
            label="Pickup Location"
            icon={Truck}
            placeholder="e.g. Cleveland, OH"
            value={pickupNode}
            onChange={(e) => setPickupNode(e.target.value)}
            tabIndex={2}
          />

          <AutocompleteInput
            label="Destination Vector"
            icon={MapPin}
            placeholder="e.g. Pittsburgh, PA"
            value={destinationVector}
            onChange={(e) => setDestinationVector(e.target.value)}
            tabIndex={3}
          />

          {/* Cycle Hours Slider */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00FFA3]" />
                <label className="font-headline text-[10px] uppercase tracking-widest text-[#00FFA3]">Cycle Hours Used</label>
              </div>
              <span className="font-headline text-2xl font-bold text-on-surface">
                {cycleHours.toFixed(1)} <span className="text-xs font-normal text-on-surface-variant ml-1">HRS</span>
              </span>
            </div>
            <Slider
              value={[cycleHours]}
              onValueChange={(v: number[]) => setCycleHours(v[0])}
              max={70}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-on-surface-variant font-medium">
              <span>Fresh Cycle (0 hrs)</span>
              <span>Maxed Out (70 hrs)</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className={`w-full mt-2 h-14 text-lg font-bold rounded-xl transition-all ${
              isLoading
                ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed border-none'
                : 'bg-primary text-on-primary hover:bg-primary/90 hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)]'
            }`}
            onClick={handlePlanTrip}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">progress_activity</span>
                <span>Optimizing Route / Pinging Server...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Plan My Trip</span>
                <ChevronRight className="w-5 h-5 ml-1" />
              </div>
            )}
          </Button>

          {errorMsg && (
            <p className="mt-4 text-error text-center text-sm font-medium animate-in fade-in slide-in-from-bottom-2">{errorMsg}</p>
          )}
        </form>
      </div>

      {/* Dynamic Data Strip */}
      <div className="relative z-10 mt-16 w-full max-w-4xl flex flex-wrap justify-between gap-8 opacity-60">
        <div className="flex flex-col gap-1 border-l-2 border-[#00FFA3] pl-4">
          <span className="text-[10px] uppercase tracking-widest font-bold">Fleet Status</span>
          <span className="font-headline text-xl font-bold text-on-surface">98.4% ACTIVE</span>
        </div>
        <div className="flex flex-col gap-1 border-l-2 border-secondary-container pl-4">
          <span className="text-[10px] uppercase tracking-widest font-bold">Network Load</span>
          <span className="font-headline text-xl font-bold text-on-surface">OPTIMAL</span>
        </div>
        <div className="flex flex-col gap-1 border-l-2 border-outline-variant pl-4">
          <span className="text-[10px] uppercase tracking-widest font-bold">Latency</span>
          <span className="font-headline text-xl font-bold text-on-surface">12ms</span>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
