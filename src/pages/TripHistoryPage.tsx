import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPinned, Search, ChevronRight } from 'lucide-react'

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Trip History</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-on-surface sm:text-3xl">Search saved trips</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Find previous routes and reopen their generated logs from one place.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by current, pickup, dropoff..."
                className="h-12 w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none transition-colors focus:border-primary/40"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/30 bg-surface/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-5">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading saved trips...</div>
          ) : null}

          {isError ? (
            <div className="py-10 text-center text-sm text-destructive">Trip history could not be loaded.</div>
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
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(trip.created_at)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-on-surface">
                          {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
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

                      <div className="inline-flex items-center gap-2 self-start rounded-full border border-outline-variant/25 bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface transition-colors group-hover:border-primary/25 group-hover:text-primary">
                        <MapPinned className="h-3.5 w-3.5" />
                        Open Trip
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No trips matched your search.
              </div>
            )
          ) : null}
        </section>
      </div>
    </div>
  )
}
