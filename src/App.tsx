import { Routes, Route, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import TripPlanner from '@/pages/HomePage'
import { TripResults } from '@/features/trips/TripResults'
import { GlobalBackground } from '@/components/GlobalBackground'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AboutPage, GuidelinesPage, ManualPage, ContactPage } from '@/pages/InfoPages'
import TripHistoryPage from '@/pages/TripHistoryPage'

const NAV_ITEMS = [
  { to: '/', icon: 'map', label: 'Routes' },
  { to: '/trips', icon: 'history', label: 'History' },
  { to: '/guidelines', icon: 'local_shipping', label: 'Guidelines' },
  { to: '/manual', icon: 'menu_book', label: 'Manual' },
  { to: '/about', icon: 'info', label: 'About Us' },
  { to: '/contact', icon: 'mail', label: 'Contact Us' },
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

  return (
    <>
      <GlobalBackground variant={backgroundVariant} />
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-outline-variant/20 bg-surface/95 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md dark:bg-[#0E0E0E]/96">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest ring-1 ring-white/10">
              <VanguardLogo />
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-xl font-black uppercase tracking-tighter text-primary">Vanguard</span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-on-surface-variant sm:block">Route planning cockpit</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-2 py-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-[0_0_18px_rgba(0,255,163,0.22)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-outline-variant/30 bg-surface-container-low px-1 py-1">
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
            path="/guidelines"
            element={
              <PageTransition>
                <GuidelinesPage />
              </PageTransition>
            }
          />
          <Route
            path="/manual"
            element={
              <PageTransition>
                <ManualPage />
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
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
