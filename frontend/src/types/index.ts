export interface GreenSpaceProperties {
  id: string
  name: string
  area_sqm: number
  area_hectares: number
  perimeter_meters: number
  centroid: [number, number]
  osm_type: string
}

export interface GreenSpaceFeature {
  type: 'Feature'
  id: string
  properties: GreenSpaceProperties
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
}

export interface GreenSpaceCollection {
  type: 'FeatureCollection'
  metadata?: {
    title: string
    study_area: string
    count: number
    crs: string
  }
  features: GreenSpaceFeature[]
}

export interface CandidateCorridorProperties {
  candidate_id: string
  name: string
  source_anchor_id: string
  source_name: string
  target_anchor_id: string
  target_name: string
  length_m: number
  length_km: number
  euclidean_distance_m: number
  circuitousness_ratio: number
  dominant_typology: string
  road_types_breakdown_m: Record<string, number>
  primary_streets: string
  estimated_cost_inr: number
  cost_status: string
  route_method: string
  network_source: string
  status: string
  planning_notes: string
}

export interface CandidateCorridorFeature {
  type: 'Feature'
  id: string
  properties: CandidateCorridorProperties
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export interface CandidateCorridorCollection {
  type: 'FeatureCollection'
  metadata?: {
    title: string
    study_area: string
    count: number
    generation_method: string
    crs: string
    metric_crs: string
    cost_model: string
    limitations: string
  }
  features: CandidateCorridorFeature[]
}

export interface CandidateSummary {
  total_candidates: number
  total_length_km: number
  length_stats_m: {
    min: number
    median: number
    max: number
  }
  total_provisional_cost_inr: number
  generation_method: string
  routing_network: string
  status: string
}

export interface BoundingBox {
  southwest: {
    longitude: number
    latitude: number
  }
  northeast: {
    longitude: number
    latitude: number
  }
}

export interface StudyAreaMetadata {
  study_area_name: string
  bounding_box: BoundingBox
  crs: {
    storage_and_display: string
    metric_computations: string
  }
  area_approx_km2: number
  is_official_administrative_boundary: boolean
  notes: string
  data_summary: {
    green_patches_count: number
    total_green_area_hectares: number
    primary_source: string
    retrieval_status: string
  }
  boundary_geojson: {
    type: 'FeatureCollection'
    features: any[]
  }
}

export interface HealthStatus {
  status: string
  application: string
  version: string
}

export interface CandidateSelectionDetail {
  step: number
  candidate_id: string
  name: string
  source_anchor_id: string
  source_name: string
  target_anchor_id: string
  target_name: string
  length_km: number
  estimated_cost_inr: number
  marginal_benefit: number
  efficiency_ratio: number
  objective_type: string
  selection_rationale: string
}

export interface ExcludedCandidateDetail {
  candidate_id: string
  name: string
  estimated_cost_inr: number
  length_km: number
  exclusion_reason: string
}

export interface ObjectiveDefinition {
  name: string
  formula: string
  units: string
  baseline_value: number
  optimized_value: number
  gain_absolute: number
  gain_percent?: number | null
  description: string
  limitations: string
}

export interface OptimizationMetadata {
  algorithm: string
  profile: string
  budget_inr: number
  total_spent_inr: number
  budget_remaining_inr: number
  budget_utilization_pct: number
  selected_count: number
  excluded_count: number
  total_network_length_km: number
  cost_model?: string
  data_provenance: Record<string, any>
}

export interface OptimizationResponse {
  metadata: OptimizationMetadata
  objective: ObjectiveDefinition
  secondary_metrics: {
    connected_components_baseline: number
    connected_components_optimized: number
    connected_components_reduction: number
    connectivity_index_iic: number
    connectivity_index_gain: number
    heat_priority_coverage_ha?: number
    heat_mitigation_coverage_ha: number
    corridor_buffer_physical_ha?: number
    canopy_buffer_physical_ha: number
    corridor_buffer_physical_sqm?: number
    canopy_buffer_physical_sqm: number
    selected_corridors_count: number
    selected_corridors_length_km: number
  }
  selected_candidates: CandidateSelectionDetail[]
  selected_corridors_geojson: CandidateCorridorCollection
  excluded_candidates: ExcludedCandidateDetail[]
}

export interface ScenarioComparisonResponse {
  budget_inr: number
  connectivity_plan: OptimizationResponse
  heat_priority_plan: OptimizationResponse
  overlap_candidate_ids: string[]
  divergent_connectivity_ids: string[]
  divergent_heat_ids: string[]
  summary_narrative: string
}

export interface HeatGridProperties {
  id: string
  heat_score: number
  vulnerability_tier: string
}

export interface HeatGridFeature {
  type: 'Feature'
  id: string
  properties: HeatGridProperties
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

export interface HeatGridCollection {
  type: 'FeatureCollection'
  metadata?: {
    title: string
    study_area: string
    count: number
    resolution: string
  }
  features: HeatGridFeature[]
}

