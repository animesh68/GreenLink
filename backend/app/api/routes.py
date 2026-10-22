from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from app.core.config import settings
from app.geospatial.loaders import (
    get_study_area_metadata,
    get_green_spaces_geojson,
    get_green_patches,
    get_candidate_corridors_geojson,
    get_candidate_corridors,
    get_candidate_corridors_summary,
    get_heat_priority_grid_geojson,
    get_heat_grid_cells
)
from app.optimization.optimizer import run_corridor_optimization
from app.geospatial.routing import generate_user_directed_corridors
from app.schemas.plan import (
    OptimizationRequest,
    OptimizationResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    UserDirectedPlanningRequest,
    UserDirectedPlanningResponse
)

router = APIRouter()


@router.get(
    "/health",
    summary="Health Check",
    description="Returns API status, application name, and semantic version."
)
async def health_check() -> Dict[str, str]:
    return {
        "status": "ok",
        "application": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }


@router.get(
    "/study-area",
    summary="Study Area Metadata",
    description="Returns bounding box extent, coordinate reference systems, and study area boundary."
)
async def get_study_area() -> Dict[str, Any]:
    try:
        metadata = get_study_area_metadata()
        return metadata
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Study area data missing: {str(e)}"
        )


@router.get(
    "/green-spaces",
    summary="Green Spaces GeoJSON",
    description="Returns verified green space polygons as a GeoJSON FeatureCollection."
)
async def get_green_spaces() -> Dict[str, Any]:
    try:
        geojson_data = get_green_spaces_geojson()
        return geojson_data
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Green spaces dataset missing: {str(e)}"
        )


@router.get(
    "/candidate-corridors",
    summary="Candidate Corridors GeoJSON",
    description="Returns street-aligned candidate green corridors connecting green-space anchors as a GeoJSON FeatureCollection."
)
async def get_candidate_corridors_route() -> Dict[str, Any]:
    try:
        geojson_data = get_candidate_corridors_geojson()
        return geojson_data
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Candidate corridors dataset missing: {str(e)}"
        )


@router.get(
    "/candidate-corridors/summary",
    summary="Candidate Corridors Summary",
    description="Returns aggregate statistics on candidate routes, total length, length distributions, and provisional cost totals."
)
async def get_candidate_summary() -> Dict[str, Any]:
    try:
        summary_data = get_candidate_corridors_summary()
        return summary_data
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Candidate corridors data missing: {str(e)}"
        )


@router.get(
    "/heat-priority-grid",
    summary="Heat Priority Grid GeoJSON",
    description="Returns the 143-cell urban heat vulnerability proxy grid as a GeoJSON FeatureCollection."
)
async def get_heat_priority_grid_route() -> Dict[str, Any]:
    try:
        geojson_data = get_heat_priority_grid_geojson()
        return geojson_data
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heat priority grid dataset missing: {str(e)}"
        )


@router.post(
    "/plan/optimize",
    response_model=OptimizationResponse,
    summary="Optimize Candidate Corridor Selection",
    description="Executes a deterministic greedy marginal-benefit budget-constrained optimization engine choosing candidate corridors connecting green anchors under a strict budget cap."
)
async def optimize_plan(req: OptimizationRequest) -> OptimizationResponse:
    if req.profile not in ["connectivity_first", "heat_priority_first"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid profile '{req.profile}'. Supported profiles: 'connectivity_first', 'heat_priority_first'"
        )

    try:
        candidates = get_candidate_corridors()
        patches = get_green_patches()
        grid = get_heat_grid_cells()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Required geospatial dataset missing: {str(e)}"
        )

    try:
        result = run_corridor_optimization(
            candidates=candidates,
            patches=patches,
            grid=grid,
            budget_inr=req.budget_inr,
            profile=req.profile
        )
        return OptimizationResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization engine error: {str(e)}"
        )


