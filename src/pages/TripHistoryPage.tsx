import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, MapPinned, Search, ChevronRight, Truck, Radio } from 'lucide-react'

import { useListTripsQuery } from '@/api/tripsApi'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

const HistoryLoadingVisual = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Animated Rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut"
            }}
            className="absolute h-full w-full rounded-full border border-primary/40 bg-primary/5"
          />
        ))}
        {/* Central Icon */}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 shadow-[0_0_20px_rgba(0,255,163,0.4)]">
          <Truck className="h-8 w-8 text-on-primary-fixed" />
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-12 flex flex-col items-center gap-2"
      >
        <p className="text-sm font-black uppercase tracking-[0.25em] text-on-surface">Decrypting Fleet Logs</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default function TripHistoryPage() {
  const [query, setQuery] = useState('')
  const { data: trips = [], isLoading, isError } = useListTripsQuery()

  const filteredTrips = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return trips
    }

    return trips.filter((trip) =>
      [
        trip.current_location,
        trip.pickup_location,
        trip.dropoff_location,
        trip.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [query, trips])

  return (
    <div className="relative z-10 min-h-screen px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Live Archives</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">Fleet History</h1>
              <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                Review and manage your team's global movement data.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by terminal, status, or node..."
                className="h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition-colors focus:border-primary/40 shadow-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/30 bg-surface/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-5">
          {isLoading ? (
            <HistoryLoadingVisual />
          ) : null}

          {isError ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Radio className="h-10 w-10 text-destructive animate-pulse" />
              <p className="text-sm font-bold text-destructive uppercase tracking-widest">Signal Lost: History Link Broken</p>
            </div>
          ) : null}

          {!isLoading && !isError ? (
            filteredTrips.length > 0 ? (
              <div className="grid gap-3">
                {filteredTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    to={`/trip/${trip.id}`}
                    className="group rounded-[24px] border border-outline-variant/20 bg-surface-container-low/70 p-4 transition-all hover:border-primary/25 hover:bg-surface-container"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                            {trip.status}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(trip.created_at)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-on-surface">
                          {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-on-surface font-medium">
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            {trip.daily_logs.length} log day{trip.daily_logs.length === 1 ? '' : 's'}
                          </span>
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            {trip.stops.length} stop{trip.stops.length === 1 ? '' : 's'}
                          </span>
                          <span className="rounded-full bg-surface px-2.5 py-1">
                            {(trip.total_distance_miles || 0).toFixed(0)} mi
                          </span>
                        </div>
                      </div>

                      <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap self-start rounded-full border border-outline-variant/25 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors group-hover:border-primary/25 group-hover:text-primary">
                        <MapPinned className="h-3.5 w-3.5 shrink-0" />
                        Open Trip
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Search className="h-10 w-10 text-on-surface-variant opacity-40" />
                <p className="text-sm font-bold text-on-surface uppercase tracking-widest">Archive Empty: No matching logs</p>
              </div>
            )
          ) : null}
        </section>
      </div>
    </div>
  )
}
