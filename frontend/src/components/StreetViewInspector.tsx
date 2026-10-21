import React, { useState, useEffect } from 'react'
import type { CandidateCorridorFeature } from '../types'
import {
  X,
  Camera,
  ExternalLink,
  Compass,
  AlertCircle,
  MapPin,
  Calendar,
  Info
} from 'lucide-react'

interface StreetViewInspectorProps {
  corridor?: CandidateCorridorFeature | null
  candidate?: CandidateCorridorFeature | null
  isOpen?: boolean
  onClose: () => void
}

interface MapillaryImage {
  id: string
  thumb_url: string
  captured_at: number
  lat: number
  lng: number
}

export const StreetViewInspector: React.FC<StreetViewInspectorProps> = ({
  corridor: propCorridor,
  candidate,
  isOpen = true,
  onClose
}) => {
  const corridor = propCorridor || candidate || null

  const [loading, setLoading] = useState<boolean>(false)
  const [image, setImage] = useState<MapillaryImage | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Compute midpoint coordinate from corridor GeoJSON LineString
  const getMidpoint = (): { lat: number; lng: number } => {
    if (!corridor || !corridor.geometry || !corridor.geometry.coordinates) {
      return { lat: 28.585, lng: 77.215 }
    }
    const coords = corridor.geometry.coordinates
    const midIdx = Math.floor(coords.length / 2)
    const mid = coords[midIdx]
    return { lng: mid[0], lat: mid[1] }
  }

  const { lat, lng } = getMidpoint()
  const mapillaryToken = import.meta.env.VITE_MAPILLARY_CLIENT_TOKEN
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!isOpen || !corridor) return

    if (!mapillaryToken) {
      setImage(null)
      if (!googleMapsKey) {
        setStatusMessage('No developer access token configured in environment.')
      }
      return
    }

    // Query Mapillary API v4 for nearby imagery within 100m
    const queryMapillary = async () => {
      setLoading(true)
      setStatusMessage('')
      try {
        const url = `https://graph.mapillary.com/images?lat=${lat}&lng=${lng}&radius=100&fields=id,thumb_1024_url,captured_at,computed_geometry&limit=1&access_token=${mapillaryToken}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Mapillary API responded with status ${res.status}`)
        }
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          const item = data.data[0]
          setImage({
            id: item.id,
            thumb_url: item.thumb_1024_url,
            captured_at: item.captured_at,
            lat: item.computed_geometry?.coordinates[1] || lat,
            lng: item.computed_geometry?.coordinates[0] || lng
          })
        } else {
          setImage(null)
          setStatusMessage('No verified street imagery captures indexed within 100m of this corridor.')
        }
      } catch (err: any) {
        setImage(null)
        setStatusMessage(err?.message || 'Unable to connect to Mapillary imagery service.')
      } finally {
        setLoading(false)
      }
    }

    queryMapillary()
  }, [corridor, isOpen, lat, lng, mapillaryToken])

  if (!isOpen || !corridor) return null

  const props = corridor.properties
  const mapillaryWebUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=16`
  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

  return (
    <div className="absolute top-4 right-4 z-30 w-88 sm:w-96 bg-white border border-[#E2DFD2] rounded-xl shadow-xl flex flex-col overflow-hidden text-[#1D2A22] animate-fadeIn font-sans">
      {/* Header */}
      <div className="px-4 py-3 bg-[#F7F6F0] border-b border-[#E2DFD2] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#285943]/10 text-[#285943]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1D2A22] uppercase tracking-wider m-0">
              Street-Level Inspection
            </h3>
            <span className="text-[10px] text-[#55665C] font-mono">
              {props.candidate_id} • {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#55665C] hover:text-[#1D2A22] hover:bg-[#EAE7DC] transition-all cursor-pointer"
          aria-label="Close street view inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corridor Overview Banner */}
      <div className="p-3 bg-white border-b border-[#ECE9DF] text-xs">
        <div className="font-semibold text-[#1D2A22] text-xs leading-snug">
          {props.name}
        </div>
        <div className="text-[11px] text-[#55665C] mt-1 flex items-center gap-2">
          <span>{props.length_km} km</span>
          <span>•</span>
          <span>Typology: <strong className="text-[#285943] capitalize">{props.dominant_typology}</strong></span>
          <span>•</span>
          <span>Cost: <strong className="text-[#C28B39]">₹{(props.estimated_cost_inr / 100000).toFixed(1)}L</strong></span>
        </div>
        <div className="text-[10px] text-[#7E8E84] mt-1 italic">
          {props.primary_streets || 'Walkable road corridor'}
        </div>
      </div>

      {/* Main Imagery Viewer Area */}
      <div className="p-4 bg-[#FAF9F5] space-y-3">
        {loading ? (
          <div className="h-44 rounded-lg border border-dashed border-[#E2DFD2] bg-white flex flex-col items-center justify-center gap-2 text-xs text-[#55665C]">
            <div className="w-5 h-5 border-2 border-[#285943] border-t-transparent rounded-full animate-spin" />
            <span>Scanning street imagery near corridor...</span>
          </div>
        ) : googleMapsKey ? (
          <div className="space-y-2">
            <div className="rounded-lg overflow-hidden border border-[#E2DFD2] shadow-sm bg-slate-900 h-52">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/streetview?key=${googleMapsKey}&location=${lat},${lng}&heading=0&pitch=0&fov=80`}
                title={`Google Street View along ${props.name}`}
              />
            </div>
            <div className="text-[10px] text-[#7E8E84] flex items-center justify-between px-1">
              <span>Source: Google Maps Embed (Street View)</span>
              <a
                href={googleStreetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#285943] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full Screen</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : image ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-[#E2DFD2] shadow-sm bg-slate-900 h-48">
              <img
                src={image.thumb_url}
                alt={`Street capture along ${props.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5 font-mono">
                <Calendar className="w-2.5 h-2.5" />
                <span>{new Date(image.captured_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-[10px] text-[#7E8E84] flex items-center justify-between px-1">
              <span>Source: Mapillary (CC BY-SA)</span>
              <a
                href={mapillaryWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#285943] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>360° Panorama</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* Informative Unavailable / Investigation State */
          <div className="p-3.5 rounded-lg border border-[#E2DFD2] bg-white space-y-2.5 text-xs text-[#55665C]">
            <div className="flex items-center gap-2 text-[#C28B39] font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Street Imagery Integration</span>
            </div>

            <p className="m-0 text-[11px] leading-relaxed">
              {mapillaryToken
                ? statusMessage
                : 'Direct embedded street panorama requires a Google Maps API Key (VITE_GOOGLE_MAPS_API_KEY) or Mapillary Token (VITE_MAPILLARY_CLIENT_TOKEN). You can inspect this exact road segment directly in external mapping services below:'}
            </p>

            {/* Quick External Actions */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <a
                href={googleStreetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-[#285943] hover:bg-[#1D4332] text-white font-medium text-xs transition-all shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#86A68A]" />
                  <span>Inspect in Google Street View</span>
                </div>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href={mapillaryWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white hover:bg-[#F7F6F0] text-[#1D2A22] border border-[#E2DFD2] font-medium text-xs transition-all shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#C28B39]" />
                  <span>Inspect in Mapillary Web</span>
                </div>
                <ExternalLink className="w-3 h-3 text-[#55665C]" />
              </a>
            </div>
          </div>
        )}

        {/* Legal & Cartographic Disclaimers */}
        <div className="p-2.5 rounded-md bg-[#F2EFE9] border border-[#E2DFD2] text-[10px] text-[#55665C] leading-normal flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
          <span>
            Candidate corridors are street-network planning alignments. Street imagery confirms visual right-of-way context; physical tree planting requires on-site utility and municipal clearance.
          </span>
        </div>
      </div>
    </div>
  )
}
