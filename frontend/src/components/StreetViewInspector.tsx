import React, { useState, useEffect } from 'react'
import type { CandidateCorridorFeature } from '../types'
import {
  X,
  Camera,
  ExternalLink,
  Compass,
  MapPin,
  Calendar,
  Info,
  ShieldCheck,
  Globe
} from 'lucide-react'

interface StreetViewInspectorProps {
  corridor?: CandidateCorridorFeature | null
  candidate?: CandidateCorridorFeature | null
  isOpen?: boolean
  onClose: () => void
}

interface StreetImageRecord {
  id: string
  imageUrl: string
  capturedAt?: string | number
  source: 'panoramax' | 'mapillary'
  license: string
  producer?: string
  externalUrl: string
}

export const StreetViewInspector: React.FC<StreetViewInspectorProps> = ({
  corridor: propCorridor,
  candidate,
  isOpen = true,
  onClose
}) => {
  const corridor = propCorridor || candidate || null

  const [loading, setLoading] = useState<boolean>(false)
  const [image, setImage] = useState<StreetImageRecord | null>(null)
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

  useEffect(() => {
    if (!isOpen || !corridor) return

    const queryStreetImagery = async () => {
      setLoading(true)
      setStatusMessage('')
      setImage(null)

      try {
        // 1. First priority: Panoramax Keyless Open STAC Search (~1.5km bbox)
        const delta = 0.015
        const minLng = (lng - delta).toFixed(5)
        const minLat = (lat - delta).toFixed(5)
        const maxLng = (lng + delta).toFixed(5)
        const maxLat = (lat + delta).toFixed(5)

        const panoUrl = `https://panoramax.openstreetmap.fr/api/search?bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=1`
        const panoRes = await fetch(panoUrl)

        if (panoRes.ok) {
          const panoData = await panoRes.json()
          if (panoData.features && panoData.features.length > 0) {
            const item = panoData.features[0]
            const imgUrl =
              item.assets?.sd?.href ||
              item.assets?.hd?.href ||
              item.properties?.['geovisio:image'] ||
              item.assets?.thumb?.href

            if (imgUrl) {
              setImage({
                id: item.id,
                imageUrl: imgUrl,
                capturedAt: item.properties?.datetime,
                source: 'panoramax',
                license: item.properties?.license || 'CC-BY-SA-4.0',
                producer: item.properties?.['geovisio:producer'] || 'OpenStreetMap Contributor',
                externalUrl: `https://panoramax.openstreetmap.fr/#focus=pic&pic=${item.id}`
              })
              setLoading(false)
              return
            }
          }
        }

        // 2. Secondary fallback: Mapillary API (if client token is optionally configured)
        if (mapillaryToken) {
          const mapillaryUrl = `https://graph.mapillary.com/images?lat=${lat}&lng=${lng}&radius=200&fields=id,thumb_1024_url,captured_at&limit=1&access_token=${mapillaryToken}`
          const mapillaryRes = await fetch(mapillaryUrl)
          if (mapillaryRes.ok) {
            const mapillaryData = await mapillaryRes.json()
            if (mapillaryData.data && mapillaryData.data.length > 0) {
              const item = mapillaryData.data[0]
              setImage({
                id: item.id,
                imageUrl: item.thumb_1024_url,
                capturedAt: item.captured_at,
                source: 'mapillary',
                license: 'CC BY-SA',
                producer: 'Mapillary Contributor',
                externalUrl: `https://www.mapillary.com/app/?pKey=${item.id}`
              })
              setLoading(false)
              return
            }
          }
        }

        // If neither had verified captures indexed in this segment
        setImage(null)
        setStatusMessage('No verified street imagery captures currently indexed within ~1.5 km of this corridor segment.')
      } catch (err: any) {
        console.warn('Street imagery lookup error:', err)
        setImage(null)
        setStatusMessage('Unable to complete street imagery search for this corridor.')
      } finally {
        setLoading(false)
      }
    }

    queryStreetImagery()
  }, [corridor, isOpen, lat, lng, mapillaryToken])

  if (!isOpen || !corridor) return null

  const props = corridor.properties
  const mapillaryWebUrl = `https://www.mapillary.com/app/?lat=${lat}&lng=${lng}&z=16`
  const googleStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
  const panoramaxWebUrl = `https://panoramax.openstreetmap.fr/#focus=map&map=16/${lat}/${lng}`

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
            <span>Scanning open street imagery near corridor...</span>
          </div>
        ) : image ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-[#E2DFD2] shadow-sm bg-slate-900 h-48">
              <img
                src={image.imageUrl}
                alt={`Street capture along ${props.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/75 text-[#7BEC78] text-[9px] px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified {image.source === 'panoramax' ? 'Panoramax' : 'Mapillary'} Capture</span>
              </div>
              {image.capturedAt && (
                <div className="absolute bottom-2 left-2 bg-black/75 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5 font-mono">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{new Date(image.capturedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-[#7E8E84] flex items-center justify-between px-1">
              <span>
                {image.source === 'panoramax' ? 'Panoramax (CC-BY-SA 4.0)' : 'Mapillary (CC BY-SA)'}
                {image.producer ? ` • ${image.producer}` : ''}
              </span>
              <a
                href={image.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#285943] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full View</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* Honest Empty State with Synchronized External Open Links */
          <div className="p-3.5 rounded-lg border border-[#E2DFD2] bg-white space-y-2.5 text-xs text-[#55665C]">
            <div className="flex items-center gap-2 text-[#285943] font-semibold text-xs">
              <Compass className="w-4 h-4 shrink-0 text-[#285943]" />
              <span>Street Imagery & Right-of-Way</span>
            </div>

            <p className="m-0 text-[11px] leading-relaxed text-[#6E7E74]">
              {statusMessage || 'No open street imagery indexed directly along this corridor segment.'}
              {' '}You can inspect this exact location directly via keyless mapping services:
            </p>

            {/* Quick External Actions */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <a
                href={mapillaryWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-[#285943] hover:bg-[#1D4332] text-white font-medium text-xs transition-all shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#A6F3A6]" />
                  <span>Inspect in Mapillary Web</span>
                </div>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href={googleStreetViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white hover:bg-[#F7F6F0] text-[#1D2A22] border border-[#E2DFD2] font-medium text-xs transition-all shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#285943]" />
                  <span>Inspect in Google Street View (Web)</span>
                </div>
                <ExternalLink className="w-3 h-3 text-[#55665C]" />
              </a>

              <a
                href={panoramaxWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-white hover:bg-[#F7F6F0] text-[#1D2A22] border border-[#E2DFD2] font-medium text-xs transition-all shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#5BB381]" />
                  <span>Open in Panoramax Web Map</span>
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
