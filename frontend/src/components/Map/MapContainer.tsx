import React, { useEffect, useRef } from 'react'
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
import { Layers, Maximize2, Route, Eye, EyeOff, Flame } from 'lucide-react'

// Set MapLibre worker bundle URL to prevent runtime worker 404 errors with Vite
maplibregl.setWorkerUrl(maplibreWorkerUrl)

// Default basemap is OpenFreeMap Positron: clean, neutral vector style, 100% open & no API key required
const DEFAULT_BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

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
  onSelectCandidate
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  // Mutable refs to prevent stale closure data in MapLibre event handlers
  const greenSpacesRef = useRef(greenSpaces)
  const studyBoundaryRef = useRef(studyBoundary)
  const candidateCorridorsRef = useRef(candidateCorridors)
  const heatGridRef = useRef(heatGrid)
  const optimizedPlanRef = useRef(optimizedPlan)
  const onSelectFeatureRef = useRef(onSelectFeature)
  const onSelectCandidateRef = useRef(onSelectCandidate)
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
    showCandidates,
    showHeatGrid
  ])

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const basemapStyle =
      import.meta.env.VITE_BASEMAP_STYLE || DEFAULT_BASEMAP_STYLE

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyle,
      center: [77.215, 28.585], // South-Central Delhi
      zoom: 12.0,
      minZoom: 10,
      maxZoom: 17,
      attributionControl: false
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('error', (e) => {
      // Don't warn on tile requests aborted during rapid panning
      if (e.error?.message?.includes('abort')) return
      console.warn('MapLibre resource event:', e.error?.message || e)
    })

    map.on('load', () => {
      // 0. Urban Heat Vulnerability Proxy Grid (Underneath all layers)
      const heatData =
        heatGridRef.current || heatGrid || { type: 'FeatureCollection', features: [] }
      map.addSource('heat-grid', {
        type: 'geojson',
        data: heatData as any
      })

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
            0.1, '#3b82f6',
            0.35, '#06b6d4',
            0.55, '#eab308',
            0.75, '#f97316',
            0.95, '#ef4444'
          ],
          'fill-opacity': 0.35
        }
      })

      map.addLayer({
        id: 'heat-grid-line',
        type: 'line',
        source: 'heat-grid',
        layout: {
          visibility: showHeatGridRef.current ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.75,
          'line-opacity': 0.25
        }
      })

      // Heat Grid Cell Click & Hover
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
          <div style="font-family: inherit; max-width: 240px;">
            <div style="font-size: 10px; font-weight: 700; color: #f97316; text-transform: uppercase; margin-bottom: 2px;">
              Urban Heat Proxy Cell (${props.id})
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">
              Thermal Priority: ${(score * 100).toFixed(0)}%
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
              Vulnerability Tier: <strong style="color: ${score >= 0.7 ? '#ef4444' : score >= 0.5 ? '#f59e0b' : '#38bdf8'};">${props.vulnerability_tier || 'Moderate'}</strong>
            </div>
            <div style="font-size: 10px; color: #64748b; border-top: 1px solid #334155; padding-top: 4px; font-style: italic;">
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

      // 1. Study Boundary Layer
      const boundData =
        studyBoundaryRef.current || studyBoundary || { type: 'FeatureCollection', features: [] }
      map.addSource('study-boundary', {
        type: 'geojson',
        data: boundData
      })

      map.addLayer({
        id: 'study-boundary-fill',
        type: 'fill',
        source: 'study-boundary',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.04
        }
      })

      map.addLayer({
        id: 'study-boundary-line',
        type: 'line',
        source: 'study-boundary',
        paint: {
          'line-color': '#0284c7',
          'line-width': 2,
          'line-dasharray': [4, 3]
        }
      })

      // 2. Candidate Corridors Layers (Under green patches for neat rendering)
      const candData =
        candidateCorridorsRef.current || candidateCorridors || { type: 'FeatureCollection', features: [] }
      map.addSource('candidate-corridors', {
        type: 'geojson',
        data: candData as any
      })

      // Dark casing behind dashed corridor for contrast against satellite/road basemaps
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
          'line-color': '#020617',
          'line-width': 4.5,
          'line-opacity': 0.7
        }
      })

      // Active dashed corridor line (amber)
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
          'line-color': '#f59e0b',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.9
        }
      })

      // 3. Optimized Selected Corridors Layer (Vibrant emerald solid lines)
      const selectedData =
        optimizedPlanRef.current?.selected_corridors_geojson || { type: 'FeatureCollection', features: [] }
      map.addSource('selected-corridors', {
        type: 'geojson',
        data: selectedData as any
      })

      // Deep emerald casing for high contrast on light basemap
      map.addLayer({
        id: 'selected-corridors-casing',
        type: 'line',
        source: 'selected-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#022c22',
          'line-width': 7.0,
          'line-opacity': 0.95
        }
      })

      // Glowing emerald line
      map.addLayer({
        id: 'selected-corridors-line',
        type: 'line',
        source: 'selected-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 4.5,
          'line-opacity': 1.0
        }
      })

      // Highlight line when selected
      map.addLayer({
        id: 'corridor-selection-highlight',
        type: 'line',
        source: 'candidate-corridors',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 6.0,
          'line-opacity': 0.95
        },
        filter: ['==', 'candidate_id', '']
      })

      // 4. Green Spaces Layers
      const greenData =
        greenSpacesRef.current || greenSpaces || { type: 'FeatureCollection', features: [] }
      map.addSource('green-spaces', {
        type: 'geojson',
        data: greenData as any
      })

      map.addLayer({
        id: 'green-spaces-fill',
        type: 'fill',
        source: 'green-spaces',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.65
        }
      })

      map.addLayer({
        id: 'green-spaces-line',
        type: 'line',
        source: 'green-spaces',
        paint: {
          'line-color': '#047857',
          'line-width': 1.5
        }
      })

      map.addLayer({
        id: 'green-spaces-highlight',
        type: 'line',
        source: 'green-spaces',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 3.5
        },
        filter: ['==', 'id', '']
      })

      // 5. Corridors Hit Area Layer (For clicking both selected and unselected corridors easily)
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
          'line-width': 20.0,
          'line-opacity': 0.001
        }
      })

      // Unified Corridor Click Handler
      const handleCorridorClick = (e: any) => {
        if (!e.features || e.features.length === 0) return
        const feat = e.features[0] as unknown as CandidateCorridorFeature
        onSelectCandidateRef.current(feat)
        onSelectFeatureRef.current(null)

        const props = feat.properties
        const candId = props.candidate_id

        // Check if corridor is selected in current optimization plan
        const plan = optimizedPlanRef.current
        const selectionDetail = plan?.selected_candidates?.find(
          (sc) => sc.candidate_id === candId
        )
        const exclusionDetail = plan?.excluded_candidates?.find(
          (ec) => ec.candidate_id === candId
        )

        const costStr = props.estimated_cost_inr
          ? `₹${(props.estimated_cost_inr / 10000000).toFixed(2)} Cr`
          : 'Provisional'

        let statusBadge = ''
        let rationaleSection = ''

        if (selectionDetail) {
          statusBadge = `
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #10b981; background: #064e3b; padding: 2px 6px; border-radius: 4px; border: 1px solid #059669; text-transform: uppercase;">
                ✓ Selected (Step #${selectionDetail.step})
              </span>
              <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
                ${candId}
              </span>
            </div>
          `
          rationaleSection = `
            <div style="background: #0f172a; padding: 6px 8px; border-radius: 6px; border: 1px solid #1e293b; margin-top: 6px;">
              <div style="font-size: 10px; color: #10b981; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">
                Selection Rationale:
              </div>
              <div style="font-size: 10px; color: #cbd5e1; line-height: 1.35;">
                ${selectionDetail.selection_rationale}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 4px; border-top: 1px solid #334155; padding-top: 4px;">
                <span>Benefit: <strong style="color: #f8fafc;">+${selectionDetail.marginal_benefit.toFixed(2)}</strong></span>
                <span>Efficiency: <strong style="color: #10b981;">${selectionDetail.efficiency_ratio.toFixed(2)}</strong></span>
              </div>
            </div>
          `
        } else if (exclusionDetail) {
          statusBadge = `
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 600; color: #f59e0b; background: #451a03; padding: 2px 6px; border-radius: 4px; border: 1px solid #78350f; text-transform: uppercase;">
                Candidate (Not Selected)
              </span>
              <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">
                ${candId}
              </span>
            </div>
          `
          rationaleSection = `
            <div style="background: #0f172a; padding: 6px 8px; border-radius: 6px; border: 1px solid #1e293b; margin-top: 6px;">
              <div style="font-size: 10px; color: #f59e0b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px;">
                Exclusion Reason:
              </div>
              <div style="font-size: 10px; color: #cbd5e1; line-height: 1.35;">
                ${exclusionDetail.exclusion_reason}
              </div>
            </div>
          `
        } else {
          statusBadge = `
            <div style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; margin-bottom: 2px;">
              Candidate Corridor (${candId})
            </div>
          `
        }

        const html = `
          <div style="font-family: inherit; max-width: 280px; line-height: 1.3;">
            ${statusBadge}
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #f8fafc;">
              ${props.name}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
              Route: <strong>${props.source_name}</strong> ↔ <strong>${props.target_name}</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; border-top: 1px solid #334155; padding-top: 4px;">
              <div><span style="color: #64748b;">Length:</span> <strong>${props.length_km} km</strong></div>
              <div><span style="color: #64748b;">Cost:</span> <strong style="color: #f59e0b;">${costStr}</strong></div>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic;">
              ${props.primary_streets || 'Street-network route'}
            </div>
            ${rationaleSection}
          </div>
        `

        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map)
      }

      map.on('mouseenter', 'candidate-corridors-hit', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'candidate-corridors-hit', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', 'candidate-corridors-hit', handleCorridorClick)

      map.on('mouseenter', 'selected-corridors-line', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'selected-corridors-line', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', 'selected-corridors-line', handleCorridorClick)

      // Green Space Click & Hover
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
          <div style="font-family: inherit;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #10b981;">
              ${props.name}
            </div>
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">
              OSM Green Anchor (${props.osm_type || 'park'})
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
              <div><span style="color: #64748b;">Area:</span> <strong>${props.area_hectares} ha</strong></div>
              <div><span style="color: #64748b;">Perimeter:</span> <strong>${Math.round(props.perimeter_meters)} m</strong></div>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-style: italic; border-top: 1px solid #334155; padding-top: 4px;">
              OpenStreetMap green-space polygon (planning landmark; not field-surveyed habitat).
            </div>
          </div>
        `

        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map)
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

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

  // Update sources on prop updates (including selected-corridors and heat-grid)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateSources = () => {
      const heatSource = map.getSource('heat-grid') as maplibregl.GeoJSONSource
      if (heatSource && heatGrid) {
        heatSource.setData(heatGrid as any)
      }

      const greenSource = map.getSource('green-spaces') as maplibregl.GeoJSONSource
      if (greenSource && greenSpaces) {
        greenSource.setData(greenSpaces as any)
      }

      const boundSource = map.getSource('study-boundary') as maplibregl.GeoJSONSource
      if (boundSource && studyBoundary) {
        boundSource.setData(studyBoundary)
      }

      const candSource = map.getSource('candidate-corridors') as maplibregl.GeoJSONSource
      if (candSource && candidateCorridors) {
        candSource.setData(candidateCorridors as any)
      }

      const selectedSource = map.getSource('selected-corridors') as maplibregl.GeoJSONSource
      if (selectedSource) {
        const selectedGeojson =
          optimizedPlan?.selected_corridors_geojson || { type: 'FeatureCollection', features: [] }
        selectedSource.setData(selectedGeojson as any)
      }

      // Adjust candidate layer opacity when optimization plan is active
      if (map.getLayer('candidate-corridors-line')) {
        const hasSelected = (optimizedPlan?.selected_candidates?.length || 0) > 0
        map.setPaintProperty(
          'candidate-corridors-line',
          'line-opacity',
          hasSelected ? 0.35 : 0.9
        )
        map.setPaintProperty(
          'candidate-corridors-casing',
          'line-opacity',
          hasSelected ? 0.3 : 0.7
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
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/80 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
          title="Reset map view to South-Central Delhi extent"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset Extent</span>
        </button>

        {/* Candidate Layer Toggle Button */}
        <button
          onClick={onToggleCandidates}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
            showCandidates
              ? 'bg-amber-950/90 hover:bg-amber-900/90 text-amber-200 border-amber-600/70'
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Toggle display of street-aligned candidate green corridors"
        >
          <Route className={`w-3.5 h-3.5 ${showCandidates ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>Candidate Corridors ({candidateCount})</span>
          {showCandidates ? (
            <Eye className="w-3 h-3 text-amber-400 ml-0.5" />
          ) : (
            <EyeOff className="w-3 h-3 text-slate-500 ml-0.5" />
          )}
        </button>

        {/* Heat Vulnerability Grid Overlay Toggle */}
        {onToggleHeatGrid && (
          <button
            onClick={onToggleHeatGrid}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border shadow-lg backdrop-blur-sm transition-all cursor-pointer ${
              showHeatGrid
                ? 'bg-rose-950/90 hover:bg-rose-900/90 text-rose-200 border-rose-600/70'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle urban heat vulnerability proxy grid overlay"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatGrid ? 'text-rose-400' : 'text-slate-500'}`} />
            <span>Heat Priority Grid</span>
            {showHeatGrid ? (
              <Eye className="w-3 h-3 text-rose-400 ml-0.5" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-500 ml-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 left-4 z-10 bg-slate-900/95 border border-slate-800 p-3.5 rounded-lg shadow-xl backdrop-blur-md text-xs text-slate-300 max-w-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-100 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Spatial Planning Layers</span>
        </div>
        <div className="space-y-2">
          {/* Selected Corridors Legend Item */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded bg-emerald-500 border border-emerald-300 shadow-sm shrink-0" />
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <span>Selected Corridors ({selectedCount} routes, {selectedLengthKm} km)</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/70 border border-emerald-400 shrink-0" />
            <span>Verified Green Spaces (OSM)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-amber-400 shrink-0" />
            <span className={showCandidates ? 'text-amber-200' : 'text-slate-500'}>
              {selectedCount > 0 ? 'Unselected Candidates' : 'Candidate Corridors'} ({candidateCount} Street Routes)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-cyan-400 shrink-0" />
            <span>Study Boundary (~131.8 km²)</span>
          </div>

          {/* Heat Grid Legend Bar */}
          {showHeatGrid && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Heat Vulnerability (Proxy)</span>
                <span className="font-mono text-rose-400">Cool → Hot</span>
              </div>
              <div className="h-2 w-full rounded bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 via-orange-500 to-red-500" />
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Basemap: OpenFreeMap Positron</span>
            <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider">Vector</span>
          </div>
        </div>
      </div>
    </div>
  )
}
