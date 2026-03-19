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
  const { theme } = useTheme()
  const isLight = theme === 'light'

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
      <div
        data-hero-card
        className={`rounded-[28px] border p-5 shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${
          isLight
            ? 'border-emerald-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,248,244,0.88))]'
            : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Guidance Network</p>
            <p className="mt-1 text-sm text-on-surface-variant">Trajectory-style lane illustration with active transfer signals.</p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Active
          </div>
        </div>
        <div
          className={`relative overflow-hidden rounded-[22px] border p-4 ${
            isLight ? 'border-emerald-900/10 bg-[rgba(232,241,236,0.95)]' : 'border-white/8 bg-[rgba(0,0,0,0.4)]'
          }`}
        >
          {/* Radar Sweep Effect */}
          <div
            data-radar-sweep
            className="absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: isLight
                ? 'conic-gradient(from 0deg, transparent 72%, rgba(0,92,48,0.06) 88%, rgba(0,92,48,0.2) 100%)'
                : 'conic-gradient(from 0deg, transparent 70%, rgba(0,255,163,0.1) 90%, rgba(0,255,163,0.4) 100%)',
            }}
          />
          
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
        <div
          data-hero-card
          className={`rounded-[28px] border p-5 shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${
            isLight
              ? 'border-sky-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,248,251,0.9))]'
              : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Lane Density Histogram</p>
          <div
            className={`relative mt-4 overflow-hidden rounded-[22px] border px-4 py-4 ${
              isLight ? 'border-sky-900/10 bg-[rgba(236,245,248,0.96)]' : 'border-white/8 bg-[rgba(0,0,0,0.4)]'
            }`}
          >
            <div className={`absolute top-0 left-1/2 h-16 w-32 -translate-x-1/2 rounded-full blur-[30px] ${isLight ? 'bg-primary/10' : 'bg-primary/20'}`} />
            <div className="relative z-10 flex h-28 items-end gap-2.5">
              {[0.42, 0.66, 0.54, 0.9, 0.72, 0.5, 0.82].map((value, index) => (
                <div key={index} className="flex h-full flex-1 items-end relative group">
                  <div className={`absolute bottom-0 h-full w-full rounded-t-[12px] opacity-0 transition-opacity group-hover:opacity-100 ${isLight ? 'bg-primary/8' : 'bg-primary/5'}`} />
                  <div
                    data-hist-bar
                    data-value={value}
                    className={`relative w-full rounded-t-[12px] border-t ${isLight ? 'border-primary/45 bg-[linear-gradient(180deg,rgba(0,140,88,0.85),rgba(0,140,88,0.18))] shadow-[0_-4px_10px_rgba(0,92,48,0.14)]' : 'border-primary/50 bg-[linear-gradient(180deg,rgba(0,255,163,0.9),rgba(0,255,163,0.1))] shadow-[0_-4px_12px_rgba(0,255,163,0.2)]'}`}
                    style={{ height: '10%' }}
                  >
                    <div className={`absolute top-0 h-1 w-full rounded-t-full ${isLight ? 'bg-white/55' : 'bg-white/40'}`} />
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
                    <span className={isLight ? 'text-slate-700' : 'text-white'}>{value}</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full border ${isLight ? 'border-slate-300/90 bg-slate-200/80' : 'border-white/5 bg-white/10'}`}>
                    <div
                      data-metric-rail
                      className={`h-full rounded-full bg-[length:200%_100%] ${isLight ? 'bg-[linear-gradient(90deg,rgba(0,92,48,0.18),rgba(0,140,88,0.92),rgba(34,211,238,0.28))] shadow-[0_0_6px_rgba(0,92,48,0.18)]' : 'bg-[linear-gradient(90deg,rgba(0,255,163,0.2),rgba(0,255,163,0.95),rgba(0,255,163,0.2))] shadow-[0_0_8px_rgba(0,255,163,0.5)]'}`}
                      style={{ width: value }}
                    />
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
  const { theme } = useTheme()
  const isLight = theme === 'light'

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
      <div
        data-perspective-card
        className={`rounded-[28px] border p-6 shadow-[0_24px_50px_rgba(0,0,0,0.18)] transform-style-3d ${
          isLight
            ? 'border-emerald-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(242,248,244,0.9))]'
            : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_24px_50px_rgba(0,0,0,0.35)]'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Workflow Stack</p>
        <div className="mt-5 space-y-4">
          {[
            ['Trip points', '0.92'],
            ['Route review', '0.84'],
            ['Log check', '0.76'],
            ['Export', '0.62'],
          ].map(([title, scale], index) => (
            <div
              key={title}
              data-manual-card
              className={`relative overflow-hidden rounded-[22px] border p-4 transition-colors ${
                isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-white/8 bg-[rgba(0,0,0,0.5)] hover:border-white/15'
              }`}
            >
              <div className={`absolute top-0 right-0 h-32 w-32 rounded-full blur-[40px] ${isLight ? 'bg-primary/8' : 'bg-primary/5'}`} />
              <div className="relative z-10 flex items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border text-sm font-black text-primary ${isLight ? 'border-primary/20 bg-[linear-gradient(135deg,rgba(0,92,48,0.12),rgba(0,92,48,0.04))] shadow-[0_0_10px_rgba(0,92,48,0.1)]' : 'border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] shadow-[0_0_15px_rgba(0,255,163,0.15)]'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className={`text-[13px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</p>
                  <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full border ${isLight ? 'border-slate-200 bg-slate-200/80' : 'border-white/5 bg-[rgba(0,0,0,0.6)]'}`}>
                    <div data-step-bar data-scale={scale} className={`relative h-full w-full rounded-full ${isLight ? 'bg-[linear-gradient(90deg,#0f766e,#0f9f73)] shadow-[0_0_6px_rgba(15,118,110,0.18)]' : 'bg-[linear-gradient(90deg,#22D3EE,#00FFA3)] shadow-[0_0_10px_rgba(0,255,163,0.4)]'}`}>
                      <div className={`absolute top-0 right-0 h-full w-4 blur-[2px] ${isLight ? 'bg-white/60' : 'bg-white opacity-50'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        data-perspective-card
        className={`rounded-[28px] border p-6 shadow-[0_24px_50px_rgba(0,0,0,0.18)] transform-style-3d ${
          isLight
            ? 'border-sky-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(241,247,252,0.9))]'
            : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_24px_50px_rgba(0,0,0,0.35)]'
        }`}
      >
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
            <div key={label} className={`group relative overflow-hidden rounded-[22px] border p-5 ${isLight ? 'border-slate-200 bg-white' : 'border-white/8 bg-[rgba(0,0,0,0.4)]'}`}>
              <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${isLight ? 'bg-gradient-to-br from-slate-100 to-transparent' : 'bg-gradient-to-br from-white/5 to-transparent'}`} />
              <div className="relative z-10">
                <p className={`text-[13px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>{label}</p>
                <div className={`relative mt-4 h-2 overflow-hidden rounded-full border ${isLight ? 'border-slate-200 bg-slate-200/80' : 'border-white/5 bg-[rgba(0,0,0,0.6)]'}`}>
                  <div data-progress-fill data-width={width} className="relative h-full w-0 rounded-full" style={{ background: isLight ? `linear-gradient(90deg, ${color}22, ${color}dd)` : `linear-gradient(90deg, ${color}33, ${color})`, boxShadow: isLight ? `0 0 8px ${color}33` : `0 0 12px ${color}66` }}>
                    <div data-progress-glow className={`absolute top-0 -left-6 h-full w-12 -skew-x-12 blur-[4px] ${isLight ? 'bg-white/65' : 'bg-white opacity-80'}`} />
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
  const { theme } = useTheme()
  const isLight = theme === 'light'

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
      <div
        data-perspective-card
        className={`rounded-[28px] border p-6 shadow-[0_24px_50px_rgba(0,0,0,0.18)] transform-style-3d ${
          isLight
            ? 'border-emerald-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(242,248,244,0.9))]'
            : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_24px_50px_rgba(0,0,0,0.35)]'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Product Orbit</p>
        <div className={`group relative mt-5 flex h-64 items-center justify-center overflow-hidden rounded-[24px] border ${isLight ? 'border-emerald-900/10 bg-[linear-gradient(145deg,rgba(240,247,243,0.98),rgba(228,240,234,0.94))]' : 'border-white/8 bg-[linear-gradient(145deg,rgba(0,0,0,0.4),rgba(5,10,8,0.7))]'}`}>
          <div className={`absolute inset-0 scale-150 rounded-full blur-[50px] opacity-50 transition-opacity duration-700 group-hover:opacity-100 ${isLight ? 'bg-primary/8' : 'bg-primary/5'}`} />
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
          <div data-orbit-chip className={`absolute left-6 top-10 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] shadow-[0_0_20px_rgba(0,255,163,0.2)] ${isLight ? 'border-primary/20 bg-white/92 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)]' : 'border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] text-white'}`}>Routes</div>
          <div data-orbit-chip className={`absolute right-6 top-16 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isLight ? 'border-cyan-400/20 bg-white/92 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)]' : 'border-cyan-400/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.2),rgba(34,211,238,0.05))] text-white shadow-[0_0_20px_rgba(34,211,238,0.2)]'}`}>Logs</div>
          <div data-orbit-chip className={`absolute bottom-10 left-12 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isLight ? 'border-slate-300 bg-white/92 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)]' : 'border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))] text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}>Drivers</div>
          <div data-orbit-chip className={`absolute bottom-12 right-10 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${isLight ? 'border-primary/20 bg-white/92 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)]' : 'border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.2),rgba(0,255,163,0.05))] text-white shadow-[0_0_20px_rgba(0,255,163,0.2)]'}`}>Dispatch</div>
        </div>
      </div>

      <div
        data-perspective-card
        className={`rounded-[28px] border p-6 shadow-[0_24px_50px_rgba(0,0,0,0.18)] transform-style-3d ${
          isLight
            ? 'border-sky-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(241,247,252,0.9))]'
            : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_24px_50px_rgba(0,0,0,0.35)]'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary mb-5">Performance Metrics</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Clarity', '88', '#00FFA3'],
            ['Compliance', '74', '#22D3EE'],
            ['UX', '81', '#00FFA3'],
          ].map(([label, offset, color], index) => (
              <div key={label} className={`relative overflow-hidden rounded-[22px] border transition-all duration-300 group ${isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-white/8 bg-[linear-gradient(145deg,rgba(0,0,0,0.5),rgba(5,10,8,0.7))] hover:border-white/20'}`}>
              <div className="p-5 text-center flex flex-col items-center">
              <div className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${color}18, transparent 70%)` }} />
              <svg viewBox="0 0 120 120" className="relative z-10 mx-auto h-20 w-20 drop-shadow-[0_0_8px_rgba(0,255,163,0.25)]">
                <circle cx="60" cy="60" r="42" fill="none" stroke={isLight ? 'rgba(148,163,184,0.24)' : 'rgba(255,255,255,0.06)'} strokeWidth="10" />
                <circle
                  data-ring-progress
                  data-offset={offset}
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke={color as string}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="66" textAnchor="middle" fill={isLight ? '#0f172a' : 'white'} fontSize="22" fontWeight="800" fontFamily="sans-serif">{offset}%</text>
              </svg>
              <p className="relative z-10 mt-4 w-full text-[11px] font-bold uppercase tracking-widest" style={{ color: color as string }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-4 rounded-[18px] border p-3 ${isLight ? 'border-slate-200 bg-slate-50/90' : 'border-white/8 bg-[rgba(0,0,0,0.3)]'}`}>
          <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-bold uppercase tracking-widest text-[#005c30] dark:text-primary">
            <span className="border-b-2 border-[#00FFA3]/60 pb-1.5">Route</span>
            <span className="border-b-2 border-[#22D3EE]/60 pb-1.5">Logs</span>
            <span className="border-b-2 border-white/40 pb-1.5">Ops</span>
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
    ? 'border-slate-300 bg-white shadow-[0_22px_48px_rgba(15,23,42,0.14),0_6px_16px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-white backdrop-blur-xl'
    : 'border-white/10 bg-black/22 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:bg-black/30 backdrop-blur-xl'

  const textMutedClass = isLight ? 'text-slate-800' : 'text-on-surface-variant'
  const textHeadingClass = isLight ? 'text-slate-950' : 'text-on-surface'
  const eyebrowClass = isLight ? 'text-[#005c30]' : 'text-primary'
  const eyebrowCyanClass = isLight ? 'text-[#0369a1]' : 'text-cyan-400'
  const bulletBg = isLight ? 'border-slate-200/95 bg-[rgba(255,255,255,0.98)]' : 'border-white/5 bg-black/15'
  const bulletDot = isLight ? 'bg-[#0369a1]' : 'bg-cyan-400'

  return (
    <div ref={rootRef} className="min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-26">
      <div className="mx-auto max-w-[1280px]">
        {/* BENTO GRID */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          
          {/* 1. HERO BLOCK */}
          <div data-bento className={`relative col-span-12 flex min-h-[270px] flex-col items-center justify-center overflow-hidden rounded-[36px] border ${boxGlass} px-6 py-8 text-center transition-all duration-500 sm:min-h-[300px] sm:px-8 sm:py-10 lg:px-14 lg:py-14`}>
            <div data-bento-glow className="pointer-events-none absolute -top-10 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
            <div data-bento-glow className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-[80px]" />
            <div className={`relative z-10 inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] mb-10 backdrop-blur-sm ${
              isLight ? 'border-[#005c30]/30 bg-[#005c30]/10 text-[#005c30] shadow-[0_0_20px_rgba(0,92,48,0.15)]' : 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_25px_rgba(0,255,163,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
            }`}>
              <span className="material-symbols-outlined text-base">{icon}</span>
              <span>{heroBadge}</span>
            </div>
            <h1 className={`relative z-10 max-w-4xl font-headline text-4xl font-black leading-[0.94] tracking-tighter sm:text-5xl md:text-6xl lg:text-[4.8rem] ${textHeadingClass}`}>
              {title}
            </h1>
            <p className={`relative z-10 mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${textMutedClass}`}>
              {description}
            </p>
            <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${isLight ? 'border-[#005c30]/10 bg-[#005c30]/5' : 'border-primary/10 bg-primary/5'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${isLight ? 'bg-[#005c30]' : 'bg-primary'} shadow-[0_0_8px_currentColor] animate-pulse`} />
              <span className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${isLight ? 'text-[#005c30]' : 'text-primary'}`}>Vanguard Fleet Ops</span>
            </div>
          </div>

          {/* 2. VISUAL BLOCK (Interactive Components) */}
          <div data-bento className="col-span-12 w-full pt-1 pb-1 sm:pt-2">
             {visual}
          </div>

          {/* 3. SUMMARY METRICS */}
          {summary.map((item, i) => (
            <div
              key={item.label}
              data-bento
              className={`group relative col-span-12 overflow-hidden rounded-[28px] border ${boxGlass} p-6 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 md:col-span-4 lg:p-7`}
            >
              <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: isLight ? 'rgba(0,92,48,0.06)' : 'rgba(0,255,163,0.08)', filter: 'blur(40px)' }} />
              <div className="mb-5 flex items-center gap-3">
                <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${isLight ? 'from-[#005c30]' : 'from-primary'} to-transparent`} />
                <div className={`h-1 w-4 rounded-full ${isLight ? 'bg-[#005c30]/30' : 'bg-primary/30'}`} />
              </div>
              <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${eyebrowClass}`}>{item.label}</p>
              <p className={`mt-3 font-headline text-4xl font-black leading-none tracking-tight sm:text-[2.7rem] ${textHeadingClass}`}>{item.value}</p>
              <div className={`my-4 h-px w-full bg-gradient-to-r ${isLight ? 'from-slate-200' : 'from-on-surface-variant/10'} to-transparent`} />
              <p className={`text-sm leading-5.5 font-medium ${textMutedClass}`}>{item.detail}</p>
            </div>
          ))}

          {/* 4. DETAIL SECTIONS */}
          {sections.map((section, i) => (
            <div
              key={section.title}
              data-bento
              className={`group relative col-span-12 overflow-hidden rounded-[28px] border ${boxGlass} p-6 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 lg:col-span-4 lg:p-7`}
            >
              <div data-bento-glow className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: isLight ? 'rgba(3,105,161,0.08)' : 'rgba(34,211,238,0.08)' }} />
              
              <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.24em] mb-2 ${eyebrowCyanClass}`}>{section.eyebrow}</p>
                  <h2 className={`font-headline text-2xl font-black tracking-tight leading-tight transition-colors ${textHeadingClass} group-hover:${isLight ? 'text-[#0369a1]' : 'text-cyan-300'}`}>{section.title}</h2>
                </div>
                <div className={`shrink-0 rounded-[18px] border px-4 py-3 text-right backdrop-blur-sm ${
                  isLight ? 'border-[#0369a1]/20 bg-[#0369a1]/8' : 'border-cyan-400/20 bg-cyan-400/8'
                }`}>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${eyebrowCyanClass}`}>{section.statLabel}</p>
                  <p className={`mt-0.5 font-headline text-xl font-black ${textHeadingClass}`}>{section.statValue}</p>
                </div>
              </div>
              
              <p className={`relative z-10 mb-5 text-[13px] leading-5.5 line-clamp-3 ${textMutedClass}`}>{section.description}</p>
              
              <div className="relative z-10 space-y-2.5">
                {section.bullets.slice(0, 2).map((bullet) => (
                  <div key={bullet} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 backdrop-blur-sm ${bulletBg}`}>
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_8px] ${bulletDot}`} style={{ boxShadow: isLight ? '0 0 6px rgba(3,105,161,0.4)' : '0 0 8px rgba(34,211,238,0.6)' }} />
                    <p className={`text-[13px] leading-5 ${textMutedClass}`}>{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 5. FOOTER BLOCK */}
          <div
            data-bento
            className={`relative col-span-12 flex flex-col gap-6 overflow-hidden rounded-[28px] border p-6 transition-all duration-500 sm:flex-row sm:items-center sm:justify-between lg:p-8 ${
              isLight
                ? 'border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f8fbf9)] shadow-[0_24px_54px_rgba(15,23,42,0.16),0_8px_18px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)]'
                : boxGlass
            }`}
          >
            <div data-bento-glow className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full blur-[60px]" style={{ background: isLight ? 'rgba(0,92,48,0.08)' : 'rgba(0,255,163,0.10)' }} />
            <div className="relative z-10 max-w-3xl">
              <div className="mb-3 flex items-center gap-3">
                <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${isLight ? 'from-[#005c30]' : 'from-primary'} to-transparent`} />
                <p className={`text-[10px] font-bold uppercase tracking-[0.28em] ${eyebrowClass}`}>Operations Note</p>
              </div>
              <h2 className={`font-headline text-3xl font-black tracking-tight leading-tight ${textHeadingClass}`}>{footerTitle}</h2>
              <p className={`mt-3 text-sm leading-7 max-w-xl ${textMutedClass}`}>{footerText}</p>
            </div>
            <div className="relative z-10 shrink-0 flex items-center gap-4">
               <div className={`flex h-20 w-20 items-center justify-center rounded-[24px] border backdrop-blur-xl ${
                 isLight
                   ? 'border-[#005c30]/30 bg-[linear-gradient(135deg,rgba(0,92,48,0.12),rgba(0,92,48,0.04))] shadow-[0_0_30px_rgba(0,92,48,0.15)]'
                   : 'border-primary/30 bg-[linear-gradient(135deg,rgba(0,255,163,0.15),rgba(0,255,163,0.05))] shadow-[0_0_40px_rgba(0,255,163,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
               }`}>
                  <span className={`material-symbols-outlined text-4xl ${eyebrowClass}`}>task_alt</span>
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
    icon="rule"
    title="FMCSA Guidelines"
    description="Core assumptions and routing constraints applied to the trip generation logic."
    heroBadge="Assessment Rules"
    visual={<GuidelinesVisual />}
    summary={[
      { label: 'Driver Type', value: 'Property', detail: 'Applying standard property-carrying rules.' },
      { label: 'HOS Cycle', value: '70h/8d', detail: 'Operating on a 70-hour/8-day cycle.' },
      { label: 'Conditions', value: 'Normal', detail: 'Assuming no adverse driving conditions.' },
    ]}
    sections={[
      {
        eyebrow: 'Operations',
        title: 'Duty actions',
        description: 'Standard time allocations for required shipping activities.',
        bullets: [
          'Allocate exactly 1 hour for pickup activities.',
          'Allocate exactly 1 hour for drop-off activities.',
        ],
        statLabel: 'Duration',
        statValue: '1 Hr',
      },
      {
        eyebrow: 'Maintenance',
        title: 'Fueling intervals',
        description: 'Enforcing maximum distance between required fuel stops.',
        bullets: [
          'Must schedule fueling at least once every 1,000 miles.',
          'Fuel stops must be integrated into the duty cycle.',
        ],
        statLabel: 'Max Range',
        statValue: '1k mi',
      },
      {
        eyebrow: 'Exceptions',
        title: 'Driving conditions',
        description: 'Handling edge cases and environmental variables.',
        bullets: [
          'Assume no adverse driving conditions are present.',
          'Operating under standard visibility and weather assumptions.',
        ],
        statLabel: 'Adverse',
        statValue: 'None',
      },
    ]}
    footerTitle="Constraint-based routing"
    footerText="These rules form the foundation of the automated ELD log generation and route planning."
  />
)

export const ManualPage = () => (
  <ContentShowcasePage
    icon="menu_book"
    title="Assessment Manual"
    description="Instructions on how to use the full-stack route and ELD log generator."
    heroBadge="App Instructions"
    visual={<ManualVisual />}
    summary={[
      { label: 'Inputs', value: '4 Fields', detail: 'Current location, pickup, dropoff, and cycle hours.' },
      { label: 'Outputs', value: 'Map & Logs', detail: 'Map with stops and drawn ELD log sheets.' },
      { label: 'Tech Stack', value: 'React/Django', detail: 'Built with React frontend and Django backend.' },
    ]}
    sections={[
      {
        eyebrow: 'Step 1',
        title: 'Enter Inputs',
        description: 'Provide the required trip details to begin generation.',
        bullets: [
          'Current Location, Pickup Location, and Dropoff Location.',
          'Current Cycle Used (Hrs).',
        ],
        statLabel: 'Fields',
        statValue: '04',
      },
      {
        eyebrow: 'Step 2',
        title: 'Review Route',
        description: 'The app queries a free map API to generate pathing.',
        bullets: [
          'View the map showing the generated route.',
          'Check information regarding stops and rests directly on the map.',
        ],
        statLabel: 'Map API',
        statValue: 'Used',
      },
      {
        eyebrow: 'Step 3',
        title: 'Check ELD Logs',
        description: 'The system automatically draws on the blank log template.',
        bullets: [
          'Daily Log Sheets are filled out dynamically.',
          'Multiple log sheets are generated for longer multi-day trips.',
        ],
        statLabel: 'Logs',
        statValue: 'Drawn',
      },
    ]}
    footerTitle="End-to-end automation"
    footerText="From 4 simple inputs to a fully compliant visualized route with drawn logbook pages."
  />
)

export const AboutPage = () => (
  <ContentShowcasePage
    icon="info"
    title="Assessment Details"
    description="Project deliverables, grading criteria, and tech stack details for the full-stack developer assessment."
    heroBadge="Project Deliverables"
    visual={<AboutVisual />}
    summary={[
      { label: 'Reward', value: '$100', detail: 'Bounty for successful completion.' },
      { label: 'Hosting', value: 'Live', detail: 'Deployed to Vercel or similar platform.' },
      { label: 'Accuracy', value: 'Tested', detail: 'Outputs are verified to standards.' },
    ]}
    sections={[
      {
        eyebrow: 'Submission',
        title: 'Code & Demo',
        description: 'Requirements for handing off the completed assessment.',
        bullets: [
          'Share the GitHub code repository.',
          'Create a 3-5 minute Loom video going over the app and code.',
        ],
        statLabel: 'Loom',
        statValue: '3-5m',
      },
      {
        eyebrow: 'Design',
        title: 'UI and UX',
        description: 'Aesthetics matter significantly for this project.',
        bullets: [
          'UI and UX must be good. Pay attention to good design.',
          'Great aesthetics can compensate for some inaccuracies in output.',
        ],
        statLabel: 'Quality',
        statValue: 'High',
      },
      {
        eyebrow: 'Stack',
        title: 'Core Technologies',
        description: 'The foundation of the assessment application.',
        bullets: [
          'Frontend built using React.',
          'Backend built using Django infrastructure.',
        ],
        statLabel: 'Stack',
        statValue: 'Modern',
      },
    ]}
    footerTitle="Assessment Evaluation"
    footerText="We will test the hosted version for accuracy and the accuracy must be up to standards."
  />
)
