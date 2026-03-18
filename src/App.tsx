import { Routes, Route, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { PageTransition } from '@/components/PageTransition'
import TripPlanner from '@/pages/HomePage'
import { TripResults } from '@/features/trips/TripResults'
import { GlobalBackground } from '@/components/GlobalBackground'
import { TypewriterText } from '@/components/TypewriterText'

const NAV_ITEMS = [
  { to: '/', icon: 'map', label: 'Routes' },
  { to: '/fleet', icon: 'analytics', label: 'Fleet' },
  { to: '/compliance', icon: 'assignment_late', label: 'Compliance' },
  { to: '/profile', icon: 'person', label: 'Profile' },
]

function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <>
      <GlobalBackground />
      <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-outline-variant/15 bg-background/75 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest ring-1 ring-white/10">
            <img alt="User Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtH--9Krht0fw-kBOUshybtzQSBzfz6rieEWtoMG40pzDb13CGoBujS2vRhbU0FA-t8tpQN246XWm9ouZ_VwtnvwyiDmIHRYzvDk-UE1DgumGkJkyo8FeFSImac8lySbhQsD5Ei7TK2UdVVJ5EJY4LNIP9ni6_Ttwn9EoAret3wRxGt1GUR-kTqQ8lCPE1iMCGedGRovHAvDdLdDe1ytSsm0fls_tMI3k1NFUsbbvimeftQY81iFKcfcLv2y59j1Rs3YNSMQSVyhbq" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-primary uppercase font-headline">Vanguard</span>
            <span className="hidden text-[11px] uppercase tracking-[0.22em] text-on-surface-variant sm:block">
              <TypewriterText text="Live dispatch orchestration" speed={28} />
            </span>
          </div>
        </div>
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="rounded-full border border-white/10 bg-surface-container-low px-4 py-2 text-on-surface transition-all hover:scale-[1.02] hover:text-primary"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </header>
      
      {children}

      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-6">
        <div className="pointer-events-auto mx-6 flex h-20 w-full max-w-2xl items-center justify-between rounded-[28px] border border-outline-variant/30 bg-surface/82 px-3 shadow-2xl backdrop-blur-xl dark:bg-[#0E0E0E]/84 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex min-w-[72px] flex-1 items-center justify-center rounded-2xl px-2 py-2 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-[0_0_18px_rgba(0,255,163,0.24)]'
                    : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-surface-container-high hover:text-primary'
                }`
              }
            >
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

function App() {
  const location = useLocation()

  return (
    <Layout>
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
            path="/fleet"
            element={
              <PageTransition>
                <div className="pt-24 pb-32 min-h-screen flex flex-col items-center justify-center px-6 text-center">
                  <span className="material-symbols-outlined text-6xl text-primary-container mb-4">analytics</span>
                  <h1 className="font-headline text-4xl font-black tracking-tight mb-2">Fleet Analytics</h1>
                  <p className="text-on-surface-variant text-sm max-w-md">Real-time fleet performance metrics, fuel efficiency reports, and route optimization insights. Coming soon.</p>
                </div>
              </PageTransition>
            }
          />
          <Route
            path="/compliance"
            element={
              <PageTransition>
                <div className="pt-24 pb-32 min-h-screen flex flex-col items-center justify-center px-6 text-center">
                  <span className="material-symbols-outlined text-6xl text-primary-container mb-4">assignment_late</span>
                  <h1 className="font-headline text-4xl font-black tracking-tight mb-2">HOS Compliance</h1>
                  <p className="text-on-surface-variant text-sm max-w-md">Monitor Hours of Service violations, audit driver logs, and ensure FMCSA regulatory compliance across your fleet. Coming soon.</p>
                </div>
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <PageTransition>
                <div className="pt-24 pb-32 min-h-screen flex flex-col items-center justify-center px-6 text-center">
                  <span className="material-symbols-outlined text-6xl text-primary-container mb-4">person</span>
                  <h1 className="font-headline text-4xl font-black tracking-tight mb-2">Driver Profile</h1>
                  <p className="text-on-surface-variant text-sm max-w-md">Manage your driver credentials, CDL information, home terminal settings, and notification preferences. Coming soon.</p>
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
