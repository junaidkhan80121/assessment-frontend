import { 
  Scale, 
  Clock, 
  MapIcon, 
  FileText, 
  Video, 
  CheckCircle2,
  AlertCircle,
  Truck,
  BookOpen,
  Monitor
} from 'lucide-react'

// Layout wrapper for all Info Pages
const InfoPageLayout = ({ 
  title, 
  subtitle, 
  eyebrow, 
  children 
}: { 
  title: string
  subtitle: string
  eyebrow: string
  children: React.ReactNode 
}) => {
  return (
    <div className="relative z-10 min-h-screen px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Header Section */}
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <div className="mt-3">
            <h1 className="text-3xl font-bold text-on-surface sm:text-4xl">{title}</h1>
            <p className="mt-2 text-base text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          </div>
        </section>

        {/* Dynamic Content Sections */}
        {children}
      </div>
    </div>
  )
}

// Reusable Section Component
const InfoSection = ({ 
  title, 
  description, 
  icon: Icon,
  items 
}: { 
  title: string
  description: string
  icon: React.ElementType
  items: string[]
}) => {
  return (
    <section className="rounded-[28px] border border-outline-variant/30 bg-surface/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <div 
            key={i}
            className="group flex flex-col justify-center rounded-[24px] border border-outline-variant/20 bg-surface-container-low/70 p-5 min-h-[100px] transition-all hover:border-primary/25 hover:bg-surface-container"
          >
            <div className="flex items-start gap-3">
               <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary opacity-80" />
               <p className="text-sm font-medium leading-relaxed text-on-surface">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------
// 1. GUIDELINES PAGE
// ----------------------------------------------------------------------
export const GuidelinesPage = () => {
  return (
    <InfoPageLayout
      eyebrow="Assessment Rules"
      title="FMCSA Guidelines"
      subtitle="Core assumptions and routing constraints applied to the trip generation logic."
    >
      <InfoSection
        icon={Scale}
        title="Driver Type & Cycle"
        description="The operational parameters governing the simulated driver."
        items={[
          "Applying standard property-carrying driver rules.",
          "Operating strictly on a 70-hour / 8-day cycle limit.",
        ]}
      />
      <InfoSection
        icon={AlertCircle}
        title="Operating Conditions"
        description="Environmental and situational baseline rules."
        items={[
          "Assuming normal driving conditions at all times.",
          "No adverse weather or visibility exceptions are applied.",
        ]}
      />
      <InfoSection
        icon={Truck}
        title="Duty & Maintenance"
        description="Time allocations for driving, stops, and logistics."
        items={[
          "Allocate exactly 1 hour for pickup logistics.",
          "Allocate exactly 1 hour for drop-off logistics.",
          "Must schedule fueling at least once every 1,000 miles.",
          "Fuel stops must be properly integrated into the duty cycle.",
        ]}
      />
    </InfoPageLayout>
  )
}

// ----------------------------------------------------------------------
// 2. MANUAL PAGE
// ----------------------------------------------------------------------
export const ManualPage = () => {
  return (
    <InfoPageLayout
      eyebrow="App Instructions"
      title="Assessment Manual"
      subtitle="Instructions on how to use the full-stack route and ELD log generator."
    >
      <InfoSection
        icon={Monitor}
        title="1. Enter Trip Details"
        description="Provide the required inputs to dispatch the route."
        items={[
          "Specify the Current Location of the driver.",
          "Specify the intended Pickup Location.",
          "Specify the final Dropoff Location.",
          "Input the Current Cycle Used (in Hours).",
        ]}
      />
      <InfoSection
        icon={MapIcon}
        title="2. Review the Route"
        description="The app processes the inputs yielding geospatial pathing."
        items={[
          "Queries a free map routing API to generate the exact path.",
          "Visualizes the entire route directly on the interactive map.",
          "Calculates and plots necessary fuel, rest, and sleep stops.",
        ]}
      />
      <InfoSection
        icon={FileText}
        title="3. Export ELD Logs"
        description="Automated logbook translation of the routed trip."
        items={[
          "Dynamically draws compliant timelines onto a standard blank log template.",
          "Automatically spans multiple log sheets for trips extending beyond 24 hours.",
          "Records duty statuses: Off Duty, Sleeper Berth, Driving, and On Duty.",
        ]}
      />
    </InfoPageLayout>
  )
}

// ----------------------------------------------------------------------
// 3. ABOUT PAGE
// ----------------------------------------------------------------------
export const AboutPage = () => {
  return (
    <InfoPageLayout
      eyebrow="Project Scope"
      title="Assessment Details"
      subtitle="Deliverables, evaluation criteria, and tech stack details for the assessment."
    >
      <InfoSection
        icon={BookOpen}
        title="Deliverables"
        description="The required artifacts to successfully complete the assessment."
        items={[
          "Deploy a Live Hosted version of the application (e.g., using Vercel or Render).",
          "Record a 3-5 minute Loom video showcasing the app functionality and code.",
          "Provide the public link to the GitHub code repository.",
          "Successful completion is rewarded with a $100 bounty.",
        ]}
      />
      <InfoSection
        icon={Scale}
        title="Evaluation Criteria"
        description="How the submitted project will be graded."
        items={[
          "High priority placed on UI/UX aesthetics and polish.",
          "Great visual design can compensate for minor inaccuracies in the log generator output.",
          "Code quality, component structure, and responsiveness are strictly verified.",
        ]}
      />
      <InfoSection
        icon={Video}
        title="Tech Stack"
        description="The foundation of the assessment application."
        items={[
          "Frontend built using React (Vite) and TailwindCSS.",
          "Backend infrastructure built using Django (Python).",
        ]}
      />
    </InfoPageLayout>
  )
}
