import { Routes, Route, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import TripPlanner from '@/pages/HomePage'
import { TripResults } from '@/features/trips/TripResults'
import { GlobalBackground } from '@/components/GlobalBackground'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { to: '/', icon: 'map', label: 'Routes' },
  { to: '/guidelines', icon: 'local_shipping', label: 'Guidelines' },
  { to: '/manual', icon: 'menu_book', label: 'Manual' },
  { to: '/about', icon: 'info', label: 'About Us' },
]

function Layout({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const backgroundVariant = pathname.startsWith('/trip/') ? 'static' : 'interactive'

  return (
    <>
      <GlobalBackground variant={backgroundVariant} />
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-outline-variant/20 bg-surface/95 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-md dark:bg-[#0E0E0E]/96">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest ring-1 ring-white/10">
              <img alt="Vanguard Logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtH--9Krht0fw-kBOUshybtzQSBzfz6rieEWtoMG40pzDb13CGoBujS2vRhbU0FA-t8tpQN246XWm9ouZ_VwtnvwyiDmIHRYzvDk-UE1DgumGkJkyo8FeFSImac8lySbhQsD5Ei7TK2UdVVJ5EJY4LNIP9ni6_Ttwn9EoAret3wRxGt1GUR-kTqQ8lCPE1iMCGedGRovHAvDdLdDe1ytSsm0fls_tMI3k1NFUsbbvimeftQY81iFKcfcLv2y59j1Rs3YNSMQSVyhbq" />
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
            path="/guidelines"
            element={
              <PageTransition>
                <div className="min-h-screen px-6 pb-32 pt-32">
                  <div className="mx-auto max-w-4xl rounded-[32px] border border-outline-variant/30 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl">
                    <span className="material-symbols-outlined mb-4 text-5xl text-primary-container">local_shipping</span>
                    <h1 className="font-headline text-4xl font-black tracking-tight">Trucker Guidelines</h1>
                    <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">Reference notes for safe trip planning, pre-trip checks, rest break timing, fuel discipline, and FMCSA-friendly route habits.</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {[
                        'Pre-trip inspection checklist before departure',
                        'Preferred fuel-stop spacing for long-haul runs',
                        '8-hour break reminders and reset planning',
                        'Weather and mountain-grade caution reminders',
                      ].map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-on-surface-variant">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </PageTransition>
            }
          />
          <Route
            path="/manual"
            element={
              <PageTransition>
                <div className="min-h-screen px-6 pb-32 pt-32">
                  <div className="mx-auto max-w-4xl rounded-[32px] border border-outline-variant/30 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl">
                    <span className="material-symbols-outlined mb-4 text-5xl text-primary-container">menu_book</span>
                    <h1 className="font-headline text-4xl font-black tracking-tight">Driver Manual</h1>
                    <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">A quick-access manual for using route plans, understanding trip logs, reviewing route alternatives, and exporting paperwork.</p>
                    <div className="mt-8 space-y-4">
                      {[
                        'How to choose between fastest and alternative routes',
                        'What each route marker and stop type means',
                        'How daily log sheets map to trip events',
                        'How to export the selected day log as PDF',
                      ].map((item, index) => (
                        <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{index + 1}</div>
                          <div className="text-sm text-on-surface-variant">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PageTransition>
            }
          />
          <Route
            path="/about"
            element={
              <PageTransition>
                <div className="min-h-screen px-6 pb-32 pt-32">
                  <div className="mx-auto max-w-4xl rounded-[32px] border border-outline-variant/30 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl">
                    <span className="material-symbols-outlined mb-4 text-5xl text-primary-container">info</span>
                    <h1 className="font-headline text-4xl font-black tracking-tight">About Us</h1>
                    <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">Vanguard is a concept logistics cockpit focused on route clarity, driver-friendly trip planning, and better visibility into HOS-safe journeys.</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {[
                        ['Mission', 'Reduce planning friction for long-haul drivers and dispatchers.'],
                        ['Product', 'Surface route options, log sheets, and trip events in one place.'],
                        ['Approach', 'Blend map clarity, compliance awareness, and simple driver workflows.'],
                      ].map(([title, description]) => (
                        <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{title}</h2>
                          <p className="mt-3 text-sm text-on-surface-variant">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default App
