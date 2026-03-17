import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, Variants } from 'framer-motion'
import { MapPin, Clock, Truck, Loader2 } from 'lucide-react'
 
import { useCreateTripMutation } from '@/api/tripsApi'
import type { TripFormValues } from '@/types/trip'

const tripSchema = z.object({
  current_location: z.string().min(2, 'Enter a valid location'),
  pickup_location: z.string().min(2, 'Enter a valid location'),
  dropoff_location: z.string().min(2, 'Enter a valid location'),
  current_cycle_used: z.number().min(0).max(70, 'Must be 0–70'),
})

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], staggerChildren: 0.08 }
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

export const TripForm = () => {
  const navigate = useNavigate()
  const [createTrip] = useCreateTripMutation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      current_location: '',
      pickup_location: '',
      dropoff_location: '',
      current_cycle_used: 0,
    },
  })

  const cycleValue = watch('current_cycle_used')

  const onSubmit = async (data: TripFormValues) => {
    setServerError(null)
    try {
      const result = await createTrip(data).unwrap()
      navigate(`/trip/${result.id}`)
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } }
      setServerError(error?.data?.error || 'An unexpected error occurred. Please try again.')
    }
  }

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="w-full max-w-[520px] mx-auto">
      <div className="rounded-lg border p-6 sm:p-8 border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md shadow-2xl shadow-black/20">
        <div className="pb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" id="form-title">
            Plan Your Trip
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your details for an{' '}
            <span className="text-primary font-medium">FMCSA-compliant</span>{' '}
            Hours of Service schedule
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Current Location */}
          <motion.div variants={itemVariants}>
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 text-primary" /> Current Location
            </label>
            <input
              {...register('current_location')}
              placeholder="e.g. Chicago, IL"
              id="current-location"
              className="w-full h-11 px-3 rounded-md text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            {errors.current_location && (
              <p className="text-destructive text-xs mt-1">{errors.current_location.message}</p>
            )}
          </motion.div>

          {/* Pickup Location */}
          <motion.div variants={itemVariants}>
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 text-primary" /> Pickup Location
            </label>
            <input
              {...register('pickup_location')}
              placeholder="e.g. Indianapolis, IN"
              id="pickup-location"
              className="w-full h-11 px-3 rounded-md text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            {errors.pickup_location && (
              <p className="text-destructive text-xs mt-1">{errors.pickup_location.message}</p>
            )}
          </motion.div>

          {/* Dropoff Location */}
          <motion.div variants={itemVariants}>
            <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 text-primary" /> Dropoff Location
            </label>
            <input
              {...register('dropoff_location')}
              placeholder="e.g. Nashville, TN"
              id="dropoff-location"
              className="w-full h-11 px-3 rounded-md text-sm bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
            />
            {errors.dropoff_location && (
              <p className="text-destructive text-xs mt-1">{errors.dropoff_location.message}</p>
            )}
          </motion.div>

          {/* Cycle Hours */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" /> Cycle Hours Used
              </label>
              <span className="text-primary font-mono font-semibold text-sm">
                {cycleValue}h / 70h
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={70}
              step={0.5}
              value={cycleValue}
              onChange={(e) => setValue('current_cycle_used', parseFloat(e.target.value))}
              className="w-full accent-primary h-2 cursor-pointer"
              id="cycle-hours-slider"
            />
            {/* Visual fill */}
            <div className="h-1 w-full rounded-full bg-secondary overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all ${
                  cycleValue > 60 ? "bg-destructive" :
                  cycleValue > 45 ? "bg-yellow-500" : "bg-primary"
                }`}
                style={{ width: `${(cycleValue / 70) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(70 - cycleValue).toFixed(1)} hours remaining in 8-day cycle
            </p>
            {errors.current_cycle_used && (
              <p className="text-destructive text-xs mt-1">{errors.current_cycle_used.message}</p>
            )}
          </motion.div>

          {/* Server error */}
          {serverError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-destructive text-sm">{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-button"
              className="w-full h-12 rounded-md text-base font-semibold tracking-wide bg-primary text-primary-foreground transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] active:scale-[0.98] animate-glow-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  Plan My Trip
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  )
}