@router.post(
    "/plan/compare",
    response_model=ScenarioComparisonResponse,
    summary="Compare Optimization Scenarios",
    description="Executes both 'connectivity_first' and 'heat_priority_first' profiles under the exact same budget and returns a side-by-side trade-off evaluation."
)
async def compare_scenarios(req: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
    try:
        candidates = get_candidate_corridors()
        patches = get_green_patches()
        grid = get_heat_grid_cells()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Required geospatial dataset missing: {str(e)}"
        )

    plan_conn = run_corridor_optimization(candidates, patches, grid, req.budget_inr, "connectivity_first")
    plan_heat = run_corridor_optimization(candidates, patches, grid, req.budget_inr, "heat_priority_first")

    conn_cids = {c["candidate_id"] for c in plan_conn["selected_candidates"]}
    heat_cids = {c["candidate_id"] for c in plan_heat["selected_candidates"]}

    overlap = sorted(list(conn_cids.intersection(heat_cids)))
    div_conn = sorted(list(conn_cids - heat_cids))
    div_heat = sorted(list(heat_cids - conn_cids))

    budget_cr = req.budget_inr / 1e7
    heat_conn = plan_conn['secondary_metrics'].get('heat_priority_coverage_ha', plan_conn['secondary_metrics'].get('heat_mitigation_coverage_ha', 0.0))
    heat_heat = plan_heat['objective']['optimized_value']
    conn_conn = plan_conn['objective']['optimized_value']
    conn_heat = plan_heat['secondary_metrics']['connectivity_index_iic']

    if len(conn_cids) == 0 and len(heat_cids) == 0:
        narrative = f"Under a ₹{budget_cr:.2f} Crore budget cap, neither planning profile could select any candidate corridors as the allocated budget is below the minimum candidate corridor cost."
    elif conn_cids == heat_cids:
        narrative = (
            f"Under a ₹{budget_cr:.2f} Crore municipal budget cap, both profiles selected identical corridor sets ({', '.join(overlap)}). "
            f"These consensus routes deliver optimal dual-benefit performance for both network connectivity ({conn_conn:.2f} pts) "
            f"and heat-priority proxy coverage ({heat_heat:.1f} ha) under the current budget constraint."
        )
    else:
        narrative = (
            f"Under a ₹{budget_cr:.2f} Crore municipal budget cap: "
            f"Connectivity-First selects {len(conn_cids)} corridors (IIC_dist: {conn_conn:.2f} pts, priority area: {heat_conn:.1f} ha), "
            f"while Heat-Priority-First selects {len(heat_cids)} corridors (priority area: {heat_heat:.1f} ha, IIC_dist: {conn_heat:.2f} pts). "
            f"They share {len(overlap)} consensus corridors ({', '.join(overlap) if overlap else 'none'}), alongside "
            f"{len(div_conn)} connectivity-specific and {len(div_heat)} heat-specific divergent routes, "
            f"reflecting genuine spatial trade-offs between core ridge/park linkages and dense arterial concrete corridors."
        )


    return ScenarioComparisonResponse(
        budget_inr=req.budget_inr,
        connectivity_plan=OptimizationResponse(**plan_conn),
        heat_priority_plan=OptimizationResponse(**plan_heat),
        overlap_candidate_ids=overlap,
        divergent_connectivity_ids=div_conn,
        divergent_heat_ids=div_heat,
        summary_narrative=narrative
    )


@router.post(
    "/plan/user-corridors",
    response_model=UserDirectedPlanningResponse,
    summary="Generate User-Directed Candidate Corridors & Optimization",
    description="Generates street-aligned candidate green corridors connecting user-selected green spaces/endpoints, with optional budget-constrained optimization."
)
async def generate_user_corridors_plan(req: UserDirectedPlanningRequest) -> UserDirectedPlanningResponse:
    total_endpoints = len(req.selected_patch_ids) + len(req.custom_points or [])
    if total_endpoints < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 green spaces or planning points must be selected to generate connecting corridor recommendations."
        )

    try:
        custom_pts = [p.model_dump() for p in req.custom_points] if req.custom_points else None
        candidates, endpoints = generate_user_directed_corridors(
            selected_patch_ids=req.selected_patch_ids,
            custom_points=custom_pts
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating corridor routes: {str(e)}"
        )

    total_len_km = sum(c["properties"]["length_km"] for c in candidates)
    total_cost = sum(c["properties"]["estimated_cost_inr"] for c in candidates)

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "User-Directed Candidate Corridors",
            "count": len(candidates),
            "selected_patch_count": len(req.selected_patch_ids),
            "generation_method": "NetworkX Dijkstra shortest-path along OSM street network"
        },
        "features": candidates
    }

    opt_plan = None
    if req.budget_inr is not None and req.budget_inr > 0 and candidates:
        try:
            patches = get_green_patches()
            grid = get_heat_grid_cells()
            profile = req.profile or "connectivity_first"
            opt_result = run_corridor_optimization(
                candidates=candidates,
                patches=patches,
                grid=grid,
                budget_inr=req.budget_inr,
                profile=profile
            )
            opt_plan = OptimizationResponse(**opt_result)
        except Exception as opt_err:
            print(f"Warning: optimization on user candidates failed: {opt_err}")

    return UserDirectedPlanningResponse(
        selected_patch_ids=req.selected_patch_ids,
        selected_endpoints=endpoints,
        candidate_corridors_geojson=geojson,
        candidate_corridors=candidates,
        total_candidate_routes=len(candidates),
        total_candidate_length_km=round(total_len_km, 2),
        total_candidate_cost_inr=round(total_cost, 2),
        optimization_plan=opt_plan
    )


