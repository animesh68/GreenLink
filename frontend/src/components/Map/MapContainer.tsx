import React, { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type {
  GreenSpaceCollection,
  GreenSpaceFeature,
  CandidateCorridorCollection,
  CandidateCorridorFeature,
  OptimizationResponse,
  HeatGridCollection
} from '../../types'
import {
  Layers,
  Maximize2,
  Route,
  Eye,
  EyeOff,
  Flame,
  Map as MapIcon,
  Globe,
  AlertTriangle,
  X,
  Trees
} from 'lucide-react'

// Set MapLibre worker bundle URL to prevent runtime worker 404 errors with Vite
maplibregl.setWorkerUrl(maplibreWorkerUrl)

// Basemap Provider Configurations
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY?.trim() || ''

export type BasemapId = 'streets' | 'satellite' | 'hybrid' | 'dataviz'

// Fallback raster styles with open fonts glyphs configured for vector symbol layers
const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'

const CARTO_POSITRON_STYLE = {
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    'carto-positron': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors, © CARTO'
    }
  },
  layers: [
    {
      id: 'carto-positron-layer',
      type: 'raster',
      source: 'carto-positron',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

const OSM_RASTER_STYLE = {
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

const ESRI_IMAGERY_STYLE = {
  version: 8,
  glyphs: GLYPHS_URL,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS Community'
    }
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-imagery',
      minzoom: 0,
      maxzoom: 19
    }
  ]
}

export const BASEMAP_PRESETS: Record<
  BasemapId,
  {
    id: BasemapId
    name: string
    style: any
    fallbackStyle: any
    type: 'vector' | 'raster'
    description: string
  }
