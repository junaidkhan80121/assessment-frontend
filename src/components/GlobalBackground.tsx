import { useEffect, useMemo, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTheme } from 'next-themes'
import gsap from 'gsap'
import 'leaflet/dist/leaflet.css'

interface GlobalBackgroundProps {
  variant?: 'interactive' | 'static'
}

type SignalNode = {
  x: number
  y: number
  size: number
}

type SignalRoute = {
  id: string
  d: string
  duration: number
  begin: number
  dash: string
}

const BACKGROUND_NODES: SignalNode[] = [
  { x: 120, y: 130, size: 3.8 },
  { x: 286, y: 246, size: 3.2 },
  { x: 454, y: 178, size: 4.2 },
  { x: 628, y: 316, size: 3.4 },
  { x: 832, y: 214, size: 4.6 },
  { x: 992, y: 360, size: 3.1 },
  { x: 760, y: 564, size: 4.1 },
  { x: 504, y: 622, size: 3.3 },
  { x: 268, y: 548, size: 3.6 },
  { x: 1012, y: 132, size: 3.5 },
]

const SIGNAL_ROUTES: SignalRoute[] = [
  {
    id: 'signal-route-a',
    d: 'M118 132C180 108 226 182 284 246C338 304 392 238 452 180',
    duration: 8.2,
    begin: 0.4,
    dash: '12 120',
  },
  {
    id: 'signal-route-b',
    d: 'M454 182C536 132 592 228 628 316C664 406 744 258 832 214',
    duration: 6.6,
    begin: 1.8,
    dash: '16 132',
  },
  {
    id: 'signal-route-c',
    d: 'M832 214C900 186 936 300 992 360C1040 416 1062 246 1012 134',
    duration: 7.4,
    begin: 0.9,
    dash: '10 110',
  },
  {
    id: 'signal-route-d',
    d: 'M286 246C236 316 224 430 268 548C326 632 418 656 504 622',
    duration: 7.1,
    begin: 2.6,
    dash: '14 124',
  },
  {
    id: 'signal-route-e',
    d: 'M504 622C586 662 690 634 760 566C828 500 906 426 992 360',
    duration: 8.8,
    begin: 1.2,
    dash: '12 128',
  },
  {
    id: 'signal-route-f',
    d: 'M454 182C520 246 594 256 630 318C688 388 704 492 760 566',
    duration: 5.9,
    begin: 3.1,
    dash: '9 96',
  },
]

