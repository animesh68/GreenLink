import pyproj
import numpy as np
import shapely
from typing import Dict, Any, List, Tuple
from shapely.geometry import shape
from shapely.ops import unary_union


class HeatCoverageEngine:
    """
    Computes metric right-of-way corridor buffers (25m radius, 50m total width) in EPSG:32643
    and evaluates spatial intersection with the South-Central Delhi 143-cell heat-priority proxy grid.
    
    Uses shapely.ops.unary_union to guarantee that overlapping candidate routes or shared junctions
    are never double-counted in buffer area or weighted priority-area calculations.
    
    Scientific Note:
    - This model represents weighted priority-area coverage across an empirical vulnerability proxy grid.
    - It does not claim measured Celsius cooling or satellite-derived land-surface temperature (LST) observations.
    """
    def __init__(self, candidate_features: List[Dict[str, Any]], grid_features: List[Dict[str, Any]]):
        self.transformer = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)

        def project_coords(coords: np.ndarray) -> np.ndarray:
            x, y = self.transformer.transform(coords[:, 0], coords[:, 1])
            if coords.shape[1] > 2:
                return np.column_stack((x, y, coords[:, 2:]))
            return np.column_stack((x, y))

        # Pre-project and pre-buffer candidate corridors (25m on either side = 50m right-of-way corridor buffer)
        self.candidate_buffers_m: Dict[str, Any] = {}
        self.candidate_lengths_m: Dict[str, float] = {}
        for feat in candidate_features:
            props = feat.get("properties", {})
            cid = props.get("candidate_id") or feat.get("id")
            if not cid or "geometry" not in feat or not feat["geometry"]:
                continue
            geom_wgs = shape(feat["geometry"])
            geom_m = shapely.transform(geom_wgs, project_coords)
            self.candidate_buffers_m[cid] = geom_m.buffer(25.0)  # 50m right-of-way corridor buffer
            len_m = props.get("length_m")
            if len_m is None:
                len_m = float(props.get("length_km", 0.0)) * 1000.0
            self.candidate_lengths_m[cid] = float(len_m)


        # Pre-project heat-priority grid cells
        self.grid_cells_m: List[Tuple[str, float, Any]] = []
        for cell in grid_features:
            gid = cell.get("id") or cell.get("properties", {}).get("id", "cell")
            h_score = float(cell["properties"].get("heat_score", 0.55))
            poly_wgs = shape(cell["geometry"])
            poly_m = shapely.transform(poly_wgs, project_coords)
            self.grid_cells_m.append((gid, h_score, poly_m))

    def compute_coverage(self, selected_cids: List[str]) -> Tuple[float, float, float]:
        """
        Computes the unified corridor buffer footprint and heat-priority weighted coverage score.
        Returns:
            - heat_weighted_score_ha: Sum of (heat_score * intersection_area_ha) across intersected cells.
            - physical_footprint_ha: Unique non-overlapping physical buffer area in hectares.
            - physical_footprint_sqm: Unique non-overlapping physical buffer area in square meters.
        """
        if not selected_cids:
            return 0.0, 0.0, 0.0

        buffers = [self.candidate_buffers_m[cid] for cid in selected_cids if cid in self.candidate_buffers_m]
        if not buffers:
            return 0.0, 0.0, 0.0

        # Unary union eliminates double-counting of overlapping segments
        union_geom = unary_union(buffers)
        physical_sqm = union_geom.area
        physical_ha = physical_sqm / 10000.0

        heat_weighted_ha = 0.0
        for gid, h_score, cell_geom in self.grid_cells_m:
            if union_geom.intersects(cell_geom):
                inter_sqm = union_geom.intersection(cell_geom).area
                heat_weighted_ha += h_score * (inter_sqm / 10000.0)

        return round(heat_weighted_ha, 3), round(physical_ha, 3), round(physical_sqm, 1)

    def compute_marginal_heat_benefit(self, current_cids: List[str], candidate_id: str) -> Tuple[float, float]:
        """
        Calculates the incremental heat-priority weighted coverage gain (ha) and incremental physical area (ha)
        of adding candidate_id to the currently selected corridor set.
        """
        curr_heat, curr_phys_ha, _ = self.compute_coverage(current_cids)
        new_heat, new_phys_ha, _ = self.compute_coverage(current_cids + [candidate_id])

        delta_heat = max(0.0, round(new_heat - curr_heat, 3))
        delta_phys = max(0.0, round(new_phys_ha - curr_phys_ha, 3))
        return delta_heat, delta_phys

