import { Truck } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useNavigate } from 'react-router-dom'

export const Navbar = () => {
  const navigate = useNavigate()

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 py-4 relative z-10">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        id="nav-logo"
      >
        <Truck className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm sm:text-base tracking-tight">
          ELD Trip Planner
        </span>
      </button>
      <ThemeToggle />
    </nav>
  )
}
