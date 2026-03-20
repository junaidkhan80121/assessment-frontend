import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Navigation,
  Clock,
  ChevronRight,
  LoaderCircle,
  Route,
  ClipboardList,
  Truck,
  Scale,
  Monitor,
  FileText,
  Globe,
  Users,
  Mail,
  Phone,
  Send,
  CheckCircle2,
} from 'lucide-react'
import { Slider, Button, TextField, Autocomplete, InputAdornment } from '@mui/material'
import { useTheme } from 'next-themes'
import { ZodError } from 'zod'

import { useCreateTripMutation } from '@/api/tripsApi'
import { useLazySearchLocationsQuery, type GeocodingLocation } from '@/api/geocodingApi'
import { useToast } from '@/components/ToastProvider'
import { TypewriterText } from '@/components/TypewriterText'
import type { ApiErrorResponse, TripCreatePayload } from '@/types/trip'
import { buildTripPayload, tripFormSchema } from '@/utils/tripValidation'
import { GuidelinesVisual, ManualVisual, AboutVisual, ContactVisual, InfoSection } from './InfoPages'

type TripField = 'current_location' | 'pickup_location' | 'dropoff_location'
type TripFormState = TripCreatePayload
type FieldErrors = Partial<Record<TripField | 'current_cycle_used', string>>

const searchCache = new Map<string, GeocodingLocation[]>()

const LOCATION_COORD_KEYS = {
  current_location: ['current_location_lat', 'current_location_lon'],
  pickup_location: ['pickup_location_lat', 'pickup_location_lon'],
  dropoff_location: ['dropoff_location_lat', 'dropoff_location_lon'],
} as const

interface LocationInputProps {
  label: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: GeocodingLocation[]
  onSelect: (item: GeocodingLocation) => void
  loading: boolean
  isOpen: boolean
  onFocus: () => void
  onBlur: () => void
  errorText?: string
  helperText?: string
  tabIndex: number
  accentColor: string
  accentGlow: string
}

const LocationInput = ({
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  options,
  onSelect,
  loading,
  isOpen,
  onFocus,
  onBlur,
  errorText,
  helperText,
  tabIndex,
  accentColor,
  accentGlow,
}: LocationInputProps) => {
  const selectedOption = options.find((option) => option.display_name === value) ?? null

  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name || '')}
      filterOptions={(x) => x}
      autoHighlight
      clearOnBlur={false}
      blurOnSelect={false}
      includeInputInList
      filterSelectedOptions
      open={isOpen}
      value={selectedOption ?? undefined}
      inputValue={value}
      isOptionEqualToValue={(option, autocompleteValue) =>
        typeof autocompleteValue !== 'string' && option.place_id === autocompleteValue.place_id
      }
      onInputChange={(_, newValue, reason) => {
        if (reason === 'blur') {
          return
        }

        onChange(newValue)
      }}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          onChange(newValue)
          return
        }

        if (newValue?.display_name) {
          onChange(newValue.display_name)
          onSelect(newValue)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          error={Boolean(errorText)}
          helperText={errorText || helperText || ' '}
          inputProps={{
            ...params.inputProps,
            tabIndex,
            onFocus,
            onBlur,
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <span style={{ color: accentColor }}>
                  <Icon className="h-4 w-4" />
                </span>
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <span className="material-symbols-outlined h-4 w-4 animate-spin text-on-surface-variant">sync</span> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(var(--surface-color-rgb), 0.4)',
              color: 'var(--on-surface)',
              borderRadius: '16px',
              minHeight: '52px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(16px)',
              '& fieldset': {
                borderColor: errorText ? 'var(--error)' : 'rgba(120, 120, 120, 0.2)',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: errorText ? 'var(--error)' : 'var(--primary)',
                backgroundColor: 'rgba(var(--surface-color-rgb), 0.6)',
              },
              '&.Mui-focused fieldset': {
                borderColor: errorText ? 'var(--error)' : 'var(--primary)',
                borderWidth: '2px',
                boxShadow: errorText
                  ? '0 0 15px rgba(255,180,171,0.15)'
                  : accentGlow,
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.9rem',
              fontWeight: 500,
              color: errorText ? 'var(--error)' : 'var(--on-surface)',
              opacity: 0.8,
              '&.Mui-focused': {
                color: errorText ? 'var(--error)' : 'var(--primary)',
                opacity: 1,
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '1rem',
              fontWeight: 600,
              paddingTop: '12px',
              paddingBottom: '12px',
              color: 'var(--on-surface)',
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--on-surface)',
              opacity: 0.4,
              fontWeight: 500,
            },
            '& .MuiFormHelperText-root': {
              minHeight: '1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: errorText ? 'var(--error)' : 'var(--on-surface-variant)',
              marginLeft: 0,
            },
          }}
        />
      )}
      noOptionsText={loading ? 'Searching locations...' : 'No matching locations'}
      renderOption={(props, option) => (
        <li
          {...props}
          className="flex items-center gap-3 px-4 py-3 text-sm text-foreground cursor-pointer border-b border-border/30 last:border-0 transition-colors"
          style={{ backgroundColor: 'transparent' }}
        >
          <MapPin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
          <span className="truncate">{option.display_name}</span>
        </li>
      )}
      PaperComponent={({ children }) => (
        <div className="mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          {children}
        </div>
      )}
      slotProps={{
        listbox: {
          className: 'max-h-80 overflow-y-auto fancy-scrollbar',
        },
        paper: {
          elevation: 0,
        },
      }}
    />
  )
}

