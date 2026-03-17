import { Navbar } from '@/components/Navbar'
import { TripResults } from '@/features/trips/TripResults'

const TripPage = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <TripResults />
      </div>
    </div>
  )
}

export default TripPage
