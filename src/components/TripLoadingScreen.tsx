import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Truck } from 'lucide-react'

interface TripLoadingScreenProps {
  onComplete?: () => void
}

export const TripLoadingScreen = ({ onComplete }: TripLoadingScreenProps) => {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    const tl = gsap.timeline()
    tl.to(barRef.current, { width: '85%', duration: 4, ease: 'power1.inOut' })
    return () => { tl.kill() }
  }, [])

  useEffect(() => {
    if (onComplete) {
      // onComplete might be called externally when data arrives
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center
                    bg-background/95 backdrop-blur-sm">
      {/* Road */}
      <div className="relative w-full max-w-lg h-24 overflow-hidden">
        <div className="absolute bottom-8 w-full border-b-2 border-dashed border-muted-foreground/30" />
        <div className="absolute bottom-6 animate-truck-drive">
          <Truck className="h-10 w-10 text-primary" />
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-8 w-64 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div ref={barRef} className="h-full w-0 rounded-full bg-primary" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground font-mono">
        Computing your route
        <span className="animate-blink">...</span>
      </p>
    </div>
  )
}
