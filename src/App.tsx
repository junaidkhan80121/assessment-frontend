import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import TripPlanner from '@/pages/HomePage'
import { TripResults } from '@/features/trips/TripResults'
import { GlobalBackground } from '@/components/GlobalBackground'
import { ThemeToggle } from '@/components/ThemeToggle'
import TripHistoryPage from '@/pages/TripHistoryPage'
import { AboutPage, ContactPage } from '@/pages/InfoPages'
import NotFoundPage from '@/pages/NotFoundPage'
import { History as HistoryIcon, Info as InfoIcon, Map as MapIcon, Mail as MailIcon } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: MapIcon, label: 'Planner' },
  { to: '/trips', icon: HistoryIcon, label: 'History' },
  { to: '/about', icon: InfoIcon, label: 'About Us' },
  { to: '/contact', icon: MailIcon, label: 'Contact' },
]

function VanguardLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-11 w-11"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vanguard-logo-accent" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="13.5"
        className="fill-slate-900 dark:fill-slate-100"
        opacity="0.94"
      />
      <path
        d="M10.5 12.5L24 37.5L37.5 12.5"
        stroke="url(#vanguard-logo-accent)"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 24H30.5"
        className="stroke-slate-100 dark:stroke-slate-900"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="8.5" r="2.8" fill="#34D399" />
    </svg>
  )
}

function Layout({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const backgroundVariant = pathname.startsWith('/trip/') ? 'static' : 'interactive'
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return
    const targetId = location.hash.replace('#', '')
    const target = document.getElementById(targetId)
    if (!target) return
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [location.pathname, location.hash])

  return (
    <>
      <GlobalBackground variant={backgroundVariant} />
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-300/80 bg-surface/95 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md dark:border-outline-variant/20 dark:bg-[#0E0E0E]/96">
        <div className="relative flex h-20 w-full items-center justify-between px-1 sm:px-3 lg:px-4">
          <div className="z-10 shrink-0">
            <Link to="/" className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest ring-1 ring-slate-300/70 dark:ring-white/10">
                <VanguardLogo />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="font-headline text-xl font-black uppercase tracking-tighter text-primary">Vanguard</span>
                <span className="hidden text-[10px] uppercase tracking-[0.22em] text-on-surface-variant lg:block">Route planning cockpit</span>
              </div>
            </Link>
          </div>
          <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 justify-center px-16 sm:px-28 lg:px-40">
            <nav className="flex max-w-full items-center gap-2 overflow-x-auto rounded-full border border-slate-300/80 bg-surface-container-low px-2 py-2 fancy-scrollbar dark:border-outline-variant/30">
              {NAV_ITEMS.map((item) => {
                const isActive = item.to.startsWith('/#')
                  ? location.pathname === '/' && location.hash === item.to.slice(1)
                  : location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-[0_0_18px_rgba(0,255,163,0.22)]'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="z-10 flex shrink-0 items-center gap-2">
            <div className="rounded-full border border-slate-300/80 bg-surface-container-low px-1 py-1 dark:border-outline-variant/30">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      {children}
    </>
  )
}

function App() {
  const location = useLocation()

  return (
    <Layout pathname={location.pathname}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <TripPlanner />
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <AboutPage />
              </PageTransition>
            }
          />
          <Route
            path="/contact"
            element={
              <PageTransition>
                <ContactPage />
              </PageTransition>
            }
          />
          <Route
            path="/trip/:tripId"
            element={
              <PageTransition>
                <TripResults />
              </PageTransition>
            }
          />
          <Route
            path="/trips"
            element={
              <PageTransition>
                <TripHistoryPage />
              </PageTransition>
            }
          />
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
