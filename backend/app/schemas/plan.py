from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    budget_inr: float = Field(
        default=50000000.0,
        ge=0.0,
        le=500000000.0,
        description="Available municipal budget in Indian Rupees (INR), minimum 0, maximum 50 Crore"
    )
    profile: str = Field(
        default="connectivity_first",
        description="Planning profile: 'connectivity_first' (Distance-Weighted Connectivity Index IIC_dist) or 'heat_priority_first' (Heat-Priority Proxy Coverage)"
    )


class CandidateSelectionDetail(BaseModel):
    step: int
    candidate_id: str
    name: str
    source_anchor_id: str
    source_name: str
    target_anchor_id: str
    target_name: str
    length_km: float
    estimated_cost_inr: float
    marginal_benefit: float
    efficiency_ratio: float
    objective_type: str
    selection_rationale: str


class ExcludedCandidateDetail(BaseModel):
    candidate_id: str
    name: str
    estimated_cost_inr: float
    length_km: float
    exclusion_reason: str


class ObjectiveDefinition(BaseModel):
    name: str
    formula: str
    units: str
    baseline_value: float
    optimized_value: float
    gain_absolute: float
    gain_percent: Optional[float] = None
    description: str
    limitations: str


class OptimizationMetadata(BaseModel):
    algorithm: str
    profile: str
    budget_inr: float
    total_spent_inr: float
    budget_remaining_inr: float
    budget_utilization_pct: float
    selected_count: int
    excluded_count: int
    total_network_length_km: float
    cost_model: Optional[str] = None
    data_provenance: Dict[str, Any]



class OptimizationResponse(BaseModel):
    metadata: OptimizationMetadata
    objective: ObjectiveDefinition
    secondary_metrics: Dict[str, Any]
    selected_candidates: List[CandidateSelectionDetail]
    selected_corridors_geojson: Dict[str, Any]
    excluded_candidates: List[ExcludedCandidateDetail]


class ScenarioComparisonRequest(BaseModel):
    budget_inr: float = Field(
        default=50000000.0,
        ge=0.0,
        le=500000000.0,
        description="Available municipal budget in Indian Rupees (INR)"
    )


class ScenarioComparisonResponse(BaseModel):
    budget_inr: float
    connectivity_plan: OptimizationResponse
    heat_priority_plan: OptimizationResponse
    overlap_candidate_ids: List[str]
    divergent_connectivity_ids: List[str]
    divergent_heat_ids: List[str]
    summary_narrative: str


class CustomPlanningPoint(BaseModel):
    id: str
    name: str
    coordinates: List[float] = Field(
        ...,
        description="Coordinates as [longitude, latitude] in EPSG:4326"
    )


class UserDirectedPlanningRequest(BaseModel):
    selected_patch_ids: List[str] = Field(
        ...,
        description="List of selected green patch IDs (e.g. ['patch_001', 'patch_002'])"
    )
    custom_points: Optional[List[CustomPlanningPoint]] = Field(
        default=None,
        description="Optional custom planning locations/points within the study area"
    )
    budget_inr: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=500000000.0,
        description="Optional budget cap to immediately run optimization on the user-selected candidate set"
    )
    profile: Optional[str] = Field(
        default="connectivity_first",
        description="Optimization strategy profile ('connectivity_first' or 'heat_priority_first')"
    )


class UserDirectedPlanningResponse(BaseModel):
    selected_patch_ids: List[str]
    selected_endpoints: List[Dict[str, Any]]
    candidate_corridors_geojson: Dict[str, Any]
    candidate_corridors: List[Dict[str, Any]]
    total_candidate_routes: int
    total_candidate_length_km: float
    total_candidate_cost_inr: float
    optimization_plan: Optional[OptimizationResponse] = None