export const GlobalBackground = ({ variant = 'interactive' }: GlobalBackgroundProps) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isInteractive = variant === 'interactive'
  const signalLayerRef = useRef<SVGSVGElement>(null)
  const dotGlowRef = useRef<HTMLDivElement>(null)
  const nodeGroupRef = useRef<SVGGElement>(null)
  const routeGroupRef = useRef<SVGGElement>(null)

  const signalBursts = useMemo(
    () =>
      SIGNAL_ROUTES.map((route, index) => ({
        ...route,
        duration: 4 + Math.random() * 5, // Random 4s to 9s duration
        begin: Math.random() * 3,        // Random 0s to 3s delay
        dash: `${Math.floor(8 + Math.random() * 8)} ${Math.floor(100 + Math.random() * 50)}`, // Random dash pattern
        accentWidth: index % 2 === 0 ? 2.4 : 2,
      })),
    [],
  )

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springCursorX = useSpring(cursorX, { stiffness: 1000, damping: 28, mass: 0.5 })
  const springCursorY = useSpring(cursorY, { stiffness: 1000, damping: 28, mass: 0.5 })

  const springRingX = useSpring(cursorX, { stiffness: 150, damping: 30, mass: 1 })
  const springRingY = useSpring(cursorY, { stiffness: 150, damping: 30, mass: 1 })

  const mapOffsetX = useTransform(springRingX, [0, typeof window !== 'undefined' ? window.innerWidth : 1000], [20, -20])
  const mapOffsetY = useTransform(springRingY, [0, typeof window !== 'undefined' ? window.innerHeight : 1000], [20, -20])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [cursorX, cursorY])

  useEffect(() => {
    if (!isInteractive || !signalLayerRef.current) {
      return
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        if (signalLayerRef.current) {
          gsap.to(signalLayerRef.current, {
            x: -18,
            y: -12,
            duration: 18,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

        gsap.to(nodeGroupRef.current?.querySelectorAll('[data-signal-node]') ?? [], {
          opacity: () => gsap.utils.random(0.24, 0.75),
          scale: () => gsap.utils.random(0.9, 1.45),
          duration: () => gsap.utils.random(1.8, 4.6),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: {
            each: 0.12,
            from: 'random',
          },
          transformOrigin: 'center center',
        })

        gsap.to(routeGroupRef.current?.querySelectorAll('[data-signal-path]') ?? [], {
          opacity: () => gsap.utils.random(0.08, 0.22),
          duration: () => gsap.utils.random(2.8, 5.4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.35,
        })

        if (dotGlowRef.current) {
          gsap.to(dotGlowRef.current, {
            opacity: 0.72,
            scale: 1.08,
            duration: 4.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }

      }, signalLayerRef)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [isInteractive])

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes signalTrail {
          from { stroke-dashoffset: 0; opacity: 0.18; }
          20% { opacity: 0.95; }
          80% { opacity: 0.8; }
          to { stroke-dashoffset: -260; opacity: 0.08; }
        }
        @keyframes signalNodePulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.45); opacity: 0.46; }
        }
        ${isInteractive ? `
          body, html { cursor: none !important; }
          a, button, input { cursor: none !important; }
        ` : ''}
      ` }} />

      <>
        <motion.div
          className="fixed top-0 left-0 z-[2147483647] pointer-events-none"
          style={{
            x: springCursorX,
            y: springCursorY,
            translateX: '-50%',
            translateY: '-50%',
          }}
        >
          <div className="w-3 h-3 rounded-full bg-[#00FFA3] shadow-[0_0_12px_4px_rgba(0,255,163,0.7)]" />
        </motion.div>

        <motion.div
          className="fixed top-0 left-0 z-[2147483646] pointer-events-none"
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
      </>

      {isInteractive ? (
        <>
          <motion.div
            className="fixed top-0 left-0 z-[2147483645] pointer-events-none"
            style={{
              x: springRingX,
              y: springRingY,
              translateX: '-50%',
              translateY: '-50%',
            }}
          >
            <div className="w-64 h-64 rounded-full bg-[#00FFA3]/[0.08] blur-3xl" />
          </motion.div>
        </>
      ) : null}

      <motion.div
        className={`fixed inset-[-50px] pointer-events-none z-0 transition-opacity duration-300 ${
          isInteractive ? 'opacity-[0.42] dark:opacity-[0.46]' : 'opacity-[0.28] dark:opacity-[0.34]'
        }`}
        style={{
          x: isInteractive ? mapOffsetX : 0,
          y: isInteractive ? mapOffsetY : 0
        }}
      >
          <style dangerouslySetInnerHTML={{__html:`
          .leaflet-container {
            width: 100%;
            height: 100%;
            background: ${isDark ? '#0e0e0e' : '#f8fafc'} !important;
          }
        `}}/>
        <div className="relative h-full w-full">
          <MapContainer
            center={[39.8283, -98.5795]}
            zoom={5}
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            touchZoom={false}
            doubleClickZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.carto.com/attributions">CARTO</a>'
              url={tileUrl}
            />
          </MapContainer>

          {isInteractive ? (
            <div className="absolute inset-0 z-[500] overflow-hidden pointer-events-none">
              <div className="absolute inset-0" style={{
                background: isDark
                  ? 'radial-gradient(circle at 18% 22%,rgba(0,255,163,0.12),transparent 18%),radial-gradient(circle at 74% 34%,rgba(0,255,163,0.08),transparent 20%),linear-gradient(180deg,rgba(1,8,6,0.04),rgba(1,8,6,0.18))'
                  : 'radial-gradient(circle at 18% 22%,rgba(0,80,40,0.08),transparent 18%),radial-gradient(circle at 74% 34%,rgba(0,80,40,0.06),transparent 20%),linear-gradient(180deg,rgba(240,248,244,0.0),rgba(200,230,210,0.12))'
              }} />
              <div
                ref={dotGlowRef}
                className="absolute left-[12%] top-[16%] h-40 w-40 rounded-full blur-3xl"
                style={{ background: isDark ? 'rgba(0,255,163,0.16)' : 'rgba(0,100,50,0.14)' }}
              />
              <svg
                ref={signalLayerRef}
                className="absolute inset-[-10%] h-[120%] w-[120%]"
                aria-hidden="true"
                viewBox="0 0 1200 900"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g ref={routeGroupRef}>
                  {signalBursts.map((route) => (
                    <g key={route.id}>
                      <path
                        id={route.id}
                        data-signal-path
                        d={route.d}
                        fill="none"
                        stroke={isDark ? '#00FFA3' : '#005c30'}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeDasharray="4 18"
                        opacity={isDark ? '0.12' : '0.22'}
                      />
                      <path
                        d={route.d}
                        fill="none"
                        stroke={isDark ? '#00FFA3' : '#007a40'}
                        strokeWidth={route.accentWidth}
                        strokeLinecap="round"
                        strokeDasharray={route.dash}
                        style={{
                          animation: `signalTrail ${route.duration}s linear ${route.begin}s infinite backwards`,
                        }}
                      />
                    </g>
                  ))}
                </g>
                <g ref={nodeGroupRef}>
                  {BACKGROUND_NODES.map((node, index) => (
                    <g key={`${node.x}-${node.y}-${index}`}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size * 2.6}
                        fill={isDark ? '#00FFA3' : '#00703a'}
                        opacity={isDark ? '0.07' : '0.12'}
                      />
                      <circle
                        data-signal-node
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={isDark ? '#00FFA3' : '#005c30'}
                        opacity={isDark ? '0.55' : '0.75'}
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size * 1.9}
                        fill={isDark ? '#00FFA3' : '#00703a'}
                        opacity={isDark ? '0.14' : '0.20'}
                        style={{
                          animation: `signalNodePulse ${2.4 + index * 0.2}s ease-in-out ${index * 0.25}s infinite`,
                          transformBox: 'fill-box',
                          transformOrigin: 'center',
                        }}
                      />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          ) : null}
        </div>
      </motion.div>

      {!isInteractive ? (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(0,255,163,0.08),_transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.22))] dark:bg-[radial-gradient(circle_at_top,_rgba(0,255,163,0.1),_transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.12),rgba(2,6,23,0.34))]" />
      ) : null}

      <div className={`fixed bottom-0 right-0 w-full h-full pointer-events-none flex justify-end items-end overflow-hidden z-0 ${
        isInteractive ? 'opacity-5' : 'opacity-[0.035]'
      }`}>
        <svg className="w-3/4 h-3/4 translate-x-1/4 translate-y-1/4 text-primary-container" fill="none" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 450L250 450L350 350L750 350" stroke="currentColor" strokeWidth="2"></path>
          <path d="M0 550L300 550L450 400L800 400" stroke="currentColor" strokeWidth="1"></path>
          <rect height="40" stroke="currentColor" strokeWidth="2" width="80" x="200" y="420"></rect>
          <circle cx="215" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
          <circle cx="265" cy="465" r="8" stroke="currentColor" strokeWidth="2"></circle>
        </svg>
      </div>
    </>
  )
}
