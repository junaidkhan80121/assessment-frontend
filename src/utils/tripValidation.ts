import { z } from 'zod'
import type { TripCreatePayload } from '@/types/trip'

const normalizeLocation = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

const distinctLocationCheck = (value: TripCreatePayload) => {
  const locations = [
    normalizeLocation(value.current_location),
    normalizeLocation(value.pickup_location),
    normalizeLocation(value.dropoff_location),
  ]

  return new Set(locations).size === locations.length
}

export const tripFormSchema = z
  .object({
    current_location: z.string().trim().min(2, 'Enter a valid current location'),
    pickup_location: z.string().trim().min(2, 'Enter a valid pickup location'),
    dropoff_location: z.string().trim().min(2, 'Enter a valid dropoff location'),
    current_cycle_used: z
      .number()
      .min(0, 'Cycle hours must be between 0 and 70')
      .max(70, 'Cycle hours must be between 0 and 70'),
  })
  .superRefine((value, ctx) => {
    if (!distinctLocationCheck(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['current_location'],
        message: 'Each trip stop must be different.',
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickup_location'],
        message: 'Pickup location cannot match another trip stop.',
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dropoff_location'],
        message: 'Dropoff location cannot match another trip stop.',
      })
    }
  })

export const buildTripPayload = (values: TripCreatePayload): TripCreatePayload => ({
  current_location: values.current_location.trim(),
  current_location_lat: values.current_location_lat,
  current_location_lon: values.current_location_lon,
  pickup_location: values.pickup_location.trim(),
  pickup_location_lat: values.pickup_location_lat,
  pickup_location_lon: values.pickup_location_lon,
  dropoff_location: values.dropoff_location.trim(),
  dropoff_location_lat: values.dropoff_location_lat,
  dropoff_location_lon: values.dropoff_location_lon,
  current_cycle_used: values.current_cycle_used,
})
