import { AnimatedBackground } from '@/components/AnimatedBackground'
import { Navbar } from '@/components/Navbar'
import { TruckIllustration } from '@/components/TruckIllustration'
import { TripForm } from '@/features/trips/TripForm'

const HomePage = () => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* Truck illustration — desktop only */}
      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2
                      w-[45%] pointer-events-none select-none dark:opacity-[0.12] opacity-[0.07]">
        <TruckIllustration />
      </div>

      {/* Ambient hero glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'var(--hero-glow)', filter: 'blur(80px)' }}
      />

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16 relative z-10">
        <TripForm />
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground relative z-10">
        FMCSA-compliant scheduling · 70hr/8-day rule · Property carriers
      </footer>
    </div>
  )
}

export default HomePage
