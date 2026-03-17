import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetTripQuery } from '@/api/tripsApi'
import { StatsBar } from './StatsBar'
import { TripMap } from './TripMap'
import { LogSheet } from './LogSheet'
import { TripLoadingScreen } from '@/components/TripLoadingScreen'
import { jsPDF } from 'jspdf'

export const TripResults = () => {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const { data: trip, isLoading, isError } = useGetTripQuery(tripId || '', {
    skip: !tripId,
    pollingInterval: undefined,
  })

  if (isLoading || !trip) {
    return <TripLoadingScreen />
  }

  if (isError || trip.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/5 max-w-md text-center">
          <h2 className="text-xl font-bold text-destructive mb-2">Trip Failed</h2>
          <p className="text-sm text-muted-foreground">{trip?.error_message || 'An error occurred'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const handleDownloadPDF = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })

    trip.daily_logs.forEach((log, idx) => {
      if (idx > 0) pdf.addPage()

      const canvas = document.querySelector(`#log-sheet-day-${log.day_number} canvas`) as HTMLCanvasElement
      if (canvas) {
        const imgData = canvas.toDataURL('image/png')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 30
        const imgWidth = pageWidth - margin * 2
        const imgHeight = (canvas.height / canvas.width) * imgWidth

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, pageHeight - margin * 2))
      }
    })

    pdf.save(`eld-trip-${tripId}.pdf`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button + stats */}
      <div className="border-b border-border bg-card/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            id="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold">Trip Results</h1>
            <p className="text-xs text-muted-foreground">
              {trip.current_location} → {trip.pickup_location} → {trip.dropoff_location}
            </p>
          </div>
        </div>
        <StatsBar trip={trip} />
      </div>

      {/* Main content: map + logs */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map panel */}
        <div className="w-full lg:w-[55%] h-[300px] lg:h-auto">
          <TripMap trip={trip} />
        </div>

        {/* Log sheets panel */}
        <div className="w-full lg:w-[45%] flex flex-col border-t lg:border-t-0 lg:border-l border-border">
          {/* Tabs */}
          <div className="flex-shrink-0 flex overflow-x-auto gap-1 p-2 border-b border-border bg-card/30">
            {trip.daily_logs.map((log, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                id={`tab-day-${i + 1}`}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  "flex items-center gap-1",
                  activeTab === i
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-muted-foreground"
                )}
              >
                Day {i + 1}
                {log.recap.available_tomorrow < 5 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                )}
              </button>
            ))}
          </div>

          {/* Active log sheet */}
          <div className="flex-1 overflow-auto p-3">
            {trip.daily_logs[activeTab] && (
              <LogSheet
                dayLog={trip.daily_logs[activeTab]}
                currentCycleUsed={trip.current_cycle_used}
                dayNumber={trip.daily_logs[activeTab].day_number}
              />
            )}
          </div>

          {/* Download button */}
          <div className="p-3 border-t border-border">
            <button
              onClick={handleDownloadPDF}
              id="download-pdf"
              className={cn(
                "w-full h-10 rounded-md text-sm font-medium",
                "bg-primary text-primary-foreground",
                "hover:scale-[1.01] active:scale-[0.99] transition-all",
                "flex items-center justify-center gap-2"
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
