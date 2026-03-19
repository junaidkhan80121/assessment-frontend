import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Clock, ChevronRight, Truck } from 'lucide-react'
import { Slider, Button, TextField, Autocomplete, InputAdornment } from '@mui/material'
import { useTheme } from 'next-themes'
import { ZodError } from 'zod'

import { useCreateTripMutation } from '@/api/tripsApi'
import { useLazySearchLocationsQuery, type GeocodingLocation } from '@/api/geocodingApi'
import { useToast } from '@/components/ToastProvider'
import { TypewriterText } from '@/components/TypewriterText'
import type { ApiErrorResponse, TripCreatePayload } from '@/types/trip'
import { buildTripPayload, tripFormSchema } from '@/utils/tripValidation'

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
  tabIndex,
  accentColor,
  accentGlow,
}: LocationInputProps) => {
  return (
    <Autocomplete
      freeSolo
      disableClearable
      options={options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name || '')}
      filterOptions={(x) => x}
      autoComplete
      includeInputInList
      filterSelectedOptions
      open={isOpen}
      value={value}
      onInputChange={(_, newValue) => {
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
          helperText={errorText || ' '}
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
    />
  )
}

const RouteIllustration = () => (
  <div className="relative mx-auto mb-6 h-72 w-full max-w-xs overflow-hidden rounded-[28px] border border-outline-variant/40 bg-[radial-gradient(circle_at_top,_rgba(0,255,163,0.16),_transparent_48%),linear-gradient(180deg,_rgba(32,31,31,0.95),_rgba(14,14,14,0.96))] px-5 pt-5 shadow-[0_20px_60px_rgba(0,0,0,0.38)]">
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute inset-x-6 top-5 h-16 rounded-full bg-primary/10 blur-2xl"
    />
    <div className="absolute inset-x-4 bottom-6 h-20 rounded-[28px] border border-white/8 bg-white/[0.04]" />
    <div className="absolute inset-x-10 top-[134px] h-[2px] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)]" />
    <div className="relative h-full">
      <div className="absolute left-5 right-5 top-6 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
        <span>Current</span>
        <span>Pickup</span>
        <span>Dropoff</span>
      </div>

      <div className="absolute left-6 right-6 top-16 h-[3px] rounded-full bg-white/6">
        <motion.div
          animate={{ backgroundPositionX: ['0%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent,rgba(0,255,163,0.9),transparent)] bg-[length:40%_100%]"
        />
      </div>

      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.25 }}
          className={`absolute top-[58px] h-6 w-6 -translate-x-1/2 rounded-full border-2 ${
            index === 1 ? 'border-secondary bg-secondary/20' : 'border-primary bg-primary/20'
          }`}
          style={{ left: `${15 + index * 35}%` }}
        >
          <motion.div
            animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.25 }}
            className="absolute inset-0 rounded-full bg-primary/30"
          />
        </motion.div>
      ))}

      <motion.div
        animate={{ x: ['-10%', '88%'], y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[116px] flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-surface-container-highest/90 text-primary shadow-[0_12px_30px_rgba(0,255,163,0.18)]"
      >
        <Truck className="h-6 w-6" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-5 left-0 right-0 grid grid-cols-3 gap-3"
      >
        {[
          { title: 'Routes', value: '3' },
          { title: 'HOS', value: 'Check' },
          { title: 'Logs', value: 'Build' },
        ].map((card, index) => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/8 bg-[rgba(15,23,42,0.42)] px-3 py-2 text-center backdrop-blur-sm"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{card.title}</p>
            <p className="mt-1 text-sm font-semibold text-on-surface">{card.value}</p>
          </div>
        ))}
      </motion.div>
    </div>
  </div>
)

const LoadingModal = () => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          className="mx-4 flex w-full max-w-md flex-col items-center rounded-[32px] border border-outline-variant/50 bg-surface-container p-7 shadow-2xl"
        >
          <RouteIllustration />
          <h3 className="text-center font-headline text-2xl font-bold text-on-surface">
            <TypewriterText text="Computing Routes" speed={40} />
          </h3>
          <p className="mt-2 text-center text-sm text-on-surface-variant">
            Comparing route options, validating HOS limits, and preparing driver logs.
          </p>

          <div className="mt-5 w-full space-y-3">
            {[
              'Checking pickup and dropoff paths',
              'Running FMCSA cycle-hour compliance',
              'Generating the best route package',
            ].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-on-surface-variant">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.4 + index * 0.2, repeat: Infinity, ease: 'linear' }}
                  className="material-symbols-outlined text-primary"
                >
                  progress_activity
                </motion.span>
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
  const trimmed = searchTerm.trim()
  const normalized = trimmed.toLowerCase()
  const shouldSearch = trimmed.length >= 3
  const cachedOptions = shouldSearch ? searchCache.get(normalized) ?? [] : []

  useEffect(() => {
    if (!shouldSearch || searchCache.has(normalized)) {
      return
    }

    const timer = window.setTimeout(() => {
      trigger(trimmed)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [normalized, shouldSearch, trimmed, trigger])

  useEffect(() => {
    if (normalized && result.data?.length) {
      searchCache.set(normalized, result.data)
    }
  }, [normalized, result.data])

  const options = shouldSearch ? (cachedOptions.length > 0 ? cachedOptions : result.data ?? []) : []

  return {
    options,
    isOpen: shouldSearch && (result.isFetching || options.length > 0),
    isFetching: result.isFetching,
    isError: result.isError,
  }
}

const TripPlanner: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { theme } = useTheme()
  const [createTrip] = useCreateTripMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [activeField, setActiveField] = useState<TripField | null>(null)
  const [showAllErrors, setShowAllErrors] = useState(false)
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
    current_cycle_used: 45,
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
      navigate(`/trip/${trip.id}`)
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

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6">
      {isLoading && <LoadingModal />}

      <div className="relative z-10 mx-auto w-full max-w-7xl">
      <div className="mb-8 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">Smart geocoding</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Alternative routes</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">HOS-aware logs</span>
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

      <div className={`mx-auto w-full max-w-[44rem] overflow-hidden rounded-[32px] border ${isLight ? 'border-primary/10 bg-white/40 shadow-[0_32px_80px_rgba(0,0,0,0.08)]' : 'border-white/10 bg-black/20 shadow-[0_32px_80px_rgba(0,0,0,0.4)]'} backdrop-blur-3xl`}>
        <div className={`rounded-[28px] border ${isLight ? 'border-white/40 bg-white/60' : 'border-white/5 bg-surface/40'} p-5 sm:px-6 sm:py-7 backdrop-blur-xl`}>
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
              tabIndex={3}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.45fr_auto] lg:items-end">
            <div className="space-y-2.5">
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
            <div className="flex justify-between text-[11px] text-on-surface-variant font-medium">
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
      </div>
    </div>
  )
}

export default TripPlanner
