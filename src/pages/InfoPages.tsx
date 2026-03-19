import { 
  Scale, 
  MapIcon, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Truck,
  BookOpen,
  Monitor,
  Send,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users
} from 'lucide-react'
import { useEffect, useRef, useState, FormEvent } from 'react'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

// ----------------------------------------------------------------------
// 0. VISUAL ANIMATIONS (GSAP)
// ----------------------------------------------------------------------

const AnimatedVisualWrapper = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative flex w-full flex-col overflow-hidden rounded-[28px] border border-outline-variant/20 bg-gradient-to-b from-surface-container-low/80 to-surface-container-lowest/30 shadow-[0_18px_40px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-3xl ${className}`}>
    {children}
  </div>
)

const GuidelinesVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('[data-radar]', { rotate: 360, duration: 4, repeat: -1, ease: 'none', transformOrigin: 'center center' })
        gsap.to('[data-node]', { scale: 1.5, opacity: 0.8, duration: 1.5, repeat: -1, yoyo: true, stagger: 0.15, ease: 'sine.inOut', transformOrigin: 'center center' })
        gsap.fromTo('[data-hist-bar]', { scaleY: 0.1, opacity: 0.3 }, { scaleY: (_index, target) => Number((target as HTMLElement).dataset.value ?? 1), opacity: 1, duration: 1.6, stagger: 0.1, ease: 'back.out(1.2)', transformOrigin: 'bottom center' })
        gsap.to('[data-metric-rail]', { backgroundPositionX: '160%', duration: 4, repeat: -1, ease: 'none', stagger: 0.2 })
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      {/* Widget 1: Radar */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Compliance Metrics</p>
        <div className="relative h-32 w-full overflow-hidden rounded-[16px] bg-black/10">
           <div data-radar className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(34,211,238,0.1) 90%, rgba(34,211,238,0.4) 100%)' }} />
           <svg viewBox="0 0 360 180" className="relative z-10 h-full w-full">
            {[ [26, 38], [152, 88], [252, 42], [338, 64], [30, 146], [176, 98], [344, 98] ].map(([cx, cy], index) => (
              <g key={index}>
                <path d={index % 2 === 0 ? `M${cx} ${cy} L176 98` : `M${cx} ${cy} L152 88`} stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.2" />
                <circle data-node cx={cx} cy={cy} r="6" fill="rgba(34,211,238,0.3)" />
                <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
              </g>
            ))}
           </svg>
        </div>
      </AnimatedVisualWrapper>
      
      {/* Widget 2: Lane Density Histogram */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Lane Density</p>
        <div className="relative flex h-24 items-end gap-2 border-b border-primary-ui-border-muted pb-2 px-2">
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8].map((val, i) => (
            <div data-hist-bar data-value={val} key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary/10 to-primary/80" style={{ height: '10%' }} />
          ))}
        </div>
      </AnimatedVisualWrapper>

      {/* Widget 3: Progress Rails */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Stop Distribution</p>
        <div className="space-y-4">
          {[
            ['Break', '82%'],
            ['Fuel', '67%'],
            ['Parking', '74%'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-on-surface-variant">
                <span>{label}</span>
                <span className="text-on-surface">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div
                  data-metric-rail
                  className="h-full rounded-full bg-[length:200%_100%] bg-[linear-gradient(90deg,rgba(34,211,238,0.2),rgba(34,211,238,0.9),rgba(34,211,238,0.2))] shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                  style={{ width: value }}
                />
              </div>
            </div>
          ))}
        </div>
      </AnimatedVisualWrapper>
    </div>
  )
}

const ManualVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!rootRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('[data-ring]', { rotate: 360, duration: 20, repeat: -1, ease: 'none', transformOrigin: 'center center' })
        gsap.fromTo('[data-pulse]', { scale: 0.8, opacity: 1 }, { scale: 2, opacity: 0, duration: 2, repeat: -1, ease: 'power2.out', transformOrigin: 'center center' })
        gsap.to('[data-tilt]', { rotateX: 6, rotateY: -6, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('[data-progress-fill]', { width: (_index, target) => (target as HTMLElement).dataset.width ?? '70%', duration: 1.5, stagger: 0.2, ease: 'power3.out' })
        gsap.fromTo('[data-step-bar]', { scaleX: 0, transformOrigin: 'left center' }, { scaleX: (_index, target) => Number((target as HTMLElement).dataset.scale ?? 1), duration: 1.4, stagger: 0.15, ease: 'power3.out' })
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} className="flex flex-col gap-6 perspective-1000">
      {/* Widget 1: Routing Engine */}
      <AnimatedVisualWrapper className="p-6 text-center">
        <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Routing Engine</p>
        <div data-tilt className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-primary-ui-border-muted bg-surface/50 shadow-lg preserve-3d">
           <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
              <circle data-ring cx="100" cy="100" r="80" fill="none" stroke="currentColor" className="text-primary/30" strokeWidth="2" strokeDasharray="4 8" />
              <circle data-ring cx="100" cy="100" r="60" fill="none" stroke="currentColor" className="text-cyan-400/30" strokeWidth="1" strokeDasharray="12 4" />
              <circle data-pulse cx="100" cy="100" r="30" fill="none" stroke="#22D3EE" strokeWidth="2" />
              <circle cx="100" cy="100" r="15" fill="#00FFA3" className="shadow-[0_0_20px_#00FFA3]" />
           </svg>
        </div>
      </AnimatedVisualWrapper>

      {/* Widget 2: Workflow Steps */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">Workflow Stack</p>
        <div className="space-y-4">
          {[
            ['Trip points', '0.92'],
            ['Route review', '0.84'],
            ['Log check', '0.76'],
            ['Export', '0.62'],
          ].map(([title, scale], index) => (
            <div key={title} className="relative flex items-center gap-4 rounded-xl bg-black/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-xs font-black text-primary shadow-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface">{title}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/10">
                  <div data-step-bar data-scale={scale} className="h-full w-full bg-gradient-to-r from-cyan-400 to-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedVisualWrapper>
    </div>
  )
}

const AboutVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!rootRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('[data-float]', { y: -15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.2 })
        gsap.to('[data-orbit-shell]', { rotate: 360, transformOrigin: 'center center', duration: 15, repeat: -1, ease: 'none' })
        gsap.fromTo('[data-ring-progress]', { strokeDashoffset: 260, opacity: 0 }, { strokeDashoffset: (_i, target) => (target as SVGCircleElement).dataset.offset ?? '90', opacity: 1, duration: 2, stagger: 0.2, ease: 'back.out(1.2)' })
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={rootRef} className="flex flex-col gap-6">
      {/* Widget 1: Product Orbit */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Product Orbit</p>
        <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-[20px] bg-black/10">
          <svg viewBox="0 0 220 220" className="h-48 w-48">
            <g data-orbit-shell>
              <circle cx="110" cy="110" r="74" fill="none" stroke="currentColor" className="text-on-surface-variant/20" strokeWidth="1.5" strokeDasharray="4 16" />
              <circle cx="110" cy="110" r="96" fill="none" stroke="currentColor" className="text-cyan-400/20" strokeWidth="1.5" strokeDasharray="2 12" />
            </g>
            <circle cx="110" cy="110" r="30" fill="none" stroke="#00FFA3" strokeWidth="2" className="animate-pulse" />
            <circle cx="110" cy="110" r="22" fill="#00FFA3" opacity="0.9" />
          </svg>
        </div>
      </AnimatedVisualWrapper>

      {/* Widget 2: Performance Circular Metrics */}
      <AnimatedVisualWrapper className="p-6">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">Performance Metrics</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Clarity', '88', '#00FFA3'],
            ['Compliance', '74', '#22D3EE'],
            ['UX', '81', '#00FFA3'],
          ].map(([label, offset, color]) => (
            <div key={label} className="flex flex-col items-center">
              <svg viewBox="0 0 120 120" className="h-16 w-16 drop-shadow-[0_0_4px_rgba(0,255,163,0.15)]">
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" className="text-black/5" strokeWidth="10" />
                <circle
                  data-ring-progress
                  data-offset={offset}
                  cx="60"
                  cy="60"
                  r="42"
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="66" textAnchor="middle" fill="currentColor" className="fill-on-surface font-sans text-[20px] font-black">{offset}%</text>
              </svg>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-on-surface">{label}</p>
            </div>
          ))}
        </div>
      </AnimatedVisualWrapper>
      
      {/* Widget 3: Stats */}
      <div className="flex flex-col gap-3">
         {[
           { label: 'Global Reach', val: '98%', color: '#00FFA3' },
           { label: 'Uptime', val: '99.9%', color: '#22D3EE' },
         ].map((item, i) => (
           <div data-float key={i} className="flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-4 shadow-sm backdrop-blur-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">{item.label}</span>
              <span className="text-xl font-black" style={{ color: item.color }}>{item.val}</span>
           </div>
         ))}
      </div>
    </div>
  )
}

const ContactVisual = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!rootRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.to('[data-mail-pulse]', { scale: 1.1, opacity: 0.8, duration: 1, repeat: -1, yoyo: true, ease: 'power1.inOut' })
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <AnimatedVisualWrapper className="min-h-[300px] h-full items-center justify-center text-center">
      <div ref={rootRef} className="p-6 flex flex-col items-center">
         <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
            <div className="absolute inset-0 rounded-full border border-primary-ui-border-muted" />
            <div data-mail-pulse className="absolute inset-2 rounded-full border border-cyan-400/30" />
            <Mail className="h-12 w-12 text-primary" />
         </div>
         <p className="max-w-[200px] text-sm font-medium text-slate-800 dark:text-on-surface">Rapid response routing specialists standing by 24/7.</p>
      </div>
    </AnimatedVisualWrapper>
  )
}

// ----------------------------------------------------------------------
// 1. SHARED LAYOUT
// ----------------------------------------------------------------------

import { Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.15, 
      delayChildren: 0.1,
      when: "beforeChildren"
    }
  }
}

const itemVariants: Variants = {
  hidden: { y: 24, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 24,
      staggerChildren: 0.1 // This will trigger internal card staggering
    } 
  }
}

const childVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
}

const InfoPageLayout = ({ 
  title, 
  subtitle, 
  eyebrow, 
  visual,
  children,
  fillViewport = false
}: { 
  title: string
  subtitle: string
  eyebrow: string
  visual?: React.ReactNode
  children: React.ReactNode 
  fillViewport?: boolean
}) => {
  const layoutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!layoutRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // Minimal, slow Ambient Neon Orbs
        gsap.to('[data-ambient-orb]', { scale: 1.1, opacity: 0.6, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        gsap.to('[data-ambient-orb-alt]', { scale: 1.05, opacity: 0.7, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 })
        
        // Minimal, slow Neon Border Spinners
        gsap.to('[data-neon-border]', { rotate: 360, duration: 8, repeat: -1, ease: 'none', transformOrigin: 'center center' })
        gsap.to('[data-neon-border-rev]', { rotate: -360, duration: 10, repeat: -1, ease: 'none', transformOrigin: 'center center' })
        
        // Minimal Neon Breathing Shadows
        gsap.to('[data-neon-badge]', { boxShadow: '0 0 15px rgba(0,255,163,0.3)', duration: 4, repeat: -1, yoyo: true, ease: 'power1.inOut' })
        
        // Glow Pulse and Glass Shimmer Continuous Animations
        gsap.to('[data-glow-pulse]', { opacity: 0.6, scale: 1.05, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.4 })
        gsap.fromTo('[data-glass-shimmer]', 
          { x: '-100%' },
          { x: '200%', duration: 5, repeat: -1, ease: 'power2.inOut', stagger: 1.5 }
        )
      }, layoutRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={layoutRef} className={`relative z-10 ${fillViewport ? 'h-[calc(100vh-80px)] overflow-hidden' : ''} min-h-screen px-4 pb-12 pt-24 sm:px-6 lg:px-8`}>
      {/* Ambient Background Orbs */}
      <div data-ambient-orb className="pointer-events-none absolute -left-64 top-[10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[150px]" />
      <div data-ambient-orb-alt className="pointer-events-none absolute -right-64 top-[40%] h-[700px] w-[700px] rounded-full bg-cyan-400/10 blur-[150px]" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`mx-auto flex max-w-6xl flex-col ${fillViewport ? 'h-full gap-4' : 'gap-6'}`}
      >
        {/* Live Network Ticker */}
        <div className="flex h-8 items-center gap-6 overflow-hidden rounded-full border border-primary-ui-border-muted bg-surface/50 px-4 backdrop-blur-md">
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,163,1)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">System Live</span>
          </div>
          <div className="flex gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap pt-0.5">
            {[
              "Network Load: 12% • Latency: 4ms • Node-7: Active",
              "Protocol v4.2 Deployment: Complete • 1,204 Drivers Online",
              "Route Compute Precision: 99.98% • HOS Engine: Synchronized",
              "Secure Data Stream: Encrypted • API Gateway: Normal"
            ].map((msg, idx) => (
              <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-primary">{msg}</span>
            ))}
          </div>
        </div>
        
        {/* Header Section */}
        <motion.section variants={itemVariants} className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-gradient-to-b from-surface/90 to-surface/50 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-3xl sm:p-10">
          <div data-ambient-orb className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
          <div className="relative z-10">
            <p className="text-[12px] font-black uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
            <div className="mt-4">
              <h1 className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-800 dark:text-on-surface sm:text-xl">
                {subtitle}
              </p>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main Content Column */}
          <div className="flex flex-col gap-6">
            {children}
          </div>

          {/* Sticky Visual / Sidebar Column */}
          {visual && (
            <motion.div variants={itemVariants} className="hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-28 lg:h-max">
              {visual}
            </motion.div>
          )}
          {visual && (
            <motion.div variants={itemVariants} className="block lg:hidden">
              {visual}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

const InfoSection = ({ 
  title, 
  description, 
  icon: Icon,
  items,
  cardStyle = 'neon-sweep'
}: { 
  title: string
  description: string
  icon: React.ElementType
  items: string[]
  cardStyle?: 'neon-sweep' | 'glow-pulse' | 'glass-shimmer'
}) => {
  const renderCardEffect = () => {
    switch (cardStyle) {
      case 'neon-sweep':
        return (
          <>
            <div data-neon-border className="absolute left-1/2 top-1/2 h-[250%] w-[250%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_60%,#00c982_100%)] dark:bg-[conic-gradient(from_0deg,transparent_60%,#00FFA3_100%)] opacity-80 dark:opacity-70" />
            <div data-neon-border-rev className="absolute left-1/2 top-1/2 h-[250%] w-[250%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_180deg,transparent_60%,#0891b2_100%)] dark:bg-[conic-gradient(from_180deg,transparent_60%,#22D3EE_100%)] opacity-80 dark:opacity-70" />
          </>
        )
      case 'glow-pulse':
        return (
          <>
            <div data-glow-pulse className="absolute inset-0 bg-[#00FFA3]/40 dark:bg-[#00FFA3]/50 blur-[15px] opacity-100" />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent animate-[pulse_2s_infinite]" />
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent animate-[pulse_2s_infinite_1s]" />
          </>
        )
      case 'glass-shimmer':
        return <div data-glass-shimmer className="pointer-events-none absolute -inset-y-[50%] -left-full z-0 w-[150%] rotate-[30deg] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />
      default:
        return null
    }
  }

  return (
    <motion.section variants={itemVariants} className="relative overflow-hidden rounded-[32px] p-[2px] shadow-[0_24px_60px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-3xl sm:p-8 transition-shadow duration-[1500ms]">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface/90 to-surface/40" />
      
      <div className="relative z-10 flex items-start gap-5">
        <div data-neon-badge className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary-ui-border-muted bg-gradient-to-br from-primary/10 to-cyan-400/10 text-primary transition-transform duration-[1500ms]">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-on-surface">{title}</h2>
          <p className="mt-1.5 text-base leading-relaxed text-slate-700 dark:text-on-surface">{description}</p>
        </div>
      </div>
      
      <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.div 
            key={i}
            variants={childVariants}
            className="relative flex min-h-[110px] flex-col justify-center overflow-hidden rounded-[24px] p-[2px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-[1000ms]"
          >
            {renderCardEffect()}
            
            <div className="z-10 relative flex h-full w-full items-start gap-4 rounded-[22px] bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-3xl p-5 transition-colors duration-[1000ms]">
               <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#00FFA3] transition-all duration-[1000ms]" />
               <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">{item}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

// ----------------------------------------------------------------------
// 2. GUIDELINES PAGE
// ----------------------------------------------------------------------
export const GuidelinesPage = () => {
  return (
    <InfoPageLayout
      eyebrow="Safety First"
      title="Company Guidelines"
      subtitle="At Vanguard, we prioritize driver safety and strict adherence to FMCSA laws for modern freight logistics."
      visual={<GuidelinesVisual />}
    >
      <InfoSection
        icon={Scale}
        title="Driver Wellness & Compliance"
        description="Our core operational mandate for fleet safety."
        cardStyle="glow-pulse"
        items={[
          "We enforce strict 70-hour / 8-day operational cycle limits.",
          "Drivers are monitored for safe property-carrying hours.",
        ]}
      />
      <InfoSection
        icon={Truck}
        title="Fleet Maintenance Protocols"
        description="Keeping our rigs running efficiently and safely."
        cardStyle="glow-pulse"
        items={[
          "Required mandatory fueling checks at least every 1,000 miles.",
          "Preventative maintenance reports integrated into the ELD workflow.",
          "Pre-trip walkaround inspections mandated before engine turn-over.",
        ]}
      />
      <InfoSection
        icon={AlertCircle}
        title="Unforeseen Disruptions"
        description="Handling adverse conditions intelligently."
        cardStyle="glow-pulse"
        items={[
          "Our system flags potential severe weather for proactive rerouting.",
          "Real-time alerts for dispatch regarding load condition exceptions.",
        ]}
      />
    </InfoPageLayout>
  )
}

// ----------------------------------------------------------------------
// 3. MANUAL / WORKFLOW PAGE
// ----------------------------------------------------------------------
export const ManualPage = () => {
  return (
    <InfoPageLayout
      eyebrow="Workflow Operations"
      title="How We Route"
      subtitle="Discover how Vanguard seamlessly takes a single dispatch request and turns it into a fully compliant, precision-timed haul."
      visual={<ManualVisual />}
    >
      <InfoSection
        icon={Monitor}
        title="1. Order Parameterization"
        description="Digitizing the freight request."
        cardStyle="neon-sweep"
        items={[
          "Our dispatchers input origin, destination, and payload requirements.",
          "Current driver operational cycles are cross-referenced.",
        ]}
      />
      <InfoSection
        icon={MapIcon}
        title="2. Millisecond Computations"
        description="Crunching the optimal geospatial pathing."
        cardStyle="neon-sweep"
        items={[
          "We leverage advanced map APIs to discover the fastest and safest routes.",
          "Stops for fuel, rest, and sleep are automatically calculated along the graph.",
        ]}
      />
      <InfoSection
        icon={FileText}
        title="3. Automated Compliance Logging"
        description="Our technology draws the logs so you don't have to."
        cardStyle="neon-sweep"
        items={[
          "Vanguard digitally traces perfectly compliant timelines onto ELD templates.",
          "Multi-day routes generate sequential pagination natively.",
        ]}
      />
    </InfoPageLayout>
  )
}

// ----------------------------------------------------------------------
// 4. ABOUT PAGE
// ----------------------------------------------------------------------
export const AboutPage = () => {
  return (
    <InfoPageLayout
      eyebrow="Who We Are"
      title="About Vanguard"
      subtitle="We build next-generation freight routing systems combining real-time telematics with automated law-compliant logging."
      visual={<AboutVisual />}
    >
      <InfoSection
        icon={Globe}
        title="Our Mission"
        description="What drives our innovation."
        cardStyle="glass-shimmer"
        items={[
          "We engineer the most advanced logistics software in the transportation sector.",
          "Bridging the gap between messy interstate law and clean, intelligent software.",
          "Empowering drivers with tools that prevent fatigue and prioritize health.",
        ]}
      />
      <InfoSection
        icon={Users}
        title="Our Capabilities"
        description="We handle the heavy lifting of modern logistics."
        cardStyle="glass-shimmer"
        items={[
          "Deploying highly resilient, globally distributed systems via React and Django.",
          "Producing high-aesthetic interfaces that keep dispatchers focused and efficient.",
        ]}
      />
    </InfoPageLayout>
  )
}

// ----------------------------------------------------------------------
// 5. CONTACT PAGE
// ----------------------------------------------------------------------
export const ContactPage = () => {
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setStatus('Message sent successfully! A dispatcher will reach out shortly.')
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <InfoPageLayout
      eyebrow="Connect With Us"
      title="Contact Vanguard"
      subtitle="Have questions? Drop us a line."
      visual={<ContactVisual />}
      fillViewport={true}
    >
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-[32px] border border-outline-variant/20 bg-gradient-to-b from-surface/90 to-surface/50 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-3xl sm:p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
           <motion.div variants={childVariants} className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/10 bg-gradient-to-b from-surface-container-low/50 to-surface-container-low/10 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-transform">
              <div data-neon-border className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_60%,#00FFA3_100%)] opacity-20" />
              <div className="relative z-10 flex flex-col items-center">
                <Phone className="mb-2 h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                <p className="text-xs font-bold text-on-surface">1-800-VANGUARD</p>
              </div>
           </motion.div>
           <motion.div variants={childVariants} className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/10 bg-gradient-to-b from-surface-container-low/50 to-surface-container-low/10 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-transform">
              <div data-neon-border-rev className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_60%,#22D3EE_100%)] opacity-20" />
              <div className="relative z-10 flex flex-col items-center">
                <Mail className="mb-2 h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <p className="text-xs font-bold text-on-surface">ops@vanguard.io</p>
              </div>
           </motion.div>
           <motion.div variants={childVariants} className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/10 bg-gradient-to-b from-surface-container-low/50 to-surface-container-low/10 p-4 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-transform">
              <div data-neon-border className="absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_180deg,transparent_60%,#00FFA3_100%)] opacity-20" />
              <div className="relative z-10 flex flex-col items-center">
                <MapPin className="mb-2 h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                <p className="text-xs font-bold text-on-surface">Chicago HQ</p>
              </div>
           </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {status && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">
              <CheckCircle2 className="h-5 w-5" />
              {status}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Full Name</label>
              <input required type="text" className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary-ui-border-focus" placeholder="Jane Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Email</label>
              <input required type="email" className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary-ui-border-focus" placeholder="jane@company.com" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Message</label>
            <textarea required rows={3} className="resize-none rounded-xl border border-outline-variant/30 bg-surface-container-low p-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary-ui-border-focus" placeholder="How can we help?" />
          </div>
          <button type="submit" className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_15px_rgba(0,255,163,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(0,255,163,0.5)]">
            <Send className="h-4 w-4" />
            Send Transmission
          </button>
        </form>
      </motion.section>
    </InfoPageLayout>
  )
}