const LoadingModal = () => {
  const steps = [
    { label: 'Routing', icon: Route },
    { label: 'Stops', icon: MapPin },
    { label: 'Logs', icon: ClipboardList },
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex w-full max-w-[26rem] flex-col rounded-[28px] border border-outline-variant/50 bg-surface-container px-5 py-5 shadow-2xl"
        >
          <div className="rounded-[22px] border border-outline-variant/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <LoaderCircle className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Starting Trip Build</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  Computing the best route and preparing compliant logs.
                </p>
              </div>
            </div>

            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/8">
              <motion.div
                animate={{ x: ['-100%', '260%'] }}
                transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-1/2 rounded-full bg-[linear-gradient(90deg,rgba(0,255,163,0),rgba(0,255,163,0.95),rgba(166,230,255,0))]"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {steps.map(({ label, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.16 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center"
                >
                  <Icon className="mx-auto h-4 w-4 text-primary" />
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <h3 className="mt-5 text-center font-headline text-[1.55rem] font-bold text-on-surface">
            <TypewriterText text="Computing Routes" speed={40} />
          </h3>
          <p className="mt-1.5 text-center text-sm text-on-surface-variant">
            Route search, stop planning, and log generation are underway.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-on-surface-variant">
            {['Finding routes', 'Checking HOS', 'Preparing logs'].map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                <motion.span
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1, 0.9] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const toFieldErrors = (error: ZodError<TripFormState>): FieldErrors =>
  error.issues.reduce<FieldErrors>((acc, issue) => {
    const field = issue.path[0] as keyof FieldErrors | undefined
    if (field && !acc[field]) {
      acc[field] = issue.message
    }
    return acc
  }, {})

const validateTripForm = (values: TripFormState): FieldErrors => {
  const result = tripFormSchema.safeParse(buildTripPayload(values))
  return result.success ? {} : toFieldErrors(result.error)
}

const filterFieldErrors = (
  errors: FieldErrors,
  touchedFields: Partial<Record<TripField | 'current_cycle_used', boolean>>,
  showAll: boolean,
): FieldErrors => {
  if (showAll) {
    return errors
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => touchedFields[field as keyof typeof touchedFields]),
  ) as FieldErrors
}

const useLocationSearch = (searchTerm: string) => {
  const [trigger, result] = useLazySearchLocationsQuery()
  const latestRequestedTerm = useRef('')
  const trimmed = searchTerm.trim()
  const normalized = trimmed.toLowerCase()
  const shouldSearch = trimmed.length >= 3
  const cachedOptions = shouldSearch ? searchCache.get(normalized) ?? [] : []

  useEffect(() => {
    if (!shouldSearch || searchCache.has(normalized)) {
      return
    }

    const timer = window.setTimeout(() => {
      latestRequestedTerm.current = normalized
      trigger(trimmed)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [normalized, shouldSearch, trimmed, trigger])

  useEffect(() => {
    const currentData = result.currentData ?? result.data
    if (latestRequestedTerm.current && currentData) {
      searchCache.set(latestRequestedTerm.current, currentData)
    }
  }, [result.currentData, result.data])

  const liveOptions =
    latestRequestedTerm.current === normalized ? (result.currentData ?? result.data ?? []) : []
  const options = shouldSearch ? (searchCache.has(normalized) ? cachedOptions : liveOptions) : []

  return {
    options,
    isOpen: shouldSearch && (result.isFetching || options.length > 0),
    isFetching: result.isFetching,
    isError: result.isError,
  }
}

const getLocationHelperText = (
  value: string,
  coordsReady: boolean,
  isFetching: boolean,
  options: GeocodingLocation[],
) => {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return undefined
  }

  if (trimmed.length < 3) {
    return 'Type at least 3 characters for suggestions.'
  }

  if (coordsReady) {
    return 'Suggestion selected.'
  }

  if (isFetching) {
    return 'Searching matching places...'
  }

  if (options.length > 0) {
    return 'Choose the closest suggestion for best accuracy.'
  }

  return 'No suggestions yet. Try city, state, ZIP, or a longer phrase.'
}

const TripPlanner: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { theme } = useTheme()
  const [createTrip] = useCreateTripMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [activeField, setActiveField] = useState<TripField | null>(null)
  const [showAllErrors, setShowAllErrors] = useState(false)
  const [contactStatus, setContactStatus] = useState<string | null>(null)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<TripField | 'current_cycle_used', boolean>>>({})
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formValues, setFormValues] = useState<TripFormState>({
    current_location: '',
    current_location_lat: undefined,
    current_location_lon: undefined,
    pickup_location: '',
    pickup_location_lat: undefined,
    pickup_location_lon: undefined,
    dropoff_location: '',
    dropoff_location_lat: undefined,
    dropoff_location_lon: undefined,
    current_cycle_used: 0,
  })

  const isLight = theme === 'light'
  const accentColor = isLight ? '#0f9f57' : '#00FFA3'
  const accentGlow = isLight ? '0 0 15px rgba(15,159,87,0.16)' : '0 0 15px rgba(0,255,163,0.10)'
  const accentStrongGlow = isLight ? '0 0 30px rgba(15,159,87,0.28)' : '0 0 30px rgba(0,255,163,0.5)'
  const accentButtonGlow = isLight ? '0 0 20px rgba(15,159,87,0.22)' : '0 0 20px rgba(0,255,163,0.3)'

  const currentSearch = useLocationSearch(formValues.current_location)
  const pickupSearch = useLocationSearch(formValues.pickup_location)
  const dropoffSearch = useLocationSearch(formValues.dropoff_location)

  useEffect(() => {
    if (currentSearch.isError || pickupSearch.isError || dropoffSearch.isError) {
      toast.info({
        title: 'Location suggestions unavailable',
        description: 'You can still type locations manually while search catches up.',
      })
    }
  }, [currentSearch.isError, pickupSearch.isError, dropoffSearch.isError, toast])

  const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors])

  const syncValidation = (
    values: TripFormState,
    nextTouchedFields: Partial<Record<TripField | 'current_cycle_used', boolean>> = touchedFields,
    nextShowAllErrors = showAllErrors,
  ) => {
    const nextErrors = validateTripForm(values)
    setFieldErrors(filterFieldErrors(nextErrors, nextTouchedFields, nextShowAllErrors))
  }

  const markTouched = (field: TripField | 'current_cycle_used') => {
    setTouchedFields((current) => {
      const nextTouchedFields = { ...current, [field]: true }
      syncValidation(formValues, nextTouchedFields)
      return nextTouchedFields
    })
  }

  const updateField = (field: TripField, value: string) => {
    setFormValues((current) => {
      const [latKey, lonKey] = LOCATION_COORD_KEYS[field]
      const next = {
        ...current,
        [field]: value,
        [latKey]: undefined,
        [lonKey]: undefined,
      }
      syncValidation(next)
      return next
    })
  }

  const selectLocation = (field: TripField, item: GeocodingLocation) => {
    setFormValues((current) => {
      const [latKey, lonKey] = LOCATION_COORD_KEYS[field]
      const next = {
        ...current,
        [field]: item.display_name,
        [latKey]: parseFloat(item.lat),
        [lonKey]: parseFloat(item.lon),
      }
      syncValidation(next, { ...touchedFields, [field]: true })
      return next
    })
    setTouchedFields((current) => ({ ...current, [field]: true }))
    setActiveField(null)
  }

  const handlePlanTrip = async () => {
    setShowAllErrors(true)
    const nextErrors = validateTripForm(formValues)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error({
        title: 'Check the trip details',
        description: 'Please fix the highlighted fields before planning the route.',
      })
      return
    }

    setIsLoading(true)

    try {
      const payload = buildTripPayload(formValues)
      const trip = await createTrip(payload).unwrap()
      navigate(`/trip/${trip.id}`, { state: { trip } })
    } catch (err: unknown) {
      const apiError = (err as { data?: ApiErrorResponse; message?: string })?.data
      const message =
        apiError?.message ||
        apiError?.error ||
        (apiError?.details ? Object.values(apiError.details).flat().join(' ') : '') ||
        (err as { message?: string })?.message ||
        'An unexpected error occurred.'

      toast.error({
        title: 'Trip planning failed',
        description: message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setContactStatus('Message sent successfully! A dispatcher will reach out shortly.')
    window.setTimeout(() => setContactStatus(null), 4000)
  }

  return (
    <div id="planner" className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6">
      {isLoading && <LoadingModal />}

      <div className="relative z-10 mx-auto w-full max-w-7xl">
      <section className="flex min-h-[calc(100dvh-8rem)] flex-col justify-center pb-6">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* Neon-style live ticker (inspired by Neon.com) */}
      <div className="mb-6 flex h-9 items-center justify-between gap-4 overflow-hidden rounded-full border border-primary-ui-border-muted bg-surface/40 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(0,255,163,0.35)]" aria-hidden />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">System Live</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="whitespace-nowrap animate-[marquee_18s_linear_infinite]">
            {[
              'Network Load: 12% • Latency: 4ms • Node-7: Active',
              'Routing Engine: 99.98% precision • HOS synchronized',
              'Secure Data Stream: Encrypted • API Gateway: Normal',
              'Autoscaling: instances stable • Replicas healthy',
            ]
              .concat([
                'Network Load: 12% • Latency: 4ms • Node-7: Active',
                'Routing Engine: 99.98% precision • HOS synchronized',
                'Secure Data Stream: Encrypted • API Gateway: Normal',
                'Autoscaling: instances stable • Replicas healthy',
              ])
              .map((msg, idx) => (
                <span key={idx} className="mr-10 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {msg}
                </span>
              ))}
          </div>
        </div>
      </div>
      <div className="mb-8 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className={`rounded-full border px-3 py-1 ${isLight ? 'border-primary-ui-border bg-primary/10 text-[#005c30]' : 'border-primary-ui-border-muted bg-primary/10 text-primary'}`}>Smart geocoding</span>
          <span className={`rounded-full border px-3 py-1 ${isLight ? 'border-black/10 bg-black/5 text-gray-700' : 'border-white/10 bg-white/5 text-on-surface-variant'}`}>Alternative routes</span>
          <span className={`rounded-full border px-3 py-1 ${isLight ? 'border-black/10 bg-black/5 text-gray-700' : 'border-white/10 bg-white/5 text-on-surface-variant'}`}>HOS-aware logs</span>
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
          Plan Your Trip
          <span style={{ color: accentColor }} className="block">
            Vanguard
          </span>
        </h1>
        <p className="mx-auto max-w-[44rem] text-xs font-medium uppercase tracking-[0.2em] text-on-surface-variant sm:text-sm md:text-base">
          <TypewriterText
            text="Optimizing kinetic logistics through precision engineering"
            speed={52}
            repeat
            pauseMs={2800}
            className="text-center md:whitespace-nowrap"
          />
        </p>
      </div>

      <div className={`mx-auto w-full max-w-[44rem] overflow-hidden rounded-[32px] border backdrop-blur-[60px] ${
        isLight
          ? 'border-white/60 bg-white/25 shadow-[0_32px_80px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]'
          : 'border-white/8 bg-black/25 shadow-[0_32px_80px_rgba(0,0,0,0.5)]'
      }`}>
        <div className={`rounded-[28px] border p-5 sm:px-6 sm:py-7 backdrop-blur-3xl ${
          isLight
            ? 'border-white/50 bg-white/35'
            : 'border-white/5 bg-surface/30'
        }`}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-3 md:grid-cols-2">
            <LocationInput
              label="Current Position"
              icon={Navigation}
              placeholder="e.g. Chicago, IL"
              value={formValues.current_location}
              onChange={(value) => updateField('current_location', value)}
              onSelect={(item) => selectLocation('current_location', item)}
              options={currentSearch.options}
              loading={currentSearch.isFetching}
              isOpen={activeField === 'current_location' && currentSearch.isOpen}
              onFocus={() => setActiveField('current_location')}
              onBlur={() => {
                setActiveField((current) => (current === 'current_location' ? null : current))
                markTouched('current_location')
              }}
              errorText={fieldErrors.current_location}
              helperText={getLocationHelperText(
                formValues.current_location,
                Boolean(formValues.current_location_lat && formValues.current_location_lon),
                currentSearch.isFetching,
                currentSearch.options,
              )}
              tabIndex={1}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />
            <LocationInput
              label="Pickup Node"
              icon={Truck}
              placeholder="e.g. Detroit, MI"
              value={formValues.pickup_location}
              onChange={(value) => updateField('pickup_location', value)}
              onSelect={(item) => selectLocation('pickup_location', item)}
              options={pickupSearch.options}
              loading={pickupSearch.isFetching}
              isOpen={activeField === 'pickup_location' && pickupSearch.isOpen}
              onFocus={() => setActiveField('pickup_location')}
              onBlur={() => {
                setActiveField((current) => (current === 'pickup_location' ? null : current))
                markTouched('pickup_location')
              }}
              errorText={fieldErrors.pickup_location}
              helperText={getLocationHelperText(
                formValues.pickup_location,
                Boolean(formValues.pickup_location_lat && formValues.pickup_location_lon),
                pickupSearch.isFetching,
                pickupSearch.options,
              )}
              tabIndex={2}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />
          </div>
          <div>
            <LocationInput
              label="Destination Vector"
              icon={MapPin}
              placeholder="e.g. Pittsburgh, PA"
              value={formValues.dropoff_location}
              onChange={(value) => updateField('dropoff_location', value)}
              onSelect={(item) => selectLocation('dropoff_location', item)}
              options={dropoffSearch.options}
              loading={dropoffSearch.isFetching}
              isOpen={activeField === 'dropoff_location' && dropoffSearch.isOpen}
              onFocus={() => setActiveField('dropoff_location')}
              onBlur={() => {
                setActiveField((current) => (current === 'dropoff_location' ? null : current))
                markTouched('dropoff_location')
              }}
              errorText={fieldErrors.dropoff_location}
              helperText={getLocationHelperText(
                formValues.dropoff_location,
                Boolean(formValues.dropoff_location_lat && formValues.dropoff_location_lon),
                dropoffSearch.isFetching,
                dropoffSearch.options,
              )}
              tabIndex={3}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.45fr_auto] lg:items-center mt-2">
            <div className="flex flex-col justify-end pt-2 pb-1">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <label className="font-headline text-[10px] uppercase tracking-widest" style={{ color: accentColor }}>Cycle Hours Used</label>
              </div>
              <span className="font-headline text-lg font-bold text-on-surface sm:text-xl">
                {formValues.current_cycle_used.toFixed(1)} <span className="text-xs font-normal text-on-surface-variant ml-1">HRS</span>
              </span>
            </div>
            <Slider
              value={formValues.current_cycle_used}
              onChange={(_, value) => {
                setFormValues((current) => {
                  const next = { ...current, current_cycle_used: value as number }
                  syncValidation(next)
                  return next
                })
              }}
              onChangeCommitted={() => markTouched('current_cycle_used')}
              max={70}
              min={0}
              step={0.5}
              sx={{
                color: accentColor,
                height: 4,
                padding: '10px 0',
                '& .MuiSlider-track': {
                  border: 'none',
                },
                '& .MuiSlider-thumb': {
                  height: 16,
                  width: 16,
                  backgroundColor: accentColor,
                  border: `2px solid ${accentColor}`,
                  boxShadow: isLight ? '0 0 12px rgba(15,159,87,0.24)' : '0 0 10px rgba(0,255,163,0.4)',
                  '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                    boxShadow: 'inherit',
                  },
                  '&::before': {
                    display: 'none',
                  },
                },
                '& .MuiSlider-rail': {
                  opacity: 0.2,
                  backgroundColor: accentColor,
                },
              }}
            />
            <div className="flex justify-between text-[11px] text-on-surface-variant font-medium mt-1">
              <span>Fresh Cycle (0 hrs)</span>
              <span>Maxed Out (70 hrs)</span>
            </div>
            {fieldErrors.current_cycle_used ? (
              <p className="text-xs text-error">{fieldErrors.current_cycle_used}</p>
            ) : null}
            </div>

          <Button
            variant="contained"
            disabled={isLoading}
            onClick={handlePlanTrip}
            sx={{
              minWidth: { lg: '184px' },
              width: { xs: '100%', lg: '184px' },
              height: '44px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              borderRadius: '10px',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              backgroundColor: isLoading ? 'var(--surface-container-highest)' : 'var(--primary)',
              color: isLoading ? 'var(--on-surface-variant)' : 'var(--on-primary)',
              boxShadow: isLoading ? 'none' : accentButtonGlow,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'var(--primary)',
                opacity: 0.9,
                transform: 'scale(1.02)',
                boxShadow: accentStrongGlow,
              },
              '&.Mui-disabled': {
                backgroundColor: 'var(--surface-container-highest)',
                color: 'var(--on-surface-variant)',
              },
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base animate-spin drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">progress_activity</span>
                <span>Optimizing Route...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span>{hasErrors ? 'Resolve Fields' : 'Plan Trip'}</span>
                <ChevronRight className="ml-0.5 h-3.5 w-3.5 shrink-0" />
              </div>
            )}
          </Button>
          </div>
        </form>
        </div>
      </div>

      <div className="mt-10 flex w-full flex-wrap justify-between gap-4 opacity-80">
        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4" style={{ borderColor: `${accentColor}40` }}>
          <span className="text-[10px] uppercase tracking-widest font-bold">Fleet Status</span>
          <span className="font-headline text-xl font-bold text-on-surface">98.4% ACTIVE</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <span className="text-[10px] uppercase tracking-widest font-bold">Network Load</span>
          <span className="font-headline text-xl font-bold text-on-surface">OPTIMAL</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <span className="text-[10px] uppercase tracking-widest font-bold">Latency</span>
          <span className="font-headline text-xl font-bold text-on-surface">12ms</span>
        </div>
      </div>
      </section>

      <div className="mt-12 space-y-8">
        <section id="guidelines" className="relative min-h-[calc(100dvh-7rem)] rounded-[32px] border border-primary-ui-border bg-gradient-to-br from-surface/95 via-surface-container-low/55 to-surface/85 p-5 shadow-[0_24px_76px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_0deg,transparent_0_60%,rgba(0,255,163,0.35)_75%,transparent_88%)] opacity-35 blur-[2px] animate-[spin_14s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_180deg,transparent_0_65%,rgba(34,211,238,0.28)_78%,transparent_90%)] opacity-25 blur-[2px] animate-[spin_20s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute right-5 top-5 rounded-full border border-primary-ui-border-strong bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">Guidelines</div>
          <div className="grid h-full items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="order-2 lg:order-1">
              <GuidelinesVisual />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">Guidelines</p>
              <h2 className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Safety & compliance standards</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Operational guardrails for reliable freight movement.</p>
              <div className="mt-5">
                <InfoSection
                  icon={Scale}
                  title="Driver Wellness & Compliance"
                  description="Our core operational mandate for fleet safety."
                  cardStyle="glow-pulse"
                  items={[
                    'We enforce strict 70-hour / 8-day operational cycle limits.',
                    'Drivers are monitored for safe property-carrying hours.',
                    'Mandatory fueling checks run at least every 1,000 miles.',
                    'Pre-trip walkaround inspections are required before engine turn-over.',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="manual" className="relative min-h-[calc(100dvh-7rem)] rounded-[32px] border border-primary-ui-border bg-gradient-to-br from-surface/95 via-surface-container-low/55 to-surface/85 p-5 shadow-[0_24px_76px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_0deg,transparent_0_60%,rgba(34,211,238,0.35)_75%,transparent_88%)] opacity-32 blur-[2px] animate-[spin_14s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_180deg,transparent_0_65%,rgba(0,255,163,0.28)_78%,transparent_90%)] opacity-22 blur-[2px] animate-[spin_20s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-400/10 blur-[80px]" />
          <div className="absolute right-5 top-5 rounded-full border border-primary-ui-border-strong bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">Manual</div>
          <div className="grid h-full items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">Manual</p>
              <h2 className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface sm:text-5xl">How Vanguard routing works</h2>
              <p className="mt-2 text-sm text-on-surface-variant">From order intake to fully compliant day-by-day logs.</p>
              <div className="mt-5">
                <InfoSection
                  icon={Monitor}
                  title="Workflow Stack"
                  description="How a dispatch request becomes a compliant trip."
                  cardStyle="neon-sweep"
                  items={[
                    '1. Order parameterization with location and cycle constraints.',
                    '2. Millisecond route and stop computations across alternatives.',
                    '3. Automated ELD log rendering for each trip day.',
                    '4. Export and handoff to driver operations.',
                  ]}
                />
              </div>
            </div>
            <div>
              <ManualVisual />
            </div>
          </div>
        </section>

        <section id="about" className="relative min-h-[calc(100dvh-7rem)] rounded-[32px] border border-primary-ui-border bg-gradient-to-br from-surface/95 via-surface-container-low/55 to-surface/85 p-5 shadow-[0_24px_76px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_0deg,transparent_0_60%,rgba(0,255,163,0.35)_75%,transparent_88%)] opacity-28 blur-[2px] animate-[spin_16s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_180deg,transparent_0_65%,rgba(34,211,238,0.24)_78%,transparent_90%)] opacity-20 blur-[2px] animate-[spin_22s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute right-5 top-5 rounded-full border border-primary-ui-border-strong bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">About</div>
          <div className="grid h-full items-center gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="order-2 lg:order-1">
              <AboutVisual />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">About Us</p>
              <h2 className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Built for modern freight teams</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Performance-focused tooling for dispatch and driver workflows.</p>
              <div className="mt-5">
                <InfoSection
                  icon={Users}
                  title="Mission & capabilities"
                  description="What drives Vanguard engineering."
                  cardStyle="glass-shimmer"
                  items={[
                    'We bridge interstate law and practical routing operations.',
                    'We design high-clarity tools that keep dispatch focused.',
                    'We prioritize fatigue prevention through compliant stop planning.',
                    'We ship resilient React + Django systems for fleet teams.',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="relative min-h-[calc(100dvh-7rem)] rounded-[32px] border border-primary-ui-border bg-gradient-to-br from-surface/95 via-surface-container-low/55 to-surface/85 p-5 shadow-[0_24px_76px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_0deg,transparent_0_60%,rgba(34,211,238,0.35)_75%,transparent_88%)] opacity-26 blur-[2px] animate-[spin_16s_linear_infinite]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 -z-[1] rounded-[32px] bg-[conic-gradient(from_180deg,transparent_0_65%,rgba(0,255,163,0.28)_78%,transparent_90%)] opacity-18 blur-[2px] animate-[spin_22s_linear_infinite]" aria-hidden />
          <div className="absolute right-5 top-5 rounded-full border border-primary-ui-border-strong bg-primary/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-primary">Contact</div>
          <div className="grid h-full items-center gap-6 lg:grid-cols-[1.06fr_0.94fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">Contact</p>
              <h2 className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface sm:text-5xl">Talk to Vanguard operations</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary-ui-border-muted/80 bg-surface px-4 py-3 text-sm text-on-surface">
                  <Phone className="mb-2 h-4 w-4 text-primary" />
                  1-800-VANGUARD
                </div>
                <div className="rounded-2xl border border-primary-ui-border-muted/80 bg-surface px-4 py-3 text-sm text-on-surface">
                  <Mail className="mb-2 h-4 w-4 text-primary" />
                  ops@vanguard.io
                </div>
                <div className="rounded-2xl border border-primary-ui-border-muted/80 bg-surface px-4 py-3 text-sm text-on-surface">
                  <MapPin className="mb-2 h-4 w-4 text-primary" />
                  Chicago HQ
                </div>
              </div>
              <form onSubmit={handleContactSubmit} className="mt-4 space-y-3 rounded-2xl border border-primary-ui-border-muted/70 bg-surface/70 p-4">
                {contactStatus && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    {contactStatus}
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <input required className="rounded-xl border border-primary-ui-border-muted bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-ui-border-focus" placeholder="Full name" />
                  <input required type="email" className="rounded-xl border border-primary-ui-border-muted bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-ui-border-focus" placeholder="Email address" />
                </div>
                <textarea required rows={3} className="w-full resize-none rounded-xl border border-primary-ui-border-muted bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary-ui-border-focus" placeholder="How can we help?" />
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <Send className="h-4 w-4" />
                  Send message
                </button>
              </form>
            </div>
            <div>
              <ContactVisual />
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  )
}

export default TripPlanner
