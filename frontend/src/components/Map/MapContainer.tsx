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
  Globe
} from 'lucide-react'

// Set MapLibre worker bundle URL to prevent runtime worker 404 errors with Vite
maplibregl.setWorkerUrl(maplibreWorkerUrl)

// Basemap Provider Configurations
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY

const BASEMAP_PRESETS = {
  bright: {
    id: 'bright',
    name: 'Detailed Street',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`
      : 'https://tiles.openfreemap.org/styles/bright',
    type: 'vector'
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Aerial',
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
      : {
          version: 8,
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
        },
    type: 'raster'
  },
  positron: {
    id: 'positron',
    name: 'Positron Muted',
    style: 'https://tiles.openfreemap.org/styles/positron',
    type: 'vector'
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
  showCandidates: boolean
  showHeatGrid?: boolean
  onToggleCandidates: () => void
  onToggleHeatGrid?: () => void
  onSelectFeature: (feature: GreenSpaceFeature | null) => void
  onSelectCandidate: (candidate: CandidateCorridorFeature | null) => void
  onInspectStreet?: (candidate: CandidateCorridorFeature) => void
}

export const MapContainer: React.FC<MapContainerProps> = ({
  greenSpaces,
  studyBoundary,
  candidateCorridors,
  heatGrid = null,
  optimizedPlan,
  selectedFeature,
  selectedCandidate,
  showCandidates,
  showHeatGrid = false,
  onToggleCandidates,
  onToggleHeatGrid,
  onSelectFeature,
  onSelectCandidate,
  onInspectStreet
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  const [activeBasemap, setActiveBasemap] = useState<'bright' | 'satellite' | 'positron'>('bright')

  // Mutable refs to prevent stale closures in MapLibre event handlers
  const greenSpacesRef = useRef(greenSpaces)
  const studyBoundaryRef = useRef(studyBoundary)
  const candidateCorridorsRef = useRef(candidateCorridors)
  const heatGridRef = useRef(heatGrid)
  const optimizedPlanRef = useRef(optimizedPlan)
  const onSelectFeatureRef = useRef(onSelectFeature)
  const onSelectCandidateRef = useRef(onSelectCandidate)
  const onInspectStreetRef = useRef(onInspectStreet)
  const showCandidatesRef = useRef(showCandidates)
  const showHeatGridRef = useRef(showHeatGrid)

  useEffect(() => {
    greenSpacesRef.current = greenSpaces
    studyBoundaryRef.current = studyBoundary
    candidateCorridorsRef.current = candidateCorridors
    heatGridRef.current = heatGrid
    optimizedPlanRef.current = optimizedPlan
    onSelectFeatureRef.current = onSelectFeature
    onSelectCandidateRef.current = onSelectCandidate
    onInspectStreetRef.current = onInspectStreet
    showCandidatesRef.current = showCandidates
    showHeatGridRef.current = showHeatGrid
  }, [
    greenSpaces,
    studyBoundary,
    candidateCorridors,
    heatGrid,
    optimizedPlan,
    onSelectFeature,
    onSelectCandidate,
    onInspectStreet,
    showCandidates,
    showHeatGrid
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
          'fill-opacity': 0.35
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
          'line-width': 0.75,
          'line-opacity': 0.3
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
          'line-width': 2.0,
          'line-dasharray': [4, 3],
          'line-opacity': 0.7
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
          'line-width': 4.5,
          'line-opacity': 0.65
        }
      })
    }

    // Active warm amber dashed candidate line
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
          'line-color': '#C28B39',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.95
        }
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
          'line-color': '#0F3D1F',
          'line-width': 7.0,
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
          'line-color': '#15803D',
          'line-width': 4.5,
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
          'line-width': 6.0,
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

    // Warm forest green polygon fill
    if (!map.getLayer('green-spaces-fill')) {
      map.addLayer({
        id: 'green-spaces-fill',
        type: 'fill',
        source: 'green-spaces',
        paint: {
          'fill-color': '#285943',
          'fill-opacity': 0.5
        }
      })
    }

    if (!map.getLayer('green-spaces-line')) {
      map.addLayer({
        id: 'green-spaces-line',
        type: 'line',
        source: 'green-spaces',
        paint: {
          'line-color': '#1E4332',
          'line-width': 1.5,
          'line-opacity': 0.9
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
          'line-width': 3.5
        },
        filter: ['==', 'id', '']
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
    map.on('mouseenter', 'candidate-corridors-hit', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'candidate-corridors-hit', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'candidate-corridors-hit', (e) => handleCorridorClick(e, map))

    map.on('mouseenter', 'selected-corridors-line', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'selected-corridors-line', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'selected-corridors-line', (e) => handleCorridorClick(e, map))

    // Green Spaces Click & Hover
    map.on('mouseenter', 'green-spaces-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'green-spaces-fill', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'green-spaces-fill', (e: any) => {
      if (!e.features || e.features.length === 0) return
      const feat = e.features[0] as unknown as GreenSpaceFeature
      onSelectFeatureRef.current(feat)
      onSelectCandidateRef.current(null)

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
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('error', (e) => {
      if (e.error?.message?.includes('abort')) return
      console.warn('MapLibre resource event:', e.error?.message || e)
    })

    map.on('load', () => {
      addApplicationLayers(map)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Handle Basemap Switch cleanly via map.setStyle and style.load
  const handleBasemapChange = (newPresetKey: 'bright' | 'satellite' | 'positron') => {
    const map = mapRef.current
    if (!map || newPresetKey === activeBasemap) return

    setActiveBasemap(newPresetKey)
    const newPreset = BASEMAP_PRESETS[newPresetKey]

    // Set new style
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
    // Candidates visibility
    const candVis = showCandidatesRef.current ? 'visible' : 'none'
    if (map.getLayer('candidate-corridors-line')) {
      map.setLayoutProperty('candidate-corridors-line', 'visibility', candVis)
      map.setLayoutProperty('candidate-corridors-casing', 'visibility', candVis)
      if (map.getLayer('candidate-corridors-hit')) {
        map.setLayoutProperty('candidate-corridors-hit', 'visibility', candVis)
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

    // Candidate opacity adjustment when plan exists
    if (map.getLayer('candidate-corridors-line')) {
      const hasSelected = (optimizedPlanRef.current?.selected_candidates?.length || 0) > 0
      map.setPaintProperty(
        'candidate-corridors-line',
        'line-opacity',
        hasSelected ? 0.35 : 0.95
      )
    }
  }

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
            onClick={() => handleBasemapChange('bright')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'bright'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="Detailed light street map (preferred default)"
            id="basemap-bright-btn"
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
            title="High-resolution aerial satellite imagery"
            id="basemap-satellite-btn"
          >
            <Globe className="w-3 h-3" />
            <span>Satellite</span>
          </button>

          <button
            onClick={() => handleBasemapChange('positron')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              activeBasemap === 'positron'
                ? 'bg-[#285943] text-white shadow-xs'
                : 'text-[#607065] hover:text-[#1D2A22]'
            }`}
            title="Positron muted analytical vector map"
            id="basemap-positron-btn"
          >
            <span>Positron</span>
          </button>
        </div>

        {/* Quick Layer Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleCandidates}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border shadow-md transition-all cursor-pointer ${
              showCandidates
                ? 'bg-[#FAF6ED] text-[#C28B39] border-[#C28B39]'
                : 'bg-white text-[#607065] border-[#D5D1C3] hover:bg-[#FAF9F5]'
            }`}
            title="Toggle candidate corridor routes"
            id="map-toggle-candidates-btn"
          >
            <Route className="w-3 h-3" />
            <span>Corridors ({candidateCount})</span>
            {showCandidates ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>

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

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 bg-white/95 border border-[#D5D1C3] p-3.5 rounded-lg shadow-lg text-xs text-[#4A5850] max-w-xs backdrop-blur-xs">
        <div className="flex items-center gap-2 font-bold text-[#1D2A22] mb-2.5">
          <Layers className="w-3.5 h-3.5 text-[#285943]" />
          <span>Spatial Planning Legend</span>
        </div>

        <div className="space-y-2">
          {/* Selected Corridors Legend Item */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded bg-[#15803D] border border-[#0F3D1F] shrink-0" />
              <span className="text-[#15803D] font-bold">
                Selected Corridors ({selectedCount} routes, {selectedLengthKm} km)
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-[#285943]/60 border border-[#1E4332] shrink-0" />
            <span className="text-[#1D2A22] font-medium">Verified Green Spaces (OSM)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-[#C28B39] shrink-0" />
            <span className={showCandidates ? 'text-[#C28B39] font-medium' : 'text-slate-400'}>
              {selectedCount > 0 ? 'Unselected Candidates' : 'Candidate Corridors'} ({candidateCount} Street Routes)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-[#285943] shrink-0" />
            <span className="text-[#607065]">Study Boundary (~131.8 km²)</span>
          </div>

          {/* Heat Grid Legend Bar */}
          {showHeatGrid && (
            <div className="pt-2 border-t border-[#E8E5DA]">
              <div className="flex items-center justify-between text-[10px] text-[#607065] mb-1">
                <span>Heat Vulnerability (Proxy)</span>
                <span className="font-mono text-rose-700">Cool → High</span>
              </div>
              <div className="h-2 w-full rounded bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 via-orange-500 to-red-500" />
            </div>
          )}

          <div className="pt-2 border-t border-[#E8E5DA] text-[10px] text-[#7A8A7F] flex items-center justify-between">
            <span>
              Basemap:{' '}
              {activeBasemap === 'bright'
                ? 'OpenFreeMap Bright'
                : activeBasemap === 'satellite'
                ? 'Esri World Imagery'
                : 'OpenFreeMap Positron'}
            </span>
            <span className="text-[#285943] font-mono text-[9px] uppercase font-bold">
              {BASEMAP_PRESETS[activeBasemap].type}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
