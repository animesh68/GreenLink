import React, { useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Compass,
  ExternalLink,
  Globe,
  MapPin,
  RotateCcw,
  Info,
  CheckCircle2,
  Navigation
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

export const StreetViewModeViewer: React.FC<StreetViewModeViewerProps> = ({
  lat,
  lng,
  zoom = 13,
  sourceDesc = 'Delhi Study Area Center',
  selectedFeatureName = null,
  selectedType = 'Map Center',
  onReturnToMap
}) => {
  const [heading, setHeading] = useState<number>(0)
  const [pitch, setPitch] = useState<number>(0)
  const [fov, setFov] = useState<number>(90)
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false)

  // Read Google Maps API key from Vite environment
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || ''

  // Official Google Maps Platform Street View Embed URL
  const streetViewEmbedUrl = googleMapsKey
    ? `https://www.google.com/maps/embed/v1/streetview?key=${googleMapsKey}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}`
    : ''

  // Official external fallback URLs
  const googleStreetViewWebUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
  const googleEarthWebUrl = `https://earth.google.com/web/@${lat},${lng},200a,1000d,35y,0h,45t,0r`
  const mapillaryWebUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=16`

  const handleResetCamera = () => {
    setHeading(0)
    setPitch(0)
    setFov(90)
  }

  return (
    <div
      className="absolute inset-0 z-20 bg-[#121B16] text-[#F6F2E8] flex flex-col font-sans select-none overflow-hidden"
      role="region"
      aria-label="Street View Ground-Level Inspection Mode"
      id="streetview-mode-viewport"
    >
      {/* =========================================================================
          TOP COMMAND & CONTEXT BAR
          ========================================================================= */}
      <div className="relative z-30 w-full bg-[#17261E]/95 border-b border-[#2D4537] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
        {/* Left: Prominent Return to Map Button + Status Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onReturnToMap}
            id="streetview-return-to-map-btn"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#285943] hover:bg-[#347458] text-[#F6F2E8] text-xs font-bold transition-all shadow-sm cursor-pointer border border-[#3E6E56] hover:shadow-md"
            title="Exit Street View and return to interactive GIS map"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Map</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#23382C] border border-[#33503F] text-xs text-[#E6F3EB]">
            <Camera className="w-3.5 h-3.5 text-[#7BEC78]" />
            <span className="font-semibold">Street View Mode</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#98B1A2] font-mono">
            <MapPin className="w-3.5 h-3.5 text-[#E6A446] shrink-0" />
            <span>
              {lat.toFixed(5)}°N, {lng.toFixed(5)}°E • ~{zoom.toFixed(1)}z
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

        {/* Right: Camera Orientation Presets & External Exploration Links */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Compass Heading Orientation Quick Controls (when key is present) */}
          {googleMapsKey && (
            <div className="flex items-center bg-[#23382C] border border-[#33503F] rounded-md p-0.5 text-[11px]">
              <span className="px-1.5 text-[#7E9689] flex items-center gap-1 font-mono">
                <Navigation className="w-3 h-3 text-[#7BEC78]" />
                Heading:
              </span>
              <button
                onClick={() => setHeading(0)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  heading === 0 ? 'bg-[#285943] text-white' : 'text-[#A0B8AA] hover:text-white'
                }`}
                title="Face North (0°)"
              >
                N
              </button>
              <button
                onClick={() => setHeading(90)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  heading === 90 ? 'bg-[#285943] text-white' : 'text-[#A0B8AA] hover:text-white'
                }`}
                title="Face East (90°)"
              >
                E
              </button>
              <button
                onClick={() => setHeading(180)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  heading === 180 ? 'bg-[#285943] text-white' : 'text-[#A0B8AA] hover:text-white'
                }`}
                title="Face South (180°)"
              >
                S
              </button>
              <button
                onClick={() => setHeading(270)}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                  heading === 270 ? 'bg-[#285943] text-white' : 'text-[#A0B8AA] hover:text-white'
                }`}
                title="Face West (270°)"
              >
                W
              </button>
              {(heading !== 0 || pitch !== 0) && (
                <button
                  onClick={handleResetCamera}
                  className="px-1.5 py-0.5 text-[#A0B8AA] hover:text-white cursor-pointer ml-0.5"
                  title="Reset Camera Orientation"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* External Google Earth 3D link */}
          <a
            href={googleEarthWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#23382C] hover:bg-[#2F4A3B] border border-[#33503F] text-xs text-[#C2D6CA] hover:text-white transition-all cursor-pointer"
            title="Inspect 3D topography and satellite building models in Google Earth Web"
            id="streetview-open-earth-btn"
          >
            <Globe className="w-3.5 h-3.5 text-[#5BB381]" />
            <span className="hidden md:inline">Google Earth</span>
            <ExternalLink className="w-3 h-3 text-[#7E9689]" />
          </a>

          {/* External Google Maps full link */}
          <a
            href={googleStreetViewWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#23382C] hover:bg-[#2F4A3B] border border-[#33503F] text-xs text-[#C2D6CA] hover:text-white transition-all cursor-pointer"
            title="Open full Google Maps Street View in a new tab"
            id="streetview-open-gmaps-btn"
          >
            <span className="hidden md:inline">Google Maps</span>
            <ExternalLink className="w-3 h-3 text-[#7E9689]" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          MAIN GROUND-LEVEL VIEWPORT
          ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-[#0E1612] overflow-hidden flex items-center justify-center">
        {googleMapsKey ? (
          /* Live Google Maps Platform Street View Embed */
          <div className="relative w-full h-full">
            {!iframeLoaded && (
              <div className="absolute inset-0 bg-[#0E1612] flex flex-col items-center justify-center gap-3 text-xs text-[#98B1A2] z-10">
                <div className="w-7 h-7 border-2 border-[#7BEC78] border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Google Street View at {lat.toFixed(4)}°N, {lng.toFixed(4)}°E...</span>
              </div>
            )}
            <iframe
              key={`${lat}-${lng}-${heading}-${pitch}-${fov}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={streetViewEmbedUrl}
              title={`Google Street View at ${lat}, ${lng}`}
              onLoad={() => setIframeLoaded(true)}
              className="w-full h-full"
            />
          </div>
        ) : (
          /* Honest Configuration & Fallback Panel (When VITE_GOOGLE_MAPS_API_KEY is not set) */
          <div className="max-w-xl mx-4 p-6 sm:p-8 rounded-xl bg-[#17261E] border border-[#2D4537] shadow-2xl text-[#E6F3EB] space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-[#285943]/40 border border-[#3A6B53] text-[#7BEC78] shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white m-0 tracking-tight">
                  Google Street View Demo Mode
                </h3>
                <p className="text-xs text-[#98B1A2] mt-1 m-0">
                  Target Coordinates: <span className="font-mono text-[#E6A446]">{lat.toFixed(5)}°N, {lng.toFixed(5)}°E</span> • {sourceDesc}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="text-xs sm:text-sm text-[#C2D6CA] leading-relaxed space-y-2">
              <p className="m-0">
                To embed live 360° ground-level Street View directly inside the GreenLink Delhi viewport, configure an official Google Maps Platform API Key with the <strong>Maps Embed API</strong> enabled.
              </p>
              <p className="m-0 text-xs text-[#98B1A2]">
                Google Maps Embed API provides unlimited free embeds on websites. Per Google policies, embedding requires a valid API key with billing enabled on Google Cloud.
              </p>
            </div>

            {/* Quick Setup Instructions Box */}
            <div className="p-3.5 rounded-lg bg-[#0E1612] border border-[#23382C] text-xs space-y-2 font-mono">
              <div className="flex items-center gap-1.5 text-[#7BEC78] font-bold text-[11px] uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>How to enable in 3 steps:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[#98B1A2] text-[11px] leading-relaxed m-0 pl-1">
                <li>Enable <strong className="text-white">Maps Embed API</strong> in Google Cloud Console.</li>
                <li>Set HTTP Referrer restriction (e.g. <code className="text-[#E6A446]">http://localhost:5173/*</code>).</li>
                <li>Add to <code className="text-[#E6A446]">frontend/.env.local</code>: <code className="text-emerald-400">VITE_GOOGLE_MAPS_API_KEY=your_key</code></li>
              </ol>
            </div>

            {/* Direct Fallback Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7E9689]">
                Inspect this exact location immediately via external web services:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={googleStreetViewWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#285943] hover:bg-[#347458] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer border border-[#3E6E56]"
                  id="streetview-fallback-gmaps-btn"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7BEC78]" />
                    <span>Open in Google Street View</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={googleEarthWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#23382C] hover:bg-[#2F4A3B] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer border border-[#33503F]"
                  id="streetview-fallback-earth-btn"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#5BB381]" />
                    <span>Open in Google Earth 3D</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#23382C]">
                <a
                  href={mapillaryWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#98B1A2] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-[#E6A446]" />
                  <span>Check Mapillary Open Imagery</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <button
                  onClick={onReturnToMap}
                  className="px-3 py-1.5 rounded-md bg-[#23382C] hover:bg-[#2F4A3B] text-xs font-semibold text-[#E6F3EB] transition-colors cursor-pointer border border-[#33503F]"
                >
                  Return to Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM INFORMATION FOOTER
            ========================================================================= */}
        <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A0B8AA]">
          <div className="px-3 py-1.5 rounded-md bg-[#121B16]/90 border border-[#23382C] backdrop-blur-xs flex items-center gap-2 pointer-events-auto">
            <Info className="w-3.5 h-3.5 text-[#7BEC78] shrink-0" />
            <span>
              Ground-level camera requests closest available panorama near <strong>{lat.toFixed(5)}°N, {lng.toFixed(5)}°E</strong>.
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-[#121B16]/90 border border-[#23382C] backdrop-blur-xs flex items-center gap-2 pointer-events-auto text-[10px]">
            <span>One-way synchronization • Map state preserved on return</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreetViewModeViewer
