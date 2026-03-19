import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useTheme } from 'next-themes'

type SummaryMetric = {
  label: string
  value: string
  detail: string
}

type DetailSection = {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  statLabel: string
  statValue: string
}

interface ContentPageProps {
  icon: string
  title: string
  description: string
  heroBadge: string
  visual: ReactNode
  summary: SummaryMetric[]
  sections: DetailSection[]
  footerTitle: string
  footerText: string
}

const GuidelinesVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // Radar Sweep Animation
        gsap.to(rootRef.current?.querySelectorAll('[data-radar-sweep]') ?? [], {
          rotate: 360,
          duration: 4,
          repeat: -1,
          ease: 'none',
          transformOrigin: 'center center',
        })

        // Route paths draw-in
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-route-path]') ?? [],
          { strokeDashoffset: 120, opacity: 0.12 },
          {
            strokeDashoffset: 0,
            opacity: 0.65,
            duration: 2.8,
            stagger: 0.3,
            ease: 'power2.out',
          },
        )

        // Pulsing Nodes
        gsap.to(rootRef.current?.querySelectorAll('[data-node]') ?? [], {
          scale: 1.5,
          opacity: 0.8,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          stagger: 0.15,
          ease: 'sine.inOut',
          transformOrigin: 'center center',
        })

        // Sonar Pings
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-sonar-ping]') ?? [],
          { scale: 0.5, opacity: 0.8 },
          {
            scale: 4.5,
            opacity: 0,
            duration: 2.5,
            repeat: -1,
            stagger: 0.3,
            ease: 'power2.out',
            transformOrigin: 'center center',
          }
        )

        // Moving rails
        gsap.to(rootRef.current?.querySelectorAll('[data-metric-rail]') ?? [], {
          backgroundPositionX: '160%',
          duration: 4,
          repeat: -1,
          ease: 'none',
          stagger: 0.2,
        })

        // Improved Histogram entry
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-hist-bar]') ?? [],
          { scaleY: 0.1, opacity: 0.3, transformOrigin: 'bottom center' },
          {
            scaleY: (_index, target) => Number((target as HTMLElement).dataset.value ?? 1),
            opacity: 1,
            duration: 1.6,
            stagger: 0.1,
            ease: 'back.out(1.2)',
          },
        )
        
        // Floating 3D perspective subtle drift
        gsap.to(rootRef.current?.querySelectorAll('[data-hero-card]') ?? [], {
          y: -4,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.2,
        })
      }, rootRef)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} data-hero-item className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]" style={{ perspective: '1000px' }}>
      <div data-hero-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Guidance Network</p>
            <p className="mt-1 text-sm text-on-surface-variant">Trajectory-style lane illustration with active transfer signals.</p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Active
          </div>
        </div>
        <div className="relative rounded-[22px] border border-white/8 bg-black/20 p-4 overflow-hidden">
          {/* Radar Sweep Effect */}
          <div data-radar-sweep className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(0,255,163,0.1) 90%, rgba(0,255,163,0.4) 100%)' }} />
          
          <svg viewBox="0 0 360 180" className="relative z-10 h-40 w-full overflow-visible">
            {[
              'M26 38C78 24 116 86 152 88C198 90 214 38 252 42C294 46 310 78 338 64',
              'M30 146C74 126 110 132 148 118C196 100 218 126 256 112C294 98 314 70 336 74',
              'M68 166C110 150 128 104 176 98C220 92 240 142 284 136C314 132 328 114 344 98',
            ].map((path, index) => (
              <g key={path}>
                <path
                  d={path}
                  fill="none"
                  stroke="#00FFA3"
                  strokeWidth="1"
                  strokeOpacity="0.15"
                  strokeLinecap="round"
                />
                <path
                  data-route-path
                  d={path}
                  fill="none"
                  stroke={index === 1 ? '#22D3EE' : '#00FFA3'}
                  strokeWidth={index === 1 ? 2.6 : 1.7}
                  strokeDasharray={index === 1 ? '12 18' : '6 16'}
                  strokeLinecap="round"
                  opacity="0.4"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,163,0.4))' }}
                />
              </g>
            ))}
            {[
              [26, 38], [152, 88], [252, 42], [338, 64], [30, 146], [176, 98], [344, 98],
            ].map(([cx, cy], index) => (
              <g key={`${cx}-${cy}-${index}`}>
                <circle data-sonar-ping cx={cx} cy={cy} r="6" fill="none" stroke="#00FFA3" strokeWidth="1.5" />
                <circle data-node cx={cx} cy={cy} r="8" fill="rgba(0,255,163,0.15)" />
                <circle cx={cx} cy={cy} r="4" fill="#ffffff" />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid gap-4">
        <div data-hero-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Lane Density Histogram</p>
          <div className="mt-4 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-primary/20 blur-[30px] rounded-full" />
            <div className="relative z-10 flex h-28 items-end gap-2.5">
              {[0.42, 0.66, 0.54, 0.9, 0.72, 0.5, 0.82].map((value, index) => (
                <div key={index} className="flex h-full flex-1 items-end relative group">
                  <div className="absolute bottom-0 w-full h-full bg-primary/5 rounded-t-[12px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div
                    data-hist-bar
                    data-value={value}
                    className="relative w-full rounded-t-[12px] bg-[linear-gradient(180deg,rgba(0,255,163,0.9),rgba(0,255,163,0.1))] border-t border-primary/50 shadow-[0_-4px_12px_rgba(0,255,163,0.2)]"
                    style={{ height: '10%' }}
                  >
                    <div className="absolute top-0 w-full h-1 bg-white/40 rounded-t-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="relative z-10 mt-4 space-y-2.5">
              {[
                ['Break', '82%'],
                ['Fuel', '67%'],
                ['Parking', '74%'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
                    <span>{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-white/5 border border-white/5">
                    <div data-metric-rail className="h-full rounded-full bg-[linear-gradient(90deg,rgba(0,255,163,0.2),rgba(0,255,163,0.95),rgba(0,255,163,0.2))] bg-[length:200%_100%] shadow-[0_0_8px_rgba(0,255,163,0.5)]" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ManualVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // Initial fly-in for cards
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-manual-card]') ?? [],
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.15, ease: 'back.out(1.5)' },
        )

        // Progress bar fills
        gsap.to(rootRef.current?.querySelectorAll('[data-progress-fill]') ?? [], {
          width: (_index, target) => (target as HTMLElement).dataset.width ?? '70%',
          duration: 1.5,
          stagger: 0.2,
          ease: 'power3.out',
        })

        // Glowing pulse on the progress fills
        gsap.to(rootRef.current?.querySelectorAll('[data-progress-glow]') ?? [], {
          left: '100%',
          duration: 2,
          repeat: -1,
          ease: 'none',
          stagger: 0.4,
        })

        // Step bar fills
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-step-bar]') ?? [],
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: (_index, target) => Number((target as HTMLElement).dataset.scale ?? 1), duration: 1.4, stagger: 0.15, ease: 'power3.out' },
        )
        
        // 3D Tilt perspective subtle drift
        gsap.to(rootRef.current?.querySelectorAll('[data-perspective-card]') ?? [], {
          rotateX: 5,
          rotateY: -3,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.3,
        })

      }, rootRef)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} data-hero-item className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]" style={{ perspective: '1200px' }}>
      <div data-perspective-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.35)] transform-style-3d">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Workflow Stack</p>
        <div className="mt-5 space-y-4">
          {[
            ['Trip points', '0.92'],
            ['Route review', '0.84'],
            ['Log check', '0.76'],
            ['Export', '0.62'],
          ].map(([title, scale], index) => (
            <div key={title} data-manual-card className="relative overflow-hidden rounded-[22px] border border-white/8 bg-black/30 p-4 transition-colors hover:bg-black/40 hover:border-white/15">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] text-sm font-black text-primary shadow-[0_0_15px_rgba(0,255,163,0.15)]">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-white uppercase tracking-wider">{title}</p>
                  <div className="mt-2.5 h-1.5 rounded-full bg-black/50 border border-white/5 overflow-hidden">
                    <div data-step-bar data-scale={scale} className="relative h-full w-full rounded-full bg-[linear-gradient(90deg,#22D3EE,#00FFA3)] shadow-[0_0_10px_rgba(0,255,163,0.4)]">
                      <div className="absolute top-0 right-0 w-4 h-full bg-white opacity-50 blur-[2px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div data-perspective-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.35)] transform-style-3d">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">Progress Board</p>
            <p className="mt-1.5 text-sm text-on-surface-variant leading-relaxed">Procedural visual instead of standard graphs.</p>
          </div>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Guide</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ['Route parse', '84%', '#00FFA3'],
            ['Stop review', '72%', '#22D3EE'],
            ['Log sync', '91%', '#00FFA3'],
            ['Export prep', '63%', '#22D3EE'],
          ].map(([label, width, color]) => (
            <div key={label} className="relative overflow-hidden rounded-[22px] border border-white/8 bg-black/20 p-5 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <p className="text-[13px] font-bold text-white uppercase tracking-wider">{label}</p>
                <div className="mt-4 h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden relative">
                  <div data-progress-fill data-width={width} className="relative h-full w-0 rounded-full" style={{ background: `linear-gradient(90deg, ${color}33, ${color})`, boxShadow: `0 0 12px ${color}66` }}>
                    <div data-progress-glow className="absolute top-0 -left-6 w-12 h-full bg-white opacity-80 blur-[4px] -skew-x-12" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                  <span className="text-on-surface-variant">Status</span>
                  <span style={{ color }}>{width}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const AboutVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const orbitShell = rootRef.current?.querySelector('[data-orbit-shell]')

        // Orbit shell rotation
        if (orbitShell) {
          gsap.to(orbitShell, {
            rotate: 360,
            duration: 30,
            repeat: -1,
            ease: 'none',
            transformOrigin: 'center center',
          })
        }

        // Orbit chips floating
        gsap.to(rootRef.current?.querySelectorAll('[data-orbit-chip]') ?? [], {
          y: -10,
          rotate: () => gsap.utils.random(-3, 3),
          duration: () => gsap.utils.random(2, 3.5),
          repeat: -1,
          yoyo: true,
          stagger: {
            each: 0.2,
            from: 'random',
          },
          ease: 'sine.inOut',
        })

        // Core Shockwave Pulse
        gsap.fromTo(rootRef.current?.querySelectorAll('[data-core-shock]') ?? [], 
          { scale: 0.1, opacity: 0.8 },
          {
            scale: 3,
            opacity: 0,
            duration: 3,
            repeat: -1,
            stagger: 0.8,
            ease: 'power2.out',
            transformOrigin: 'center center',
          }
        )

        // Ring progress draw
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-ring-progress]') ?? [],
          { strokeDashoffset: 260, opacity: 0 },
          { 
            strokeDashoffset: (_i, target) => (target as SVGCircleElement).dataset.offset ?? '90', 
            opacity: 1,
            duration: 2, 
            stagger: 0.2, 
            ease: 'back.out(1.2)' 
          },
        )

        // Ring pulse glow
        gsap.to(rootRef.current?.querySelectorAll('[data-ring-progress]') ?? [], {
          filter: 'drop-shadow(0 0 12px rgba(0,255,163,0.6))',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.2,
        })

        // Pie slices slide out slightly
        gsap.fromTo(
          rootRef.current?.querySelectorAll('[data-pie-slice]') ?? [],
          { strokeDashoffset: 251, scale: 0.9, opacity: 0 },
          { 
            strokeDashoffset: (_i, target) => (target as SVGCircleElement).dataset.slice ?? '120', 
            scale: 1,
            opacity: 1,
            duration: 1.8, 
            stagger: 0.15, 
            ease: 'power3.out',
            transformOrigin: 'center center'
          },
        )
        
        // Perspective float
        gsap.to(rootRef.current?.querySelectorAll('[data-perspective-card]') ?? [], {
          y: -5,
          rotateX: 2,
          rotateY: 2,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.4,
        })

      }, rootRef)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} data-hero-item className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]" style={{ perspective: '1200px' }}>
      <div data-perspective-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.35)] transform-style-3d">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Product Orbit</p>
        <div className="relative mt-5 flex h-64 items-center justify-center rounded-[24px] border border-white/8 bg-black/20 overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 blur-[50px] rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <svg viewBox="0 0 220 220" className="relative z-10 h-56 w-56">
            <g data-orbit-shell>
              <circle cx="110" cy="110" r="74" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 16" strokeLinecap="round" />
              <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" strokeDasharray="2 12" strokeLinecap="round" />
            </g>
            {/* Shockwaves */}
            <circle data-core-shock cx="110" cy="110" r="30" fill="none" stroke="#00FFA3" strokeWidth="2" />
            <circle data-core-shock cx="110" cy="110" r="30" fill="none" stroke="#22D3EE" strokeWidth="1" />
            
            <circle cx="110" cy="110" r="36" fill="rgba(0,255,163,0.15)" className="animate-pulse shadow-[0_0_30px_rgba(0,255,163,0.4)]" />
            <circle cx="110" cy="110" r="22" fill="#00FFA3" opacity="0.9" />
            <circle cx="110" cy="110" r="8" fill="#ffffff" />
          </svg>
          <div data-orbit-chip className="absolute left-6 top-10 rounded-full border border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_20px_rgba(0,255,163,0.2)]">Routes</div>
          <div data-orbit-chip className="absolute right-6 top-16 rounded-full border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(34,211,238,0.05))] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_20px_rgba(34,211,238,0.2)]">Logs</div>
          <div data-orbit-chip className="absolute bottom-10 left-12 rounded-full border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]">Drivers</div>
          <div data-orbit-chip className="absolute bottom-12 right-10 rounded-full border border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_20px_rgba(0,255,163,0.2)]">Dispatch</div>
        </div>
      </div>

      <div data-perspective-card className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_50px_rgba(0,0,0,0.35)] transform-style-3d">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Performance Metrics</p>
        <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[22px] border border-white/8 bg-black/20 p-5 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg viewBox="0 0 120 120" className="relative z-10 mx-auto h-28 w-28 drop-shadow-[0_0_12px_rgba(0,255,163,0.3)]">
              <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle data-pie-slice data-slice="52" cx="60" cy="60" r="40" fill="none" stroke="#00FFA3" strokeWidth="16" strokeDasharray="251" transform="rotate(-90 60 60)" />
              <circle data-pie-slice data-slice="126" cx="60" cy="60" r="40" fill="none" stroke="#22D3EE" strokeWidth="16" strokeDasharray="251" transform="rotate(-15 60 60)" />
              <circle data-pie-slice data-slice="184" cx="60" cy="60" r="40" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="16" strokeDasharray="251" transform="rotate(76 60 60)" />
            </svg>
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-3 w-full text-center text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="border-b-2 border-[#00FFA3] pb-1">Route</span>
              <span className="border-b-2 border-[#22D3EE] pb-1">Logs</span>
              <span className="border-b-2 border-white pb-1">Ops</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Clarity', '88'],
              ['Compliance', '74'],
              ['UX', '81'],
            ].map(([label, offset], index) => (
              <div key={label} className="relative rounded-[22px] border border-white/8 bg-black/20 p-4 text-center overflow-hidden">
                <svg viewBox="0 0 120 120" className="relative z-10 mx-auto h-24 w-24">
                  <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    data-ring-progress
                    data-offset={offset}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={index === 1 ? '#22D3EE' : '#00FFA3'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="252"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="65" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="sans-serif">{offset}%</text>
                </svg>
                <p className="relative z-10 mt-3 text-[12px] font-bold uppercase tracking-wider text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const ContentShowcasePage = ({
  icon,
  title,
  description,
  heroBadge,
  visual,
  summary,
  sections,
  footerTitle,
  footerText,
}: ContentPageProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isLight = theme === 'light'

  useEffect(() => {
    if (!rootRef.current) {
      return
    }

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const bentoBlocks = rootRef.current?.querySelectorAll('[data-bento]') ?? []
        const glows = rootRef.current?.querySelectorAll('[data-bento-glow]') ?? []

        gsap.from(bentoBlocks, {
          y: 60,
          opacity: 0,
          scale: 0.95,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power4.out',
        })

        gsap.to(glows, {
          scale: 1.2,
          opacity: 0.5,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.5,
        })
      }, rootRef)

      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  const boxGlass = isLight
    ? 'border-white/80 bg-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:bg-white/70'
    : 'border-white/10 bg-surface/30 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:bg-surface/50'

  return (
    <div ref={rootRef} className="min-h-screen px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        {/* BENTO GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* 1. HERO BLOCK */}
          <div data-bento className={`relative col-span-12 flex flex-col items-center justify-center overflow-hidden rounded-[40px] border ${boxGlass} p-10 text-center backdrop-blur-3xl transition-all duration-500 lg:p-16`}>
            <div data-bento-glow className="pointer-events-none absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />
            <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.2em] text-primary shadow-[0_0_20px_rgba(0,255,163,0.15)] mb-8">
              <span className="material-symbols-outlined text-lg">{icon}</span>
              <span>{heroBadge}</span>
            </div>
            <h1 className="relative z-10 font-headline text-5xl font-black tracking-tighter text-on-surface sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.9]">
              {title}
            </h1>
            <p className="relative z-10 mt-6 max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
              {description}
            </p>
          </div>

          {/* 2. VISUAL BLOCK (Interactive Components) */}
          <div data-bento className="col-span-12 pt-4 pb-2 w-full">
             {visual}
          </div>

          {/* 3. SUMMARY METRICS */}
          {summary.map((item, i) => (
            <div
              key={item.label}
              data-bento
              className={`col-span-12 rounded-[32px] border ${boxGlass} p-8 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 md:col-span-4`}
            >
              <div className="mb-6 h-1 w-12 rounded-full bg-[linear-gradient(90deg,var(--primary),transparent)]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">{item.label}</p>
              <p className="mt-4 font-headline text-4xl font-black tracking-tight text-on-surface">{item.value}</p>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant font-medium">{item.detail}</p>
            </div>
          ))}

          {/* 4. DETAIL SECTIONS */}
          {sections.map((section, i) => (
            <div
              key={section.title}
              data-bento
              className={`group relative col-span-12 overflow-hidden rounded-[32px] border ${boxGlass} p-8 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 lg:col-span-4`}
            >
              <div data-bento-glow className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-[50px] transition-opacity group-hover:bg-cyan-400/20" />
              
              <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">{section.eyebrow}</p>
                  <h2 className="mt-2 font-headline text-2xl font-black tracking-tight text-on-surface group-hover:text-cyan-300 transition-colors">{section.title}</h2>
                </div>
                <div className="shrink-0 rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{section.statLabel}</p>
                  <p className="mt-1 font-headline text-xl font-black text-on-surface">{section.statValue}</p>
                </div>
              </div>
              
              <p className="relative z-10 text-sm leading-6 text-on-surface-variant mb-6">{section.description}</p>
              
              <div className="relative z-10 space-y-3">
                {section.bullets.slice(0, 2).map((bullet) => (
                  <div key={bullet} className={`flex items-start gap-3 rounded-2xl border ${isLight ? 'border-black/5 bg-white/40' : 'border-white/5 bg-black/20'} px-4 py-3`}>
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <p className="text-sm leading-5 text-on-surface-variant">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 5. FOOTER BLOCK */}
          <div data-bento className={`relative col-span-12 flex flex-col gap-6 overflow-hidden rounded-[32px] border ${boxGlass} p-8 backdrop-blur-3xl transition-all duration-500 sm:flex-row sm:items-center sm:justify-between lg:p-10 lg:px-12`}>
            <div className="relative z-10 max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary mb-3">Operations Note</p>
              <h2 className="font-headline text-3xl font-black tracking-tight text-on-surface">{footerTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant">{footerText}</p>
            </div>
            <div className="relative z-10 shrink-0">
               <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(0,255,163,0.2)]">
                  <span className="material-symbols-outlined text-3xl text-primary">task_alt</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export const GuidelinesPage = () => (
  <ContentShowcasePage
    icon="local_shipping"
    title="Trucker Guidelines"
    description="Quick guidance for pre-trip checks, break pacing, terrain awareness, and stop quality."
    heroBadge="Roadside playbook"
    visual={<GuidelinesVisual />}
    summary={[
      { label: 'Departure', value: '45 min', detail: 'Walkaround and paperwork window.' },
      { label: 'Fuel Rhythm', value: '220-260 mi', detail: 'Planning range for cleaner stop spacing.' },
      { label: 'Break Trigger', value: '7h 30m', detail: 'Early warning before the legal break.' },
    ]}
    sections={[
      {
        eyebrow: 'Pre-Trip',
        title: 'Departure readiness',
        description: 'Lock in the first leg, first stop, and obvious route hazards before you roll.',
        bullets: [
          'Verify trailer, seal, and special pickup notes.',
          'Confirm location match so city-name errors do not become reroute miles.',
        ],
        statLabel: 'Priority',
        statValue: 'High',
      },
      {
        eyebrow: 'On Road',
        title: 'Break pacing',
        description: 'Plan breaks around parking quality and traffic, not at the last minute.',
        bullets: [
          'Pick stops where a 30-minute break works without extra deadhead.',
          'If weather or traffic bites, protect the break and overnight parking first.',
        ],
        statLabel: 'Cadence',
        statValue: 'Steady',
      },
      {
        eyebrow: 'Terrain',
        title: 'Grades and weather',
        description: 'Mountain and freeze corridors need slower assumptions and bigger margins.',
        bullets: [
          'Mountain routes need brake-check thinking and wider fuel buffer.',
          'Surface crosswind, chain, and freeze warnings before the commitment zone.',
        ],
        statLabel: 'Advisory',
        statValue: 'Dynamic',
      },
    ]}
    footerTitle="Guidance kept compact"
    footerText="Less reading, more scan value: route patterns, histogram bars, and short operational notes."
  />
)

export const ManualPage = () => (
  <ContentShowcasePage
    icon="menu_book"
    title="Driver Manual"
    description="Short workflow notes for entering a trip, checking outputs, and exporting the final package."
    heroBadge="Workflow manual"
    visual={<ManualVisual />}
    summary={[
      { label: 'Route Modes', value: '3+', detail: 'Compare main and alternate paths fast.' },
      { label: 'Logs', value: 'Auto-built', detail: 'Daily logs sync from route events.' },
      { label: 'Review', value: '< 2 min', detail: 'Map, stops, logs, then export.' },
    ]}
    sections={[
      {
        eyebrow: 'Input Flow',
        title: 'Enter the trip',
        description: 'Start with current location, pickup, destination, and cycle hours.',
        bullets: [
          'Use suggestions when possible for cleaner coordinates.',
          'Cycle hours directly shape the aggressiveness of the plan.',
        ],
        statLabel: 'Step',
        statValue: '01',
      },
      {
        eyebrow: 'Route Review',
        title: 'Review the package',
        description: 'Compare distance, drive time, stops, and route shape before choosing a path.',
        bullets: [
          'Check the stats bar first.',
          'Use the map to verify stop placement and alternate corridors.',
        ],
        statLabel: 'Step',
        statValue: '02',
      },
      {
        eyebrow: 'Paperwork',
        title: 'Finalize logs',
        description: 'Make sure the remarks and day splits line up with the route plan.',
        bullets: [
          'Remarks should explain why the stop exists.',
          'Treat exports as handoff documents, not just snapshots.',
        ],
        statLabel: 'Step',
        statValue: '03',
      },
    ]}
    footerTitle="Manual made visual"
    footerText="Progress modules and compact step bars replace heavier text blocks."
  />
)

export const AboutPage = () => (
  <ContentShowcasePage
    icon="info"
    title="About Vanguard"
    description="A compact product profile focused on route clarity, driver usability, and HOS-aware planning."
    heroBadge="Product profile"
    visual={<AboutVisual />}
    summary={[
      { label: 'Mission', value: 'Clarity', detail: 'Readable route planning for ops and drivers.' },
      { label: 'Focus', value: 'HOS-Aware', detail: 'Compliance influences the route early.' },
      { label: 'Style', value: 'Driver-Centered', detail: 'Fast to scan under pressure.' },
    ]}
    sections={[
      {
        eyebrow: 'Why',
        title: 'Why it exists',
        description: 'Route planning should show route shape, paperwork context, and compliance in one flow.',
        bullets: [
          'Dispatch needs route options and timing confidence together.',
          'Drivers need a plan that feels intentional, not fragmented.',
        ],
        statLabel: 'North Star',
        statValue: 'Clarity',
      },
      {
        eyebrow: 'Product',
        title: 'What improves',
        description: 'The product acts like a route-and-paperwork cockpit, not just a map screen.',
        bullets: [
          'Show route alternatives without hiding compliance cost.',
          'Keep route, stops, logs, and summary in one workspace.',
        ],
        statLabel: 'Lens',
        statValue: 'Operational',
      },
      {
        eyebrow: 'Principles',
        title: 'How it feels',
        description: 'Bold, controlled visuals with motion that supports context instead of fighting it.',
        bullets: [
          'Use motion to reinforce hierarchy, not overwhelm the screen.',
          'Favor short labels and scan-friendly surfaces.',
        ],
        statLabel: 'Style',
        statValue: 'Intentional',
      },
    ]}
    footerTitle="Charts over paragraphs"
    footerText="Pie slices, orbit chips, and rings now carry more of the story with much less copy."
  />
)
