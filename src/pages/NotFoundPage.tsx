import { Link } from 'react-router-dom'
import { Compass, MapPinned } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden px-4 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,rgba(34,211,238,0.10),transparent)]" />
      <div className="relative w-full max-w-2xl rounded-[32px] border border-primary-ui-border-muted/70 bg-gradient-to-br from-card via-surface to-surface-container-low/70 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:border-white/[0.08] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-primary-ui-border-muted bg-primary/10 text-primary shadow-[0_0_28px_rgba(0,255,163,0.14)]">
          <MapPinned className="h-9 w-9" />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Route Not Found</p>
        <h1 className="mt-3 font-headline text-5xl font-black tracking-tight text-on-surface sm:text-6xl">404</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          This waypoint does not exist in the planner. The page may have moved, or the URL may be incomplete.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_10px_30px_rgba(0,255,163,0.18)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Compass className="h-4 w-4" />
            Back To Planner
          </Link>
          <Link
            to="/trips"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-primary-ui-border-muted bg-surface-container-low px-6 text-sm font-bold uppercase tracking-[0.18em] text-on-surface transition-colors hover:border-primary-ui-border hover:text-primary"
          >
            View Trip History
          </Link>
        </div>
      </div>
    </div>
  )
}
