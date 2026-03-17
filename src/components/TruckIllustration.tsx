export const TruckIllustration = () => (
  <svg
    viewBox="0 0 800 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-auto"
  >
    {/* Road/highway */}
    <path
      d="M0 320 Q200 290 400 300 Q600 310 800 280"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="12 8"
      className="text-muted-foreground"
      opacity="0.3"
    />
    <path
      d="M0 340 Q200 310 400 320 Q600 330 800 300"
      stroke="currentColor"
      strokeWidth="2"
      className="text-muted-foreground"
      opacity="0.2"
    />

    {/* Truck body */}
    <rect x="280" y="200" width="240" height="100" rx="8"
      stroke="currentColor" strokeWidth="2" className="text-primary" opacity="0.6" />
    {/* Cabin */}
    <path d="M520 220 L560 220 L580 250 L580 300 L520 300 Z"
      stroke="currentColor" strokeWidth="2" className="text-primary" opacity="0.6" />
    {/* Window */}
    <rect x="530" y="230" width="35" height="25" rx="3"
      stroke="currentColor" strokeWidth="1.5" className="text-accent" opacity="0.5" />
    {/* Wheels */}
    <circle cx="320" cy="310" r="20"
      stroke="currentColor" strokeWidth="2" className="text-foreground" opacity="0.4" />
    <circle cx="320" cy="310" r="10"
      stroke="currentColor" strokeWidth="1.5" className="text-foreground" opacity="0.3" />
    <circle cx="400" cy="310" r="20"
      stroke="currentColor" strokeWidth="2" className="text-foreground" opacity="0.4" />
    <circle cx="400" cy="310" r="10"
      stroke="currentColor" strokeWidth="1.5" className="text-foreground" opacity="0.3" />
    <circle cx="560" cy="310" r="20"
      stroke="currentColor" strokeWidth="2" className="text-foreground" opacity="0.4" />
    <circle cx="560" cy="310" r="10"
      stroke="currentColor" strokeWidth="1.5" className="text-foreground" opacity="0.3" />

    {/* Cargo lines */}
    <line x1="300" y1="220" x2="500" y2="220"
      stroke="currentColor" strokeWidth="1" className="text-muted-foreground" opacity="0.3" />
    <line x1="300" y1="240" x2="500" y2="240"
      stroke="currentColor" strokeWidth="1" className="text-muted-foreground" opacity="0.3" />
    <line x1="300" y1="260" x2="500" y2="260"
      stroke="currentColor" strokeWidth="1" className="text-muted-foreground" opacity="0.3" />

    {/* Horizon lines */}
    <line x1="0" y1="160" x2="200" y2="170"
      stroke="currentColor" strokeWidth="1" className="text-muted-foreground" opacity="0.15" />
    <line x1="600" y1="165" x2="800" y2="155"
      stroke="currentColor" strokeWidth="1" className="text-muted-foreground" opacity="0.15" />
  </svg>
)
