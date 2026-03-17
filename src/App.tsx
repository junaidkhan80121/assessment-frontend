import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import HomePage from '@/pages/HomePage'
import TripPage from '@/pages/TripPage'

function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <HomePage />
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
      </Routes>
    </AnimatePresence>
  )
}

export default App
