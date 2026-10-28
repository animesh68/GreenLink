import type {
  HealthStatus,
  StudyAreaMetadata,
  GreenSpaceCollection,
  CandidateCorridorCollection,
  CandidateSummary,
  OptimizationResponse,
  ScenarioComparisonResponse,
  HeatGridCollection,
  CustomPlanningPoint,
  UserDirectedPlanningResponse
} from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

export async function fetchHealth(): Promise<{ data: HealthStatus; isLive: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, isLive: true }
  } catch (err) {
    return {
      data: {
        status: 'offline',
        application: 'GreenLink Delhi (Client Fallback)',
        version: '0.1.0'
      },
      isLive: false
    }
  }
}

export async function fetchStudyArea(): Promise<{ data: StudyAreaMetadata; fromBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/study-area`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, fromBackend: true }
  } catch (err) {
    const staticRes = await fetch('/data/study_boundary.geojson')
    const boundaryGeojson = await staticRes.json()
    
    return {
      data: {
        study_area_name: 'South-Central Delhi Study Area',
        bounding_box: {
          southwest: { longitude: 77.160, latitude: 28.530 },
          northeast: { longitude: 77.270, latitude: 28.640 }
        },
        crs: {
          storage_and_display: 'EPSG:4326',
          metric_computations: 'EPSG:32643'
        },
        area_approx_km2: 131.8,
        is_official_administrative_boundary: false,
        notes: 'Geometric study bounding box enclosing primary South-Central Delhi ecological anchors. Not an official administrative boundary.',
        data_summary: {
          green_patches_count: 12,
          total_green_area_hectares: 1752.72,
          primary_source: 'OpenStreetMap (ODbL, © OpenStreetMap contributors)',
          retrieval_status: 'Loaded via local static fallback'
        },
        boundary_geojson: boundaryGeojson
      },
      fromBackend: false
    }
  }
}

export async function fetchGreenSpaces(): Promise<{ data: GreenSpaceCollection; fromBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/green-spaces`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, fromBackend: true }
  } catch (err) {
    const staticRes = await fetch('/data/green_patches.geojson')
    const data = await staticRes.json()
    return { data, fromBackend: false }
  }
}

export async function fetchCandidateCorridors(): Promise<{ data: CandidateCorridorCollection; fromBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/candidate-corridors`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, fromBackend: true }
  } catch (err) {
    const staticRes = await fetch('/data/candidate_corridors.geojson')
    const data = await staticRes.json()
    return { data, fromBackend: false }
  }
}

export async function fetchCandidateSummary(): Promise<{ data: CandidateSummary; fromBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/candidate-corridors/summary`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, fromBackend: true }
  } catch (err) {
    return {
      data: {
        total_candidates: 14,
        total_length_km: 46.95,
        length_stats_m: {
          min: 1915.2,
          median: 3621.2,
          max: 4444.6
        },
        total_provisional_cost_inr: 204368000.0,
        generation_method: 'NetworkX Dijkstra shortest-path along OSM walkable/urban roads',
        routing_network: 'OpenStreetMap Real Walkable/Urban Streets',
        status: 'active'
      },
      fromBackend: false
    }
  }
}

export async function fetchHeatPriorityGrid(): Promise<{ data: HeatGridCollection; fromBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/heat-priority-grid`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const data = await res.json()
    return { data, fromBackend: true }
  } catch (err) {
    const staticRes = await fetch('/data/heat_priority_grid.geojson')
    const data = await staticRes.json()
    return { data, fromBackend: false }
  }
}

export async function optimizePlan(
  budgetInr: number,
  profile: 'connectivity_first' | 'heat_priority_first'
): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE_URL}/plan/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      budget_inr: budgetInr,
      profile: profile
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Optimization request failed with status ${res.status}`)
  }

  return await res.json()
}

export async function compareScenarios(budgetInr: number): Promise<ScenarioComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/plan/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      budget_inr: budgetInr
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Scenario comparison failed with status ${res.status}`)
  }

  return await res.json()
}

export async function generateUserCorridors(
  selectedPatchIds: string[],
  customPoints?: CustomPlanningPoint[],
  budgetInr?: number,
  profile?: 'connectivity_first' | 'heat_priority_first'
): Promise<UserDirectedPlanningResponse> {
  const res = await fetch(`${API_BASE_URL}/plan/user-corridors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selected_patch_ids: selectedPatchIds,
      custom_points: customPoints && customPoints.length > 0 ? customPoints : undefined,
      budget_inr: budgetInr,
      profile: profile || 'connectivity_first'
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Corridor generation failed with status ${res.status}`)
  }

  return await res.json()
}

const detailCache: Record<string, any> = {}

export async function fetchGreenSpaceDetail(id: string): Promise<any> {
  const cacheKey = `greenspace_${id.toLowerCase()}`
  if (detailCache[cacheKey]) return detailCache[cacheKey]

  try {
    const res = await fetch(`${API_BASE_URL}/green-spaces/${id}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      detailCache[cacheKey] = data
      return data
    }
  } catch {
    // fallback gracefully
  }
  return null
}

export async function fetchCorridorDetail(id: string): Promise<any> {
  const cacheKey = `corridor_${id.toLowerCase()}`
  if (detailCache[cacheKey]) return detailCache[cacheKey]

  try {
    const res = await fetch(`${API_BASE_URL}/corridors/${id}`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      detailCache[cacheKey] = data
      return data
    }
  } catch {
    // fallback gracefully
  }
  return null
}

