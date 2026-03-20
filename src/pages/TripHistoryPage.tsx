import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, MapPinned, Search, ChevronLeft, ChevronRight, Truck, Radio } from 'lucide-react'

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
            className="absolute h-full w-full rounded-full border border-primary-ui-border-strong bg-primary/5"
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
  const [page, setPage] = useState(1)
  const pageSize = 5
  const { data, isLoading, isError } = useListTripsQuery({ page, pageSize })
  const trips = data?.results ?? []
  const totalTrips = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalTrips / pageSize))

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

  const isFiltering = query.trim().length > 0
  const historyGridStyle =
    filteredTrips.length > 0
      ? { gridTemplateRows: `repeat(${filteredTrips.length}, minmax(0, 1fr))` }
      : undefined

  return (
    <div className="relative z-10 h-[100dvh] overflow-hidden px-4 pb-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
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
                className="h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition-colors focus:border-primary-ui-border-strong shadow-sm"
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-outline-variant/30 bg-surface/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-5">
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
              <>
                <div
                  className="grid min-h-0 flex-1 gap-3 overflow-hidden"
                  style={historyGridStyle}
                >
                  {filteredTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      to={`/trip/${trip.id}`}
                      className="group flex min-h-0 flex-col justify-center rounded-[24px] border border-outline-variant/20 bg-surface-container-low/70 p-3.5 transition-all hover:border-primary-ui-border hover:bg-surface-container sm:p-4"
                    >
                      <div className="flex min-h-0 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary-ui-border-muted bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                              {trip.status}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(trip.created_at)}
                            </span>
                          </div>
                          <p className="mt-2.5 line-clamp-2 text-sm font-bold text-on-surface">
                            {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-on-surface font-medium">
                            <span className="rounded-full bg-surface px-2.5 py-1">
                              {trip.log_days} log day{trip.log_days === 1 ? '' : 's'}
                            </span>
                            <span className="rounded-full bg-surface px-2.5 py-1">
                              {trip.stop_count} stop{trip.stop_count === 1 ? '' : 's'}
                            </span>
                            <span className="rounded-full bg-surface px-2.5 py-1">
                              {(trip.total_distance_miles || 0).toFixed(0)} mi
                            </span>
                          </div>
                        </div>

                        <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap self-start rounded-full border border-outline-variant/25 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors group-hover:border-primary-ui-border group-hover:text-primary">
                          <MapPinned className="h-3.5 w-3.5 shrink-0" />
                          Open Trip
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {!isFiltering ? (
                  <div className="mt-5 flex shrink-0 flex-col gap-3 border-t border-outline-variant/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-on-surface-variant">
                      Showing page {page} of {totalPages} · {totalTrips} total trips
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary-ui-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors hover:border-primary-ui-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
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