> = {
  streets: {
    id: 'streets',
    name: 'Street',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
      : OSM_RASTER_STYLE,
    fallbackStyle: OSM_RASTER_STYLE,
    type: MAPTILER_KEY ? 'vector' : 'raster',
    description: 'Clean light street cartography with muted road hierarchy'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
      : ESRI_IMAGERY_STYLE,
    fallbackStyle: ESRI_IMAGERY_STYLE,
    type: 'raster',
    description: 'High-resolution aerial satellite imagery'
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
      : ESRI_IMAGERY_STYLE,
    fallbackStyle: ESRI_IMAGERY_STYLE,
    type: MAPTILER_KEY ? 'vector' : 'raster',
    description: 'Satellite imagery with street network and label overlays'
  },
  dataviz: {
    id: 'dataviz',
    name: 'Muted GIS',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`
      : CARTO_POSITRON_STYLE,
    fallbackStyle: CARTO_POSITRON_STYLE,
    type: MAPTILER_KEY ? 'vector' : 'raster',
    description: 'Muted minimal cartography optimized for data visualization'
  }
}

interface MapContainerProps {
  greenSpaces: GreenSpaceCollection | null
  studyBoundary: any | null
  candidateCorridors: CandidateCorridorCollection | null
  heatGrid?: HeatGridCollection | null
  optimizedPlan: OptimizationResponse | null
  selectedFeature: GreenSpaceFeature | null
  selectedCandidate: CandidateCorridorFeature | null
  showGreenSpaces?: boolean
  showCandidates: boolean
  showHeatGrid?: boolean
  onToggleGreenSpaces?: () => void
  onToggleCandidates: () => void
  onToggleHeatGrid?: () => void
  onSelectFeature: (feature: GreenSpaceFeature | null) => void
  onSelectCandidate: (candidate: CandidateCorridorFeature | null) => void
  onInspectStreet?: (candidate: CandidateCorridorFeature) => void
  // User-directed green space selection props:
  selectedPatchIds?: string[]
  isSelectionMode?: boolean
  onTogglePatchSelection?: (patchId: string) => void
}

export const MapContainer: React.FC<MapContainerProps> = ({
  greenSpaces,
  studyBoundary,
  candidateCorridors,
  heatGrid = null,
  optimizedPlan,
  selectedFeature,
  selectedCandidate,
  showGreenSpaces: showGreenSpacesProp,
  showCandidates,
  showHeatGrid = false,
  onToggleGreenSpaces: onToggleGreenSpacesProp,
  onToggleCandidates,
  onToggleHeatGrid,
  onSelectFeature,
  onSelectCandidate,
  onInspectStreet,
  selectedPatchIds = [],
  isSelectionMode = false,
  onTogglePatchSelection
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const handlersAttachedRef = useRef<boolean>(false)

  // Independent Green Spaces visibility state (defaults to false for minimal clean initial map)
  const [internalShowGreenSpaces, setInternalShowGreenSpaces] = useState<boolean>(false)
  const currentShowGreenSpaces =
    showGreenSpacesProp !== undefined ? showGreenSpacesProp : internalShowGreenSpaces

  const handleToggleGreenSpaces = () => {
    if (onToggleGreenSpacesProp) {
      onToggleGreenSpacesProp()
    } else {
      setInternalShowGreenSpaces((prev) => !prev)
    }
  }

  const [activeBasemap, setActiveBasemap] = useState<BasemapId>('streets')
  const [keyNotice, setKeyNotice] = useState<{
    type: 'warning' | 'error' | 'info'
    message: string
  } | null>(
    !MAPTILER_KEY
      ? {
          type: 'warning',
          message:
            'MapTiler Cloud API key not configured in VITE_MAPTILER_API_KEY. Displaying OpenStreetMap / Esri fallback basemap.'
        }
      : null
  )

  // Mutable refs to prevent stale closures in MapLibre event handlers
  const greenSpacesRef = useRef(greenSpaces)
  const studyBoundaryRef = useRef(studyBoundary)
  const candidateCorridorsRef = useRef(candidateCorridors)
  const heatGridRef = useRef(heatGrid)
  const optimizedPlanRef = useRef(optimizedPlan)
  const onSelectFeatureRef = useRef(onSelectFeature)
  const onSelectCandidateRef = useRef(onSelectCandidate)
  const onInspectStreetRef = useRef(onInspectStreet)
  const showGreenSpacesRef = useRef(currentShowGreenSpaces)
  const showCandidatesRef = useRef(showCandidates)
  const showHeatGridRef = useRef(showHeatGrid)
  const selectedPatchIdsRef = useRef(selectedPatchIds)
  const isSelectionModeRef = useRef(isSelectionMode)
  const onTogglePatchSelectionRef = useRef(onTogglePatchSelection)

  useEffect(() => {
    greenSpacesRef.current = greenSpaces
    studyBoundaryRef.current = studyBoundary
    candidateCorridorsRef.current = candidateCorridors
    heatGridRef.current = heatGrid
    optimizedPlanRef.current = optimizedPlan
    onSelectFeatureRef.current = onSelectFeature
    onSelectCandidateRef.current = onSelectCandidate
    onInspectStreetRef.current = onInspectStreet
    showGreenSpacesRef.current = currentShowGreenSpaces
    showCandidatesRef.current = showCandidates
    showHeatGridRef.current = showHeatGrid
    selectedPatchIdsRef.current = selectedPatchIds
    isSelectionModeRef.current = isSelectionMode
    onTogglePatchSelectionRef.current = onTogglePatchSelection
  }, [
    greenSpaces,
    studyBoundary,
    candidateCorridors,
    heatGrid,
    optimizedPlan,
    onSelectFeature,
    onSelectCandidate,
    onInspectStreet,
    currentShowGreenSpaces,
    showCandidates,
    showHeatGrid,
    selectedPatchIds,
    isSelectionMode,
    onTogglePatchSelection
  ])

  // Setup all GeoJSON sources & layers on the map
  const addApplicationLayers = (map: maplibregl.Map) => {
    // 0. Heat Grid (Underneath all layers)
    const heatData =
      heatGridRef.current || heatGrid || { type: 'FeatureCollection', features: [] }
    if (!map.getSource('heat-grid')) {
      map.addSource('heat-grid', {
        type: 'geojson',
        data: heatData as any
      })
    }

    if (!map.getLayer('heat-grid-fill')) {
      map.addLayer({
        id: 'heat-grid-fill',
        type: 'fill',
        source: 'heat-grid',
        layout: {
          visibility: showHeatGridRef.current ? 'visible' : 'none'
        },
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'heat_score'],
            0.1, '#3B82F6',
            0.35, '#06B6D4',
            0.55, '#EAB308',
            0.75, '#F97316',
            0.95, '#EF4444'
          ],
          'fill-opacity': 0.20
        }
      })
    }

    if (!map.getLayer('heat-grid-line')) {
      map.addLayer({
        id: 'heat-grid-line',
        type: 'line',
        source: 'heat-grid',
        layout: {
          visibility: showHeatGridRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 0.35,
          'line-opacity': 0.12
        }
      })
    }

    // 1. Study Boundary Layer
    const boundData =
      studyBoundaryRef.current || studyBoundary || { type: 'FeatureCollection', features: [] }
    if (!map.getSource('study-boundary')) {
      map.addSource('study-boundary', {
        type: 'geojson',
        data: boundData
      })
    }

    if (!map.getLayer('study-boundary-fill')) {
      map.addLayer({
        id: 'study-boundary-fill',
        type: 'fill',
        source: 'study-boundary',
        paint: {
          'fill-color': '#285943',
          'fill-opacity': 0.03
        }
      })
    }

    if (!map.getLayer('study-boundary-line')) {
      map.addLayer({
        id: 'study-boundary-line',
        type: 'line',
        source: 'study-boundary',
        paint: {
          'line-color': '#285943',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.0,
            13, 1.4,
            16, 1.8
          ],
          'line-dasharray': [4, 3],
          'line-opacity': 0.45
        }
      })
    }

    // 2. Candidate Corridors Layers
    const candData =
      candidateCorridorsRef.current || candidateCorridors || { type: 'FeatureCollection', features: [] }
    if (!map.getSource('candidate-corridors')) {
      map.addSource('candidate-corridors', {
        type: 'geojson',
        data: candData as any
      })
    }

    // High contrast dark casing behind candidate line
    if (!map.getLayer('candidate-corridors-casing')) {
      map.addLayer({
        id: 'candidate-corridors-casing',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showCandidatesRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#1D2A22',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.8,
            13, 2.8,
            16, 3.8
          ],
          'line-opacity': 0.25
        }
      })
    }

    // Active warm amber dashed candidate line (thin, muted styling)
    if (!map.getLayer('candidate-corridors-line')) {
      map.addLayer({
        id: 'candidate-corridors-line',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showCandidatesRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#D99B38',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.0,
            13, 1.6,
            16, 2.4
          ],
          'line-dasharray': [3, 2],
          'line-opacity': 0.75
        }
      })
    }

    // Glowing amber hover highlight line for hovered candidate corridor
    if (!map.getLayer('corridor-hover-highlight')) {
      map.addLayer({
        id: 'corridor-hover-highlight',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showCandidatesRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#F59E0B',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 3.2,
            13, 4.8,
            16, 6.8
          ],
          'line-opacity': 0.95
        },
        filter: ['==', 'candidate_id', '']
      })
    }

    // 3. Optimized Selected Corridors Layer
    const selectedData =
      optimizedPlanRef.current?.selected_corridors_geojson || { type: 'FeatureCollection', features: [] }
    if (!map.getSource('selected-corridors')) {
      map.addSource('selected-corridors', {
        type: 'geojson',
        data: selectedData as any
      })
    }

    // Deep forest green casing for solid visual prominence
    if (!map.getLayer('selected-corridors-casing')) {
      map.addLayer({
        id: 'selected-corridors-casing',
        type: 'line',
        source: 'selected-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#064E3B',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 4.8,
            13, 7.5,
            16, 10.5
          ],
          'line-opacity': 0.95
        }
      })
    }

    // Vibrant emerald green solid corridor line
    if (!map.getLayer('selected-corridors-line')) {
      map.addLayer({
        id: 'selected-corridors-line',
        type: 'line',
        source: 'selected-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#059669',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.8,
            13, 4.5,
            16, 6.5
          ],
          'line-opacity': 1.0
        }
      })
    }

    // Highlight line when corridor is selected by user
    if (!map.getLayer('corridor-selection-highlight')) {
      map.addLayer({
        id: 'corridor-selection-highlight',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563EB',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 4.0,
            13, 6.0,
            16, 8.5
          ],
          'line-opacity': 0.95
        },
        filter: ['==', 'candidate_id', '']
      })
    }

    // 4. Green Spaces Layers
    const greenData =
      greenSpacesRef.current || greenSpaces || { type: 'FeatureCollection', features: [] }
    if (!map.getSource('green-spaces')) {
      map.addSource('green-spaces', {
        type: 'geojson',
        data: greenData as any
      })
    }

    // Translucent forest green polygon fill (subtle, restrained)
    if (!map.getLayer('green-spaces-fill')) {
      map.addLayer({
        id: 'green-spaces-fill',
        type: 'fill',
        source: 'green-spaces',
        layout: {
          visibility: showGreenSpacesRef.current ? 'visible' : 'none'
        },
        paint: {
          'fill-color': '#285943',
          'fill-opacity': 0.20
        }
      })
    }

    if (!map.getLayer('green-spaces-line')) {
      map.addLayer({
        id: 'green-spaces-line',
        type: 'line',
        source: 'green-spaces',
        layout: {
          visibility: showGreenSpacesRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#2D6A4F',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.75,
            13, 1.25,
            16, 1.75
          ],
          'line-opacity': 0.55
        }
      })
    }

    // Green space labels visible at neighborhood & street zoom levels (minzoom 11.5)
    if (!map.getLayer('green-spaces-labels')) {
      map.addLayer({
        id: 'green-spaces-labels',
        type: 'symbol',
        source: 'green-spaces',
        minzoom: 11.5,
        layout: {
          visibility: showGreenSpacesRef.current ? 'visible' : 'none',
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11.5, 9.5,
            13.5, 11.5,
            16, 13.5
          ],
          'text-anchor': 'center',
          'text-optional': true,
          'text-max-width': 8,
          'symbol-placement': 'point'
        },
        paint: {
          'text-color': '#16432A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.8,
          'text-halo-blur': 0.5
        }
      })
    }

    if (!map.getLayer('green-spaces-highlight')) {
      map.addLayer({
        id: 'green-spaces-highlight',
        type: 'line',
        source: 'green-spaces',
        paint: {
          'line-color': '#2563EB',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.5,
            13, 4.0,
            16, 5.5
          ]
        },
        filter: ['==', 'id', '']
      })
    }

    // Glowing golden-amber selection ring for user-selected green space anchors
    if (!map.getLayer('green-spaces-selected-ring')) {
      map.addLayer({
        id: 'green-spaces-selected-ring',
        type: 'line',
        source: 'green-spaces',
        paint: {
          'line-color': '#F59E0B',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2.8,
            13, 4.2,
            16, 5.8
          ],
          'line-opacity': 0.95
        },
        filter: ['in', 'id', '']
      })
    }

    // 5. Corridors Hit Area Layer
    if (!map.getLayer('candidate-corridors-hit')) {
      map.addLayer({
        id: 'candidate-corridors-hit',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          visibility: showCandidatesRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 22.0,
          'line-opacity': 0.001
        }
      })
    }

    // Attach interaction handlers
    attachMapEventHandlers(map)
  }

  // Unified Corridor Click Popup & Selection Handler
  const handleCorridorClick = (e: any, map: maplibregl.Map) => {
    if (!e.features || e.features.length === 0) return
    const feat = e.features[0] as unknown as CandidateCorridorFeature
    onSelectCandidateRef.current(feat)
    onSelectFeatureRef.current(null)

    const props = feat.properties
    const candId = props.candidate_id

    const plan = optimizedPlanRef.current
    const selectionDetail = plan?.selected_candidates?.find(
      (sc) => sc.candidate_id === candId
    )
    const exclusionDetail = plan?.excluded_candidates?.find(
      (ec) => ec.candidate_id === candId
    )

    const costStr = props.estimated_cost_inr
      ? `₹${(props.estimated_cost_inr / 100000).toFixed(1)} Lakhs`
      : 'Provisional'

    let statusBadge = ''
    let rationaleSection = ''

    if (selectionDetail) {
      statusBadge = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 700; color: #15803D; background: #EBF2ED; padding: 2px 7px; border-radius: 4px; border: 1px solid #86A68A; text-transform: uppercase;">
            ✓ Selected Plan (#${selectionDetail.step})
          </span>
          <span style="font-size: 10px; color: #607065; font-family: monospace;">
            ${candId}
          </span>
        </div>
      `
      rationaleSection = `
        <div style="background: #FAF9F5; padding: 8px; border-radius: 6px; border: 1px solid #E2DFD2; margin-top: 8px;">
          <div style="font-size: 10px; color: #285943; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">
            Selection Rationale:
          </div>
          <div style="font-size: 11px; color: #4A5850; line-height: 1.4;">
            ${selectionDetail.selection_rationale}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #607065; margin-top: 6px; border-top: 1px solid #E8E5DA; padding-top: 4px;">
            <span>Benefit: <strong style="color: #1D2A22;">+${selectionDetail.marginal_benefit.toFixed(2)}</strong></span>
            <span>Efficiency: <strong style="color: #285943; font-family: monospace;">${selectionDetail.efficiency_ratio.toFixed(2)}</strong></span>
          </div>
        </div>
      `
    } else if (exclusionDetail) {
      statusBadge = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="font-size: 10px; font-weight: 600; color: #C28B39; background: #FAF6ED; padding: 2px 7px; border-radius: 4px; border: 1px solid #C28B39; text-transform: uppercase;">
            Candidate (Not Selected)
          </span>
          <span style="font-size: 10px; color: #607065; font-family: monospace;">
            ${candId}
          </span>
        </div>
      `
      rationaleSection = `
        <div style="background: #FAF9F5; padding: 8px; border-radius: 6px; border: 1px solid #E2DFD2; margin-top: 8px;">
          <div style="font-size: 10px; color: #C28B39; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">
            Exclusion Reason:
          </div>
          <div style="font-size: 11px; color: #4A5850; line-height: 1.4;">
            ${exclusionDetail.exclusion_reason}
          </div>
        </div>
      `
    } else {
      statusBadge = `
        <div style="font-size: 11px; font-weight: 700; color: #C28B39; text-transform: uppercase; margin-bottom: 4px;">
          Candidate Street Route (${candId})
        </div>
      `
    }

    const popupContent = document.createElement('div')
    popupContent.style.fontFamily = 'inherit'
    popupContent.style.maxWidth = '280px'
    popupContent.style.lineHeight = '1.3'

    popupContent.innerHTML = `
      ${statusBadge}
      <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #1D2A22;">
        ${props.name}
      </div>
      <div style="font-size: 11px; color: #607065; margin-bottom: 6px;">
        <strong style="color: #285943;">${props.source_name}</strong> ↔ <strong style="color: #285943;">${props.target_name}</strong>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; border-top: 1px solid #E2DFD2; padding-top: 6px;">
        <div><span style="color: #7A8A7F;">Length:</span> <strong>${props.length_km} km</strong></div>
        <div><span style="color: #7A8A7F;">Cost:</span> <strong style="color: #C28B39;">${costStr}</strong></div>
      </div>
      <div style="font-size: 10px; color: #7A8A7F; margin-top: 4px; font-style: italic;">
        ${props.primary_streets || 'Local street corridor'}
      </div>
      ${rationaleSection}
      <button id="popup-inspect-street-btn" style="width: 100%; margin-top: 8px; padding: 6px 10px; background: #285943; color: white; border: none; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
        📷 Inspect Street Imagery
      </button>
    `

    if (popupRef.current) popupRef.current.remove()
    popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true })
      .setLngLat(e.lngLat)
      .setDOMContent(popupContent)
      .addTo(map)

    // Wire up Inspect Street button in popup
    const inspectBtn = popupContent.querySelector('#popup-inspect-street-btn')
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        if (onInspectStreetRef.current) {
          onInspectStreetRef.current(feat)
        }
      })
    }
  }

  const attachMapEventHandlers = (map: maplibregl.Map) => {
    if (handlersAttachedRef.current) return
    handlersAttachedRef.current = true

    // Heat Grid events
    map.on('mouseenter', 'heat-grid-fill', () => {
      if (showHeatGridRef.current) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'heat-grid-fill', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'heat-grid-fill', (e: any) => {
      if (!showHeatGridRef.current || !e.features || e.features.length === 0) return
      const feat = e.features[0]
      const props = feat.properties
      const score = typeof props.heat_score === 'number' ? props.heat_score : parseFloat(props.heat_score)
      const html = `
        <div style="font-family: inherit; max-width: 240px; color: #1D2A22;">
          <div style="font-size: 10px; font-weight: 700; color: #C28B39; text-transform: uppercase; margin-bottom: 2px;">
            Urban Heat Proxy Cell (${props.id})
          </div>
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">
            Thermal Priority: ${(score * 100).toFixed(0)}%
          </div>
          <div style="font-size: 11px; color: #607065; margin-bottom: 4px;">
            Vulnerability Tier: <strong>${props.vulnerability_tier || 'Moderate'}</strong>
          </div>
          <div style="font-size: 10px; color: #7A8A7F; border-top: 1px solid #E2DFD2; padding-top: 4px; font-style: italic;">
            Empirical proxy model based on proximity to concrete hubs vs vegetative cool sinks.
          </div>
        </div>
      `
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })

    // Corridors Click & Hover
    map.on('mouseenter', 'candidate-corridors-hit', (e: any) => {
      if (!showCandidatesRef.current) return
      map.getCanvas().style.cursor = 'pointer'
      if (e.features && e.features.length > 0) {
        const cid = e.features[0].properties?.candidate_id || ''
        if (map.getLayer('corridor-hover-highlight')) {
          map.setFilter('corridor-hover-highlight', ['==', 'candidate_id', cid])
        }
      }
    })
    map.on('mouseleave', 'candidate-corridors-hit', () => {
      map.getCanvas().style.cursor = ''
      if (map.getLayer('corridor-hover-highlight')) {
        map.setFilter('corridor-hover-highlight', ['==', 'candidate_id', ''])
      }
    })
    map.on('click', 'candidate-corridors-hit', (e) => {
      if (!showCandidatesRef.current) return
      handleCorridorClick(e, map)
    })

    map.on('mouseenter', 'selected-corridors-line', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'selected-corridors-line', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'selected-corridors-line', (e) => handleCorridorClick(e, map))

    // Green Spaces Click & Hover
    map.on('mouseenter', 'green-spaces-fill', () => {
      if (showGreenSpacesRef.current) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'green-spaces-fill', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'green-spaces-fill', (e: any) => {
      if (!showGreenSpacesRef.current) return
      if (!e.features || e.features.length === 0) return
      const feat = e.features[0] as unknown as GreenSpaceFeature
      const pid = feat.properties?.id || (feat as any).id

      if (isSelectionModeRef.current && onTogglePatchSelectionRef.current && pid) {
        onTogglePatchSelectionRef.current(pid)
      } else {
        onSelectFeatureRef.current(feat)
        onSelectCandidateRef.current(null)
      }

      const props = feat.properties
      const html = `
        <div style="font-family: inherit; color: #1D2A22;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px; color: #285943;">
            ${props.name}
          </div>
          <div style="color: #607065; font-size: 11px; margin-bottom: 6px;">
            OSM Green Anchor (${props.osm_type || 'park'})
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; border-top: 1px solid #E2DFD2; padding-top: 4px;">
            <div><span style="color: #7A8A7F;">Area:</span> <strong>${props.area_hectares} ha</strong></div>
            <div><span style="color: #7A8A7F;">Perimeter:</span> <strong>${Math.round(props.perimeter_meters)} m</strong></div>
          </div>
          <div style="font-size: 10px; color: #7A8A7F; margin-top: 4px; font-style: italic; border-top: 1px solid #E2DFD2; padding-top: 4px;">
            OpenStreetMap green anchor landmark polygon.
          </div>
        </div>
      `
      if (popupRef.current) popupRef.current.remove()
      popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map)
    })
  }

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initialPreset = BASEMAP_PRESETS[activeBasemap]
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialPreset.style as any,
      center: [77.215, 28.585], // South-Central Delhi
      zoom: 12.0,
      minZoom: 10,
      maxZoom: 17,
      attributionControl: false
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    // Attribution visible (compact: false) to meet MapTiler terms of use and cartographic attribution standards
    map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right')

    map.on('error', (e) => {
      const msg = e.error?.message || ''
      const status = (e.error as any)?.status
      if (msg.includes('abort') || msg.includes('canceled')) return

      if (
        status === 401 ||
        status === 403 ||
        msg.includes('403') ||
        msg.includes('401') ||
        msg.includes('Forbidden') ||
        msg.includes('Unauthorized') ||
        msg.includes('API KEY REQUIRED')
      ) {
        console.error('MapTiler key authorization error detected:', e.error)
        setKeyNotice({
          type: 'error',
          message:
            'MapTiler Cloud returned HTTP 403/401 (Invalid API key or quota limit). Gracefully falling back to OpenStreetMap / Carto basemap.'
        })

        const currentPreset = BASEMAP_PRESETS[activeBasemap]
        if (typeof currentPreset.style === 'string' && currentPreset.fallbackStyle) {
          map.setStyle(currentPreset.fallbackStyle as any)
          map.once('style.load', () => {
            addApplicationLayers(map)
            syncAllSourceData(map)
            syncVisibilityAndFilters(map)
          })
        }
      } else {
        console.warn('MapLibre resource event:', msg)
      }
    })

    map.on('load', () => {
      addApplicationLayers(map)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      handlersAttachedRef.current = false
    }
  }, [])

  // Handle Basemap Switch cleanly via map.setStyle and style.load
  const handleBasemapChange = (newPresetKey: BasemapId) => {
    const map = mapRef.current
    if (!map || newPresetKey === activeBasemap) return

    setActiveBasemap(newPresetKey)
    const newPreset = BASEMAP_PRESETS[newPresetKey]

    // Set new style replacing previous style cleanly
    map.setStyle(newPreset.style as any)

    // Re-add layers when new style finishes loading
    map.once('style.load', () => {
      addApplicationLayers(map)
      syncAllSourceData(map)
      syncVisibilityAndFilters(map)
    })
  }

  const syncAllSourceData = (map: maplibregl.Map) => {
    const heatSource = map.getSource('heat-grid') as maplibregl.GeoJSONSource
    if (heatSource && heatGridRef.current) {
      heatSource.setData(heatGridRef.current as any)
    }

    const greenSource = map.getSource('green-spaces') as maplibregl.GeoJSONSource
    if (greenSource && greenSpacesRef.current) {
      greenSource.setData(greenSpacesRef.current as any)
    }

    const boundSource = map.getSource('study-boundary') as maplibregl.GeoJSONSource
    if (boundSource && studyBoundaryRef.current) {
      boundSource.setData(studyBoundaryRef.current)
    }

    const candSource = map.getSource('candidate-corridors') as maplibregl.GeoJSONSource
    if (candSource && candidateCorridorsRef.current) {
      candSource.setData(candidateCorridorsRef.current as any)
    }

    const selectedSource = map.getSource('selected-corridors') as maplibregl.GeoJSONSource
    if (selectedSource) {
      const selectedGeojson =
        optimizedPlanRef.current?.selected_corridors_geojson || {
          type: 'FeatureCollection',
          features: []
        }
      selectedSource.setData(selectedGeojson as any)
    }
  }

  const syncVisibilityAndFilters = (map: maplibregl.Map) => {
    // Green spaces visibility
    const greenVis = showGreenSpacesRef.current ? 'visible' : 'none'
    if (map.getLayer('green-spaces-fill')) {
      map.setLayoutProperty('green-spaces-fill', 'visibility', greenVis)
      map.setLayoutProperty('green-spaces-line', 'visibility', greenVis)
      if (map.getLayer('green-spaces-labels')) {
        map.setLayoutProperty('green-spaces-labels', 'visibility', greenVis)
      }
    }

    // Candidates visibility
    const candVis = showCandidatesRef.current ? 'visible' : 'none'
    if (map.getLayer('candidate-corridors-line')) {
      map.setLayoutProperty('candidate-corridors-line', 'visibility', candVis)
      map.setLayoutProperty('candidate-corridors-casing', 'visibility', candVis)
      if (map.getLayer('candidate-corridors-hit')) {
        map.setLayoutProperty('candidate-corridors-hit', 'visibility', candVis)
      }
      if (map.getLayer('corridor-hover-highlight')) {
        map.setLayoutProperty('corridor-hover-highlight', 'visibility', candVis)
        map.setFilter('corridor-hover-highlight', ['==', 'candidate_id', ''])
      }
    }

    // Heat Grid visibility
    const heatVis = showHeatGridRef.current ? 'visible' : 'none'
    if (map.getLayer('heat-grid-fill')) {
      map.setLayoutProperty('heat-grid-fill', 'visibility', heatVis)
      map.setLayoutProperty('heat-grid-line', 'visibility', heatVis)
    }

    // Highlights
    if (map.getLayer('green-spaces-highlight')) {
      const id = selectedFeature?.properties?.id || selectedFeature?.id || ''
      map.setFilter('green-spaces-highlight', ['==', 'id', id])
    }
    if (map.getLayer('corridor-selection-highlight')) {
      const candId = selectedCandidate?.properties?.candidate_id || selectedCandidate?.id || ''
      map.setFilter('corridor-selection-highlight', ['==', 'candidate_id', candId])
    }

    // Selected green spaces rings
    if (map.getLayer('green-spaces-selected-ring')) {
      const pids = selectedPatchIdsRef.current || []
      if (pids.length > 0 && showGreenSpacesRef.current) {
        map.setFilter('green-spaces-selected-ring', ['in', 'id', ...pids])
        map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'visible')
      } else {
        map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'none')
      }
    }

    // Candidate opacity adjustment when plan exists
    if (map.getLayer('candidate-corridors-line')) {
      const hasSelected = (optimizedPlanRef.current?.selected_candidates?.length || 0) > 0
      map.setPaintProperty(
        'candidate-corridors-line',
        'line-opacity',
        hasSelected ? 0.35 : 0.75
      )
    }
  }

  // Sync green spaces layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyGreenVisibility = () => {
      const visibility = currentShowGreenSpaces ? 'visible' : 'none'
      if (map.getLayer('green-spaces-fill')) {
        map.setLayoutProperty('green-spaces-fill', 'visibility', visibility)
        map.setLayoutProperty('green-spaces-line', 'visibility', visibility)
        if (map.getLayer('green-spaces-labels')) {
          map.setLayoutProperty('green-spaces-labels', 'visibility', visibility)
        }
      }
      if (map.getLayer('green-spaces-selected-ring')) {
        const pids = selectedPatchIdsRef.current || []
        if (pids.length > 0 && currentShowGreenSpaces) {
          map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'visible')
        } else {
          map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'none')
        }
      }
    }

    if (map.isStyleLoaded()) {
      applyGreenVisibility()
    } else {
      map.once('load', applyGreenVisibility)
    }
  }, [currentShowGreenSpaces])

  // Sync selected patch rings
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applySelection = () => {
      if (map.getLayer('green-spaces-selected-ring')) {
        if (selectedPatchIds.length > 0 && currentShowGreenSpaces) {
          map.setFilter('green-spaces-selected-ring', ['in', 'id', ...selectedPatchIds])
          map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'visible')
        } else {
          map.setLayoutProperty('green-spaces-selected-ring', 'visibility', 'none')
        }
      }
    }

    if (map.isStyleLoaded()) {
      applySelection()
    } else {
      map.once('load', applySelection)
    }
  }, [selectedPatchIds, currentShowGreenSpaces])

  // Sync candidate corridor layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyVisibility = () => {
      const visibility = showCandidates ? 'visible' : 'none'
      if (map.getLayer('candidate-corridors-line')) {
        map.setLayoutProperty('candidate-corridors-line', 'visibility', visibility)
        map.setLayoutProperty('candidate-corridors-casing', 'visibility', visibility)
        if (map.getLayer('candidate-corridors-hit')) {
          map.setLayoutProperty('candidate-corridors-hit', 'visibility', visibility)
        }
        if (map.getLayer('corridor-hover-highlight')) {
          map.setLayoutProperty('corridor-hover-highlight', 'visibility', visibility)
          map.setFilter('corridor-hover-highlight', ['==', 'candidate_id', ''])
        }
      }
    }

    if (map.isStyleLoaded()) {
      applyVisibility()
    } else {
      map.once('load', applyVisibility)
    }
  }, [showCandidates])

  // Sync heat grid layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyHeatVisibility = () => {
      const visibility = showHeatGrid ? 'visible' : 'none'
      if (map.getLayer('heat-grid-fill')) {
        map.setLayoutProperty('heat-grid-fill', 'visibility', visibility)
        map.setLayoutProperty('heat-grid-line', 'visibility', visibility)
      }
    }

    if (map.isStyleLoaded()) {
      applyHeatVisibility()
    } else {
      map.once('load', applyHeatVisibility)
    }
  }, [showHeatGrid])

  // Update sources on prop updates
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateSources = () => {
      syncAllSourceData(map)

      if (map.getLayer('candidate-corridors-line')) {
        const hasSelected = (optimizedPlan?.selected_candidates?.length || 0) > 0
        map.setPaintProperty(
          'candidate-corridors-line',
          'line-opacity',
          hasSelected ? 0.35 : 0.95
        )
      }
    }

    if (map.isStyleLoaded()) {
      updateSources()
    } else {
      map.once('load', updateSources)
    }
  }, [greenSpaces, studyBoundary, candidateCorridors, heatGrid, optimizedPlan])

  // Sync highlight filters
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const applyFilters = () => {
      if (map.getLayer('green-spaces-highlight')) {
        const id = selectedFeature?.properties?.id || selectedFeature?.id || ''
        map.setFilter('green-spaces-highlight', ['==', 'id', id])
      }

      if (map.getLayer('corridor-selection-highlight')) {
        const candId = selectedCandidate?.properties?.candidate_id || selectedCandidate?.id || ''
        map.setFilter('corridor-selection-highlight', ['==', 'candidate_id', candId])
      }
    }

    if (map.isStyleLoaded()) {
      applyFilters()
    } else {
      map.once('load', applyFilters)
    }
  }, [selectedFeature, selectedCandidate])

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [77.215, 28.585],
        zoom: 12.0,
        pitch: 0,
        bearing: 0,
        essential: true
      })
    }
  }

  const candidateCount = candidateCorridors?.features?.length || 0
  const selectedCount = optimizedPlan?.selected_candidates?.length || 0
  const selectedLengthKm = optimizedPlan?.metadata?.total_network_length_km || 0

  return (
    <div className="relative w-full h-full bg-[#F7F6F0] overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Visible API Key Notice / Error Banner */}
      {keyNotice && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-lg shadow-lg border text-xs max-w-lg transition-all ${
            keyNotice.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
          role="alert"
          id="maptiler-key-notice"
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 ${
              keyNotice.type === 'error' ? 'text-rose-600' : 'text-amber-600'
            }`}
          />
          <div className="flex-1 font-medium">{keyNotice.message}</div>
          <button
            onClick={() => setKeyNotice(null)}
            className="p-1 rounded hover:bg-black/5 text-current opacity-70 hover:opacity-100 cursor-pointer"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Map Workstation Controls (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Reset Extent Button */}
        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#FAF9F5] text-[#1D2A22] text-xs font-semibold border border-[#D5D1C3] shadow-md transition-all cursor-pointer"
          title="Reset map view to South-Central Delhi extent"
          id="reset-extent-btn"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#285943]" />
          <span>Reset Extent</span>
        </button>

        {/* Basemap Switcher Selector Pill */}
        <div className="flex items-center bg-white p-0.5 rounded-md border border-[#D5D1C3] shadow-md text-xs">
          <button
            onClick={() => handleBasemapChange('streets')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'streets'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="MapTiler Streets v2 (clean light street map)"
            id="basemap-streets-btn"
          >
            <MapIcon className="w-3 h-3" />
            <span>Street</span>
          </button>

          <button
            onClick={() => handleBasemapChange('satellite')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'satellite'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="MapTiler Satellite (high-resolution aerial imagery)"
            id="basemap-satellite-btn"
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => handleBasemapChange('hybrid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'hybrid'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="MapTiler Hybrid (aerial imagery with street labels)"
            id="basemap-hybrid-btn"
          >
            <span>Hybrid</span>
          </button>

          <button
            onClick={() => handleBasemapChange('dataviz')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'dataviz'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="MapTiler Dataviz Light (muted analytical GIS map)"
            id="basemap-dataviz-btn"
          >
            <span>Muted GIS</span>
          </button>
        </div>

        {/* Quick Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
          {/* Green Spaces Toggle */}
          <button
            onClick={handleToggleGreenSpaces}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border shadow-md transition-all cursor-pointer ${
              currentShowGreenSpaces
                ? 'bg-[#EBF2ED] text-[#285943] border-[#285943]'
                : 'bg-white text-[#607065] border-[#D5D1C3] hover:bg-[#FAF9F5]'
            }`}
            title="Toggle verified green spaces"
            id="map-toggle-green-spaces-btn"
          >
            <Trees className="w-3 h-3" />
            <span>Green Spaces ({greenSpaces?.features?.length || 12})</span>
            {currentShowGreenSpaces ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* Candidate Corridors Toggle */}
          <button
            onClick={onToggleCandidates}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border shadow-md transition-all cursor-pointer ${
              showCandidates
                ? 'bg-[#FAF6ED] text-[#C28B39] border-[#C28B39]'
                : 'bg-white text-[#607065] border-[#D5D1C3] hover:bg-[#FAF9F5]'
            }`}
            title="Toggle benchmark candidate corridor routes"
            id="map-toggle-candidates-btn"
          >
            <Route className="w-3 h-3" />
            <span>Corridors ({candidateCount})</span>
            {showCandidates ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

          {/* Heat Priority Grid Toggle */}
          {onToggleHeatGrid && (
            <button
              onClick={onToggleHeatGrid}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border shadow-md transition-all cursor-pointer ${
                showHeatGrid
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-white text-[#607065] border-[#D5D1C3] hover:bg-[#FAF9F5]'
              }`}
              title="Toggle urban heat priority grid"
              id="map-toggle-heat-btn"
            >
              <Flame className="w-3 h-3" />
              <span>Heat Grid</span>
              {showHeatGrid ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Map Legend (Bottom Left) - Synchronized with visible layers */}
      <div className="absolute bottom-6 left-4 z-10 bg-white/95 border border-[#D5D1C3] p-3.5 rounded-lg shadow-lg text-xs text-[#4A5850] max-w-xs backdrop-blur-xs">
        <div className="flex items-center gap-2 font-bold text-[#1D2A22] mb-2.5">
          <Layers className="w-3.5 h-3.5 text-[#285943]" />
          <span>Spatial Planning Legend</span>
        </div>

        <div className="space-y-2">
          {/* Selected Corridors Legend Item - only if plan exists */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded bg-[#059669] border border-[#064E3B] shrink-0" />
              <span className="text-[#059669] font-bold">
                Selected Corridors ({selectedCount} routes, {selectedLengthKm} km)
              </span>
            </div>
          )}

          {/* Verified Green Spaces - only when enabled */}
          {currentShowGreenSpaces && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#285943]/20 border border-[#2D6A4F] shrink-0" />
              <span className="text-[#1D2A22] font-medium">Verified Green Spaces (OSM)</span>
            </div>
          )}

          {/* Candidate Corridors - only when enabled */}
          {showCandidates && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-[#D99B38] shrink-0" />
              <span className="text-[#C28B39] font-medium">
                {selectedCount > 0 ? 'Unselected Candidates' : 'Candidate Corridors'} ({candidateCount} Routes)
              </span>
            </div>
          )}

          {/* Study Boundary - always visible subtle baseline */}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-[#285943]/60 shrink-0" />
            <span className="text-[#607065]">Study Boundary (~131.8 km²)</span>
          </div>

          {/* Heat Grid Legend Bar - only when enabled */}
          {showHeatGrid && (
            <div className="pt-2 border-t border-[#E8E5DA]">
              <div className="flex items-center justify-between text-[10px] text-[#607065] mb-1">
                <span>Heat Vulnerability (Proxy)</span>
                <span className="font-mono text-rose-700">Cool → High</span>
              </div>
              <div className="h-2 w-full rounded bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 via-orange-500 to-red-500 opacity-80" />
            </div>
          )}

          {/* Subtle notice when all analytical layers are hidden */}
          {!currentShowGreenSpaces && !showCandidates && selectedCount === 0 && !showHeatGrid && (
            <div className="text-[10px] text-[#7A8A7F] italic pt-0.5">
              Overlays hidden • Enable via top controls
            </div>
          )}

          <div className="pt-2 border-t border-[#E8E5DA] text-[10px] text-[#7A8A7F] flex items-center justify-between">
            <span>
              Basemap:{' '}
              {BASEMAP_PRESETS[activeBasemap]?.name || 'Street'}
            </span>
            <span className="text-[#285943] font-mono text-[9px] uppercase font-bold">
              {BASEMAP_PRESETS[activeBasemap]?.type || 'vector'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

