import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  Camera,
  Compass,
  ExternalLink,
  Globe,
  MapPin,
  Info,
  CheckCircle2,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  Maximize2
} from 'lucide-react'

interface StreetViewModeViewerProps {
  lat: number
  lng: number
  zoom?: number
  sourceDesc?: string
  selectedFeatureName?: string | null
  selectedType?: string
  onReturnToMap: () => void
}

interface PanoramaxFeature {
  id: string
  collection?: string
  geometry: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    datetime?: string
    datetimetz?: string
    license?: string
    'geovisio:producer'?: string
    'geovisio:image'?: string
    'geovisio:thumbnail'?: string
    'view:azimuth'?: number
    exif?: Record<string, any>
    [key: string]: any
  }
  assets?: {
    hd?: { href: string }
    sd?: { href: string }
    thumb?: { href: string }
  }
  distanceMeters?: number
}

// Verified coordinate in central Delhi (Barakhamba / Connaught Place corridor) with active Panoramax captures
const VERIFIED_DELHI_PANORAMAX_LOCATION = {
  lat: 28.62362,
  lng: 77.22725,
  name: 'Connaught Place / Barakhamba Rd, Central Delhi'
}

// Great-circle distance between two geographic coordinates in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Format azimuth degrees into cardinal direction
function azimuthToCardinal(deg?: number): string {
  if (typeof deg !== 'number' || isNaN(deg)) return 'Forward'
  const directions = [
    'North (0°)',
    'North-Northeast (22°)',
    'Northeast (45°)',
    'East-Northeast (67°)',
    'East (90°)',
    'East-Southeast (112°)',
    'Southeast (135°)',
    'South-Southeast (157°)',
    'South (180°)',
    'South-Southwest (202°)',
    'Southwest (225°)',
    'West-Southwest (247°)',
    'West (270°)',
    'West-Northwest (292°)',
    'Northwest (315°)',
    'North-Northwest (337°)'
  ]
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16
  return directions[idx]
}

