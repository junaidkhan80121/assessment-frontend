/* ── Trip API types ──────────────────────────────────────────────────── */

export interface TripStop {
  type: "CURRENT" | "PICKUP" | "DROPOFF" | "FUEL" | "REST" | "BREAK"
  location: string
  lat: number
  lon: number
  arrival_hour: number
  duration_minutes: number
  description: string
}

export interface RouteInstruction {
  text: string
  distance_miles: number
  duration_hours: number
  road_name: string
  maneuver_type: string
  maneuver_modifier: string
  location: {
    lat: number | null
    lon: number | null
  }
  cumulative_distance_miles: number
  cumulative_duration_hours: number
}

export interface DutyEntry {
  status: "OFF_DUTY" | "SLEEPER" | "DRIVING" | "ON_DUTY_NOT_DRIVING"
  start: string   // "HH:MM"
  end: string     // "HH:MM"
  hours: number
  location: string
  miles?: number
}

export interface DutyTotals {
  OFF_DUTY: number
  SLEEPER: number
  DRIVING: number
  ON_DUTY_NOT_DRIVING: number
}

export interface Remark {
  time: string
  location: string
  note: string
}

export interface Recap {
  on_duty_today: number
  on_duty_last_5_days: number
  on_duty_last_7_days: number
  on_duty_last_8_days: number
  available_tomorrow: number
  available_tomorrow_70: number
  available_tomorrow_60: number
  hours_warning: boolean
  hours_critical: boolean
}

export interface DailyLog {
  date: string
  day_number: number
  duty_entries: DutyEntry[]
  totals: DutyTotals
  total_miles_driving_today: number
  remarks: Remark[]
  recap: Recap
}

export interface ApiErrorResponse {
  code?: string
  message?: string
  details?: Record<string, string[] | string>
  error?: string
}

export interface Trip {
  id: string
  current_location: string
  current_location_lat: number
  current_location_lon: number
  pickup_location: string
  pickup_location_lat: number
  pickup_location_lon: number
  dropoff_location: string
  dropoff_location_lat: number
  dropoff_location_lon: number
  current_cycle_used: number
  status: "PENDING" | "COMPUTING" | "COMPUTED" | "FAILED"
  error_message: string
  route_geometry: [number, number][]
  route_instructions: RouteInstruction[]
  route_options?: {
    id: number
    leg1_miles: number
    leg2_miles: number
    total_distance_miles: number
    leg1_duration_hours: number
    leg2_duration_hours: number
    route_geometry: [number, number][]
    route_instructions?: RouteInstruction[]
    stops: TripStop[]
    daily_logs: DailyLog[]
    total_on_duty_hours: number
    total_drive_hours: number
    hos_compliant: boolean
    weekly_hours_used: number
    weekly_hours_remaining: number
    is_fastest?: boolean
    label?: string
  }[]
  total_distance_miles: number
  leg1_miles: number
  leg2_miles: number
  leg1_duration_hours: number
  leg2_duration_hours: number
  stops: TripStop[]
  daily_logs: DailyLog[]
  total_on_duty_hours: number
  total_drive_hours: number
  hos_compliant: boolean
  weekly_hours_used: number
  weekly_hours_remaining: number
  created_at: string
  updated_at: string
}

export interface TripCreatePayload {
  current_location: string
  current_location_lat?: number
  current_location_lon?: number
  pickup_location: string
  pickup_location_lat?: number
  pickup_location_lon?: number
  dropoff_location: string
  dropoff_location_lat?: number
  dropoff_location_lon?: number
  current_cycle_used: number
}

export interface TripFormValues {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used: number
}
