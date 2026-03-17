import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';

export const GlobalBackground = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Mouse motion values for the cursor
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springCursorX = useSpring(cursorX, { stiffness: 1000, damping: 28, mass: 0.5 });
  const springCursorY = useSpring(cursorY, { stiffness: 1000, damping: 28, mass: 0.5 });

  const springRingX = useSpring(cursorX, { stiffness: 150, damping: 30, mass: 1 });
  const springRingY = useSpring(cursorY, { stiffness: 150, damping: 30, mass: 1 });

  // Mouse motion for the parallax map
  const mapOffsetX = useTransform(springRingX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [20, -20]);
  const mapOffsetY = useTransform(springRingY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [20, -20]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    
    // Add to window since it needs to track globally now
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [cursorX, cursorY]);

  // Use Voyager for light mode (more detailed places/roads) and dark_all for dark mode
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:`
        body, html { cursor: none !important; }
        a, button, input { cursor: none !important; }
      `}}/>
      {/* Custom cursor — sleek dot with morphing trail */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          x: springCursorX,
          y: springCursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="w-3 h-3 rounded-full bg-[#00FFA3] shadow-[0_0_12px_4px_rgba(0,255,163,0.7)]" />
      </motion.div>

      {/* Trailing blob that lags behind */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          x: springRingX,
          y: springRingY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            borderRadius: ['50%', '40% 60% 60% 40%', '60% 40% 40% 60%', '50%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 border border-[#00FFA3]/40 bg-[#00FFA3]/[0.06]"
        />
      </motion.div>

      {/* Strong radial glow spotlight */}
      <motion.div
        className="fixed top-0 left-0 z-[9997] pointer-events-none"
        style={{
          x: springRingX,
          y: springRingY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="w-64 h-64 rounded-full bg-[#00FFA3]/[0.08] blur-3xl" />
      </motion.div>

      {/* Global Parallax Map Background */}
      <motion.div
        className="fixed inset-[-50px] opacity-[0.35] dark:opacity-40 transition-opacity duration-300 pointer-events-none z-0"
        style={{ 
          x: mapOffsetX,
          y: mapOffsetY
        }}
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
          zoom={5}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.carto.com/attributions">CARTO</a>'
            url={tileUrl}
          />
        </MapContainer>
      </motion.div>

      {/* Subtle Vector Illustration Background */}
      <div className="fixed bottom-0 right-0 w-full h-full opacity-5 pointer-events-none flex justify-end items-end overflow-hidden z-0">
        <svg className="w-3/4 h-3/4 translate-x-1/4 translate-y-1/4 text-primary-container" fill="none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 450L250 450L350 350L750 350" stroke="currentColor" strokeWidth="2"></path>
          <path d="M0 550L300 550L450 400L800 400" stroke="currentColor" strokeWidth="1"></path>
          <rect height="40" stroke="currentColor" strokeWidth="2" width="80" x="200" y="420"></rect>
          <circle cx="215" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
          <circle cx="265" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
        </svg>
      </div>
    </>
  );
};
