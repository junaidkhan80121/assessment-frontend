import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapPin, Navigation, Clock, ChevronRight, Truck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Slider, Button, TextField, Autocomplete, InputAdornment } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { config } from '../config';


const LocationInput = ({ label, icon: Icon, placeholder, value, onChange, options = [], onSearch, onSelect, loading, tabIndex }: any) => {
  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options}
      getOptionLabel={(option: any) => typeof option === 'string' ? option : option.display_name || ''}
      filterOptions={(x) => x}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={value}
      onInputChange={onSearch}
      onChange={(_, newValue) => {
        if (typeof newValue !== 'string' && newValue.display_name) {
          onSelect(newValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          inputProps={{
            ...params.inputProps,
            tabIndex,
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Icon className="w-5 h-5 text-[#00FFA3]" />
              </InputAdornment>
            ),
            endAdornment: (
              <React.Fragment>
                {loading ? <span className="material-symbols-outlined animate-spin text-on-surface-variant w-5 h-5">sync</span> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: 'var(--outline-variant)',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: 'var(--primary)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--primary)',
                borderWidth: '2px',
                boxShadow: '0 0 15px rgba(0,255,163,0.1)',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'var(--on-surface-variant)',
              '&.Mui-focused': {
                color: 'var(--primary)',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--on-surface-variant)',
              opacity: 0.5,
            },
          }}
        />
      )}
      renderOption={(props, option: any) => (
        <li {...props} className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-[#00FFA3]/10 cursor-pointer border-b border-border/30 last:border-0 transition-colors">
          <MapPin className="w-4 h-4 text-[#00FFA3] shrink-0" />
          <span className="truncate">{option.display_name}</span>
        </li>
      )}
      PaperComponent={({ children }) => (
        <div className="mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          {children}
        </div>
      )}
    />
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
  const [errorMsg, setErrorMsg] = useState("");
  
  // State for Autocomplete suggestions
  const [currentPositionOptions, setCurrentPositionOptions] = useState<any[]>([]);
  const [pickupNodeOptions, setPickupNodeOptions] = useState<any[]>([]);
  const [destinationVectorOptions, setDestinationVectorOptions] = useState<any[]>([]);
  const [isSearchingCurrent, setIsSearchingCurrent] = useState(false);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);

  const fetchPlaces = async (query: string, setOptions: (opts: any[]) => void, setLoading: (loading: boolean) => void) => {
    if (query.length < 3) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=5`);
      const data = await resp.json();
      setOptions(data || []);
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanTrip = async () => {
    if (!currentPosition || !pickupNode || !destinationVector) {
      setErrorMsg("Please fill out all location fields.");
      return;
    }
    setErrorMsg("");
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
          <LocationInput
            label="Current Position"
            icon={Navigation}
            placeholder="e.g. Chicago, IL"
            value={currentPosition}
            onChange={(e: any) => setCurrentPosition(e?.target?.value || '')}
            onSearch={(e: any, newValue: string) => fetchPlaces(newValue, setCurrentPositionOptions, setIsSearchingCurrent)}
            onSelect={(item: any) => setCurrentPosition(item.display_name)}
            options={currentPositionOptions}
            loading={isSearchingCurrent}
            tabIndex={1}
          />

          <LocationInput
            label="Pickup Node"
            icon={Truck}
            placeholder="e.g. Detroit, MI"
            value={pickupNode}
            onChange={(e: any) => setPickupNode(e?.target?.value || '')}
            onSearch={(e: any, newValue: string) => fetchPlaces(newValue, setPickupNodeOptions, setIsSearchingPickup)}
            onSelect={(item: any) => setPickupNode(item.display_name)}
            options={pickupNodeOptions}
            loading={isSearchingPickup}
            tabIndex={2}
          />

          <LocationInput
            label="Destination Vector"
            icon={MapPin}
            placeholder="e.g. Pittsburgh, PA"
            value={destinationVector}
            onChange={(e: any) => setDestinationVector(e?.target?.value || '')}
            onSearch={(e: any, newValue: string) => fetchPlaces(newValue, setDestinationVectorOptions, setIsSearchingDestination)}
            onSelect={(item: any) => setDestinationVector(item.display_name)}
            options={destinationVectorOptions}
            loading={isSearchingDestination}
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
              value={cycleHours}
              onChange={(_, v) => setCycleHours(v as number)}
              max={70}
              step={0.5}
              sx={{
                color: '#00FFA3',
                height: 6,
                padding: '16px 0',
                '& .MuiSlider-track': {
                  border: 'none',
                },
                '& .MuiSlider-thumb': {
                  height: 20,
                  width: 20,
                  backgroundColor: '#00FFA3',
                  border: '2px solid #00FFA3',
                  boxShadow: '0 0 10px rgba(0,255,163,0.4)',
                  '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                    boxShadow: 'inherit',
                  },
                  '&::before': {
                    display: 'none',
                  },
                },
                '& .MuiSlider-rail': {
                  opacity: 0.2,
                  backgroundColor: '#00FFA3',
                },
              }}
            />
            <div className="flex justify-between text-xs text-on-surface-variant font-medium">
              <span>Fresh Cycle (0 hrs)</span>
              <span>Maxed Out (70 hrs)</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="contained"
            fullWidth
            disabled={isLoading}
            onClick={handlePlanTrip}
            sx={{
              mt: 2,
              height: '56px',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              borderRadius: '12px',
              textTransform: 'none',
              backgroundColor: isLoading ? 'var(--surface-container-highest)' : 'var(--primary)',
              color: isLoading ? 'var(--on-surface-variant)' : 'var(--on-primary)',
              boxShadow: isLoading ? 'none' : '0 0 20px rgba(0,255,163,0.3)',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'var(--primary)',
                opacity: 0.9,
                transform: 'scale(1.02)',
                boxShadow: '0 0 30px rgba(0,255,163,0.5)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'var(--surface-container-highest)',
                color: 'var(--on-surface-variant)',
              }
            }}
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
