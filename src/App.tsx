import { Routes, Route, useLocation, NavLink } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { PageTransition } from '@/components/PageTransition'
import TripPlanner from '@/pages/HomePage'
import TripPage from '@/pages/TripPage'
import { GlobalBackground } from '@/components/GlobalBackground'

function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <>
      <GlobalBackground />
      <header className="fixed top-0 z-50 bg-background/80 backdrop-blur-md flex justify-between items-center w-full px-6 h-16 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
            <img alt="User Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtH--9Krht0fw-kBOUshybtzQSBzfz6rieEWtoMG40pzDb13CGoBujS2vRhbU0FA-t8tpQN246XWm9ouZ_VwtnvwyiDmIHRYzvDk-UE1DgumGkJkyo8FeFSImac8lySbhQsD5Ei7TK2UdVVJ5EJY4LNIP9ni6_Ttwn9EoAret3wRxGt1GUR-kTqQ8lCPE1iMCGedGRovHAvDdLdDe1ytSsm0fls_tMI3k1NFUsbbvimeftQY81iFKcfcLv2y59j1Rs3YNSMQSVyhbq" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-primary uppercase font-headline">Vanguard</span>
        </div>
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </header>
      
      {children}

      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-8">
        <div className="pointer-events-auto bg-surface/80 dark:bg-[#0E0E0E]/80 backdrop-blur-xl floating pill mx-6 rounded-full h-16 flex justify-around items-center w-full max-w-md px-4 glassmorphism border border-outline-variant/30 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <NavLink to="/" className={({isActive}) => `flex items-center justify-center rounded-full w-12 h-12 active:scale-90 transition-all ${isActive ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined">map</span>
          </NavLink>
          <NavLink to="/fleet" className={({isActive}) => `flex items-center justify-center rounded-full w-12 h-12 active:scale-90 transition-all ${isActive ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined">analytics</span>
          </NavLink>
          <NavLink to="/compliance" className={({isActive}) => `flex items-center justify-center rounded-full w-12 h-12 active:scale-90 transition-all ${isActive ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined">assignment_late</span>
          </NavLink>
          <NavLink to="/profile" className={({isActive}) => `flex items-center justify-center rounded-full w-12 h-12 active:scale-90 transition-all ${isActive ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'text-on-surface-variant hover:text-primary transition-colors'}`}>
            <span className="material-symbols-outlined">person</span>
          </NavLink>
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
                <TripPage />
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