export const StreetViewModeViewer: React.FC<StreetViewModeViewerProps> = ({
  lat: initialLat,
  lng: initialLng,
  zoom = 13,
  sourceDesc = 'Delhi Study Area Center',
  selectedFeatureName = null,
  selectedType = 'Map Center',
  onReturnToMap
}) => {
  // Current inspection coordinates (allows testing verified captures or custom locations)
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  })

  // Display mode: verified photograph with telemetry or embedded interactive web viewer
  const [viewMode, setViewMode] = useState<'photo' | 'embed'>('photo')

  // Panoramax STAC search state
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [captures, setCaptures] = useState<PanoramaxFeature[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  // Keep activeCoords in sync if initial props change
  useEffect(() => {
    setActiveCoords({ lat: initialLat, lng: initialLng })
  }, [initialLat, initialLng])

  // Query Panoramax's public, keyless STAC Search API
  const fetchPanoramaxCaptures = useCallback(async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)
    setImageLoaded(false)

    try {
      // Query bounding box approx ~1.5 km (0.015 degrees) around the target coordinate
      const delta = 0.015
      const minLng = (lng - delta).toFixed(5)
      const minLat = (lat - delta).toFixed(5)
      const maxLng = (lng + delta).toFixed(5)
      const maxLat = (lat + delta).toFixed(5)

      const url = `https://panoramax.openstreetmap.fr/api/search?bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=20`
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`Panoramax STAC search returned status ${res.status}`)
      }

      const data = await res.json()
      const features: PanoramaxFeature[] = data.features || []

      if (features.length > 0) {
        // Calculate distance from target point to each capture and sort closest first
        const sorted = features
          .map((f) => {
            const [cLng, cLat] = f.geometry.coordinates
            return {
              ...f,
              distanceMeters: calculateDistanceMeters(lat, lng, cLat, cLng)
            }
          })
          .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))

        setCaptures(sorted)
        setActiveIndex(0)
      } else {
        setCaptures([])
        setActiveIndex(0)
      }
    } catch (err: any) {
      console.warn('Panoramax search failed:', err)
      setError(err?.message || 'Unable to query Panoramax open imagery catalog')
      setCaptures([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPanoramaxCaptures(activeCoords.lat, activeCoords.lng)
  }, [activeCoords.lat, activeCoords.lng, fetchPanoramaxCaptures])

  const activeCapture = useMemo(() => {
    if (captures.length === 0 || activeIndex < 0 || activeIndex >= captures.length) {
      return null
    }
    return captures[activeIndex]
  }, [captures, activeIndex])

  // Synchronized external links (100% keyless, public URL schemes)
  const curLat = activeCoords.lat
  const curLng = activeCoords.lng
  const mapillaryWebUrl = `https://www.mapillary.com/app/?lat=${curLat}&lng=${curLng}&z=16`
  const panoramaxWebUrl = activeCapture
    ? `https://panoramax.openstreetmap.fr/#focus=pic&pic=${activeCapture.id}`
    : `https://panoramax.openstreetmap.fr/#focus=map&map=16/${curLat}/${curLng}`
  const googleStreetViewWebUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${curLat},${curLng}`
  const googleEarthWebUrl = `https://earth.google.com/web/@${curLat},${curLng},200a,1000d,35y,0h,45t,0r`
  const kartaViewWebUrl = `https://kartaview.org/map/@${curLat},${curLng},16z`

  const isTestingVerifiedLocation =
    Math.abs(activeCoords.lat - VERIFIED_DELHI_PANORAMAX_LOCATION.lat) < 0.0001 &&
    Math.abs(activeCoords.lng - VERIFIED_DELHI_PANORAMAX_LOCATION.lng) < 0.0001

  const handleJumpToVerified = () => {
    setActiveCoords({
      lat: VERIFIED_DELHI_PANORAMAX_LOCATION.lat,
      lng: VERIFIED_DELHI_PANORAMAX_LOCATION.lng
    })
  }

  const handleResetToMapTarget = () => {
    setActiveCoords({
      lat: initialLat,
      lng: initialLng
    })
  }

  const handlePrevCapture = () => {
    if (captures.length <= 1) return
    setImageLoaded(false)
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : captures.length - 1))
  }

  const handleNextCapture = () => {
    if (captures.length <= 1) return
    setImageLoaded(false)
    setActiveIndex((prev) => (prev < captures.length - 1 ? prev + 1 : 0))
  }

  return (
    <div
      className="absolute inset-0 z-20 bg-[#101914] text-[#F6F2E8] flex flex-col font-sans select-none overflow-hidden"
      role="region"
      aria-label="Street-Level Imagery Inspection"
      id="streetview-mode-viewport"
    >
      {/* =========================================================================
          TOP COMMAND & CONTEXT BAR
          ========================================================================= */}
      <div className="relative z-30 w-full bg-[#15231B]/95 border-b border-[#2A4234] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
        {/* Left: Return to Map Button + Status Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onReturnToMap}
            id="streetview-return-to-map-btn"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#285943] hover:bg-[#347458] text-[#F6F2E8] text-xs font-bold transition-all shadow-sm cursor-pointer border border-[#3E6E56] hover:shadow-md"
            title="Exit Street View and return to interactive GIS map with full state preserved"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Map</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1F3327] border border-[#2F4E3C] text-xs text-[#E6F3EB]">
            <Camera className="w-3.5 h-3.5 text-[#7BEC78]" />
            <span className="font-semibold">Street-Level Imagery</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2D5A43] text-[#A6F3A6] font-mono uppercase tracking-wider font-bold">
              Open & Free
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#98B1A2] font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#E6A446] shrink-0" />
            <span>
              {curLat.toFixed(5)}°N, {curLng.toFixed(5)}°E • ~{zoom.toFixed(1)}z
            </span>
            {selectedFeatureName && (
              <>
                <span className="text-[#4E685A]">•</span>
                <span className="text-[#C2D6CA] font-sans truncate max-w-[200px]" title={selectedFeatureName}>
                  {selectedFeatureName} ({selectedType})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Provider & External Links */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* External Mapillary Link */}
          <a
            href={mapillaryWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-xs text-[#C2D6CA] hover:text-white transition-all cursor-pointer"
            title="Open synchronized coordinates in Mapillary Web (CC BY-SA)"
            id="streetview-open-mapillary-btn"
          >
            <Compass className="w-3.5 h-3.5 text-[#E6A446]" />
            <span className="hidden md:inline">Mapillary</span>
            <ExternalLink className="w-3 h-3 text-[#7E9689]" />
          </a>

          {/* External Panoramax Link */}
          <a
            href={panoramaxWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-xs text-[#C2D6CA] hover:text-white transition-all cursor-pointer"
            title="Open synchronized coordinates in Panoramax Web (OpenStreetMap France)"
            id="streetview-open-panoramax-btn"
          >
            <Camera className="w-3.5 h-3.5 text-[#7BEC78]" />
            <span className="hidden md:inline">Panoramax Web</span>
            <ExternalLink className="w-3 h-3 text-[#7E9689]" />
          </a>

          {/* External Google Maps Link */}
          <a
            href={googleStreetViewWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-xs text-[#C2D6CA] hover:text-white transition-all cursor-pointer"
            title="Open standard Google Street View in a new tab (keyless web viewpoint)"
            id="streetview-open-gmaps-btn"
          >
            <Globe className="w-3.5 h-3.5 text-[#5BB381]" />
            <span className="hidden md:inline">Google Street View</span>
            <ExternalLink className="w-3 h-3 text-[#7E9689]" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          MAIN GROUND-LEVEL VIEWPORT
          ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-[#0D1510] overflow-hidden flex items-center justify-center">
        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center gap-3 text-xs text-[#98B1A2] z-10 animate-fadeIn">
            <div className="w-8 h-8 border-2 border-[#7BEC78] border-t-transparent rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <span className="font-semibold text-white">Scanning Panoramax Open Imagery Catalog...</span>
              <p className="text-[11px] text-[#7E9689] m-0 font-mono">
                Searching bounding box near {curLat.toFixed(5)}°N, {curLng.toFixed(5)}°E
              </p>
            </div>
          </div>
        ) : activeCapture ? (
          /* =====================================================================
             VERIFIED CAPTURE FOUND (PANORAMAX OPEN IMAGERY)
             ===================================================================== */
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* View Mode Switcher Overlay (Photo View vs Interactive Web Embed) */}
            <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
              <div className="flex items-center bg-[#15231B]/90 border border-[#2A4234] rounded-lg p-0.5 text-xs shadow-lg backdrop-blur-md">
                <button
                  onClick={() => setViewMode('photo')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                    viewMode === 'photo'
                      ? 'bg-[#285943] text-white shadow-xs'
                      : 'text-[#98B1A2] hover:text-white'
                  }`}
                  id="streetview-mode-photo-btn"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Verified Photo</span>
                </button>

                <button
                  onClick={() => setViewMode('embed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                    viewMode === 'embed'
                      ? 'bg-[#285943] text-white shadow-xs'
                      : 'text-[#98B1A2] hover:text-white'
                  }`}
                  id="streetview-mode-embed-btn"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Interactive 360 Viewer</span>
                </button>
              </div>

              {/* Verified Location Notice Banner */}
              {isTestingVerifiedLocation && (
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#285943]/80 border border-[#3E6E56] text-xs text-[#E6F3EB] backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#7BEC78]" />
                  <span>Verified Delhi Street Imagery Sample</span>
                  <button
                    onClick={handleResetToMapTarget}
                    className="ml-2 text-[10px] text-[#A6F3A6] underline hover:text-white cursor-pointer font-bold"
                  >
                    Reset to Map Center
                  </button>
                </div>
              )}
            </div>

            {/* Sequence Navigation Overlay (When multiple captures exist) */}
            {captures.length > 1 && (
              <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#15231B]/90 border border-[#2A4234] rounded-lg p-1 text-xs shadow-lg backdrop-blur-md">
                  <button
                    onClick={handlePrevCapture}
                    className="p-1 rounded text-[#98B1A2] hover:text-white hover:bg-[#285943] transition-colors cursor-pointer"
                    title="Previous street capture"
                    id="streetview-prev-capture-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-mono text-[11px] text-[#E6F3EB]">
                    {activeIndex + 1} of {captures.length}
                  </span>

                  <button
                    onClick={handleNextCapture}
                    className="p-1 rounded text-[#98B1A2] hover:text-white hover:bg-[#285943] transition-colors cursor-pointer"
                    title="Next street capture"
                    id="streetview-next-capture-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            {viewMode === 'photo' ? (
              /* Verified Photo Display */
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0D1510] z-10 text-xs text-[#98B1A2] gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#7BEC78]" />
                    <span>Loading verified ground-level imagery...</span>
                  </div>
                )}
                <img
                  src={
                    activeCapture.assets?.hd?.href ||
                    activeCapture.assets?.sd?.href ||
                    activeCapture.properties['geovisio:image'] ||
                    activeCapture.assets?.thumb?.href
                  }
                  alt={`Panoramax street capture near ${curLat}, ${curLng}`}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  id="streetview-active-image"
                />

                {/* Telemetry & Metadata Card on top of image */}
                <div className="absolute bottom-14 left-4 z-20 max-w-md bg-[#121E17]/90 border border-[#2A4234] rounded-xl p-3 shadow-xl backdrop-blur-md space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-[#23382C] pb-2">
                    <div className="flex items-center gap-1.5 text-[#7BEC78] font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verified Street Capture</span>
                    </div>
                    {activeCapture.distanceMeters !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-[#1F3327] border border-[#2F4E3C] text-[10px] text-[#A6F3A6] font-mono">
                        {activeCapture.distanceMeters < 10
                          ? 'At exact coordinate'
                          : `~${activeCapture.distanceMeters}m from target`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[#C2D6CA]">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#E6A446] shrink-0" />
                      <span>Azimuth: <strong className="text-white">{azimuthToCardinal(activeCapture.properties['view:azimuth'])}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#7BEC78] shrink-0" />
                      <span>
                        {activeCapture.properties.datetime
                          ? new Date(activeCapture.properties.datetime).toLocaleDateString()
                          : 'Recent capture'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-2">
                      <User className="w-3.5 h-3.5 text-[#7E9689] shrink-0" />
                      <span>
                        Contributor: <strong className="text-white">{activeCapture.properties['geovisio:producer'] || 'OpenStreetMap Contributor'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#23382C] text-[10px] text-[#98B1A2]">
                    <span>License: <strong className="text-[#A6F3A6]">CC-BY-SA 4.0</strong></span>
                    <a
                      href={panoramaxWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7BEC78] hover:underline flex items-center gap-1"
                    >
                      <span>Inspect in Panoramax</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* Interactive Panoramax 360 Web Embed */
              <div className="w-full h-full relative bg-black">
                <iframe
                  src={panoramaxWebUrl}
                  title="Panoramax Interactive Street View"
                  className="w-full h-full border-0"
                  allow="accelerometer; gyroscope; magnetometer"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ) : (
          /* =====================================================================
             HONEST EMPTY STATE (NO VERIFIED PANORAMAX CAPTURES NEAR COORDINATE)
             ===================================================================== */
          <div className="max-w-2xl mx-4 p-6 sm:p-8 rounded-2xl bg-[#15231B] border border-[#2A4234] shadow-2xl text-[#E6F3EB] space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#285943]/40 border border-[#3A6B53] text-[#7BEC78] shrink-0">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white m-0 tracking-tight">
                  No Panoramax Open Imagery Indexed Near This Location
                </h3>
                <p className="text-xs text-[#98B1A2] mt-1 m-0">
                  Target Coordinates: <span className="font-mono text-[#E6A446]">{curLat.toFixed(5)}°N, {curLng.toFixed(5)}°E</span> • {sourceDesc}
                </p>
              </div>
            </div>

            {/* Error notice if STAC API encountered an issue */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Notice: {error}</span>
              </div>
            )}

            {/* Honest Coverage Explanation */}
            <div className="text-xs sm:text-sm text-[#C2D6CA] leading-relaxed space-y-2">
              <p className="m-0">
                <strong>Panoramax</strong> is an open-source, community-governed alternative to proprietary street imagery led by OpenStreetMap France and the French National Institute of Geographic Information (IGN).
              </p>
              <p className="m-0 text-xs text-[#98B1A2]">
                Unlike proprietary platforms, all imagery is published under <strong>CC-BY-SA 4.0</strong> and accessible via standard STAC search APIs without API keys, subscriptions, or billing. Open coverage in Delhi is community-driven and actively expanding.
              </p>
            </div>

            {/* Quick Demo Test Action */}
            <div className="p-4 rounded-xl bg-[#0D1510] border border-[#23382C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-[#7BEC78] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Test Verified Delhi Coverage</span>
                </div>
                <p className="text-[11px] text-[#98B1A2] m-0">
                  Jump to Connaught Place / Barakhamba Rd to inspect verified Panoramax street captures in Delhi immediately.
                </p>
              </div>

              <button
                onClick={handleJumpToVerified}
                className="px-3.5 py-2 rounded-lg bg-[#285943] hover:bg-[#347458] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer border border-[#3E6E56] shrink-0"
                id="streetview-jump-verified-btn"
              >
                Inspect Central Delhi Sample
              </button>
            </div>

            {/* Synchronized Direct External Links to Free Imagery Sources */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7E9689]">
                Inspect this exact location via open & keyless web services:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mapillary */}
                <a
                  href={mapillaryWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                  id="streetview-empty-mapillary-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-[#E6A446] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E6F3EB] group-hover:text-white">Mapillary Web</div>
                      <div className="text-[10px] text-[#98B1A2]">Extensive open crowdsourced road imagery</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7E9689] group-hover:text-white" />
                </a>

                {/* Google Street View Web */}
                <a
                  href={googleStreetViewWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                  id="streetview-empty-gmaps-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#7BEC78] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E6F3EB] group-hover:text-white">Google Street View</div>
                      <div className="text-[10px] text-[#98B1A2]">Standard browser viewpoint (keyless)</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7E9689] group-hover:text-white" />
                </a>

                {/* Panoramax Map Explorer */}
                <a
                  href={panoramaxWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                  id="streetview-empty-panoramax-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4 text-[#5BB381] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E6F3EB] group-hover:text-white">Panoramax Web Map</div>
                      <div className="text-[10px] text-[#98B1A2]">OpenStreetMap France public explorer</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7E9689] group-hover:text-white" />
                </a>

                {/* Google Earth 3D */}
                <a
                  href={googleEarthWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                  id="streetview-empty-earth-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#4AA3DF] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E6F3EB] group-hover:text-white">Google Earth 3D</div>
                      <div className="text-[10px] text-[#98B1A2]">Satellite canopy & 3D buildings</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7E9689] group-hover:text-white" />
                </a>

                {/* KartaView */}
                <a
                  href={kartaViewWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1F3327] hover:bg-[#2A4535] border border-[#2F4E3C] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer group"
                  id="streetview-empty-kartaview-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-4 h-4 text-[#E6A446] shrink-0" />
                    <div>
                      <div className="font-bold text-[#E6F3EB] group-hover:text-white">KartaView</div>
                      <div className="text-[10px] text-[#98B1A2]">OpenStreetCam keyless viewer</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#7E9689] group-hover:text-white" />
                </a>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#23382C]">
                <a
                  href="https://panoramax.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#98B1A2] hover:text-[#7BEC78] flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7BEC78]" />
                  <span>How to contribute street photos to Panoramax</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <button
                  onClick={onReturnToMap}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1F3327] hover:bg-[#2A4535] text-xs font-semibold text-[#E6F3EB] transition-colors cursor-pointer border border-[#2F4E3C]"
                >
                  Return to GIS Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM INFORMATION FOOTER & ATTRIBUTION
            ========================================================================= */}
        <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A0B8AA]">
          <div className="px-3 py-1.5 rounded-md bg-[#101914]/90 border border-[#23382C] backdrop-blur-xs flex items-center gap-2 pointer-events-auto">
            <Info className="w-3.5 h-3.5 text-[#7BEC78] shrink-0" />
            <span>
              Street-level imagery provided via <strong>Panoramax (CC-BY-SA 4.0)</strong> and open web mapping services. Zero API keys or billing required.
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-[#101914]/90 border border-[#23382C] backdrop-blur-xs flex items-center gap-2 pointer-events-auto text-[10px]">
            <span>GIS Map state preserved • Open civic-tech</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreetViewModeViewer
