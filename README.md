# GreenLink Delhi

**AI-Assisted Geospatial Decision-Support Platform for Urban Green Corridors**

> **Current Phase: Phase 3.1 (Optimization Audit, Scientific Validity & Demo Readiness)**  
> **Status: Verified Working (29/29 Automated Tests Passing • Clean Vite Build)**

---

## 1. Overview

**GreenLink Delhi** transforms static urban GIS maps into an algorithmic spatial decision-support engine. Built for municipal planners and climate resilience engineers, the platform identifies optimal street-aligned rights-of-way connecting disjoint urban green anchors under strict municipal public works budgets.

### Key Capabilities
- **Real OpenStreetMap Street Network:** 77,474 connected graph nodes and 86,661 road edges snapped to 12 primary South-Central Delhi ecological anchors (1,752.7 hectares).
- **14 Algorithmic Candidate Corridors:** Generated via Dijkstra shortest paths along real walkable urban roads (46.95 km total network).
- **Deterministic Greedy Marginal-Benefit Knapsack Optimizer:** Chooses cost-effective corridor subsets under a user-defined budget cap ($B$).
- **Budget Invariant Guarantee:** Strictly ensures total corridor cost $\sum_{c \in S} \text{cost}(c) \le B$ across all budget tiers.
- **Dual Strategic Planning Profiles:**
  - **Connectivity-First:** Maximizes the Distance-Weighted Integral Index of Connectivity ($IIC_{dist}$), systematically linking isolated habitat patches.
  - **Heat-Priority-First:** Maximizes empirical heat-vulnerability proxy coverage using 50m corridor buffers intersecting urban thermal hot spots.
- **Zero Double-Counting:** Overlapping corridor buffers and shared road junctions are unioned geometrically (`shapely.ops.unary_union`) prior to coverage evaluation.
- **Interactive MapLibre GL JS Dashboard:** Features OpenFreeMap Positron vector basemap, glowing emerald selected corridor layers, heat vulnerability proxy grid overlay, side-by-side scenario comparison modal, and instant GeoJSON/brief exports.

---

## 2. Technology Stack

- **Frontend:** React 19, Vite 8, TypeScript 6, Tailwind CSS v4, MapLibre GL JS, Lucide Icons.
- **Backend:** Python 3.11, FastAPI, Uvicorn, Shapely 2, PyProj, NetworkX, Pydantic v2.
- **Geospatial Coordinate Reference Systems:**
  - `EPSG:4326` (WGS 84): Standard coordinate system for GeoJSON storage and web rendering.
  - `EPSG:32643` (UTM Zone 43N): Projected metric coordinate system for accurate distance, 50m buffering, and hectare calculations.

---

## 3. Quick Start: How to Run Locally

### Prerequisites
- Node.js (v18+) and npm
- Python 3.11 with `uv` or standard `python -m venv`

### Step A: Start the Backend (FastAPI)
```bash
cd backend

# Option 1: Using uv (Recommended)
uv venv .venv --python 3.11
uv pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Option 2: Standard Python venv
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI / Swagger Docs: `http://127.0.0.1:8000/docs`

### Step B: Start the Frontend (Vite + React)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Dashboard URL: `http://127.0.0.1:5173`

---

## 4. REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health status, application name, and semantic version. |
| `GET` | `/api/v1/study-area` | Study area bounding box, CRS metadata, and boundary GeoJSON. |
| `GET` | `/api/v1/green-spaces` | 12 verified green space anchor polygons (GeoJSON FeatureCollection). |
| `GET` | `/api/v1/candidate-corridors` | 14 street-aligned candidate green corridors (GeoJSON FeatureCollection). |
| `GET` | `/api/v1/candidate-corridors/summary` | Aggregate statistics on candidate routes, lengths, and provisional costs. |
| `GET` | `/api/v1/heat-priority-grid` | 143-cell urban heat vulnerability proxy grid (GeoJSON FeatureCollection). |
| `POST` | `/api/v1/plan/optimize` | Solves budget-constrained knapsack optimization returning selected corridors, KPI impact cards, rationales, and excluded routes. |
| `POST` | `/api/v1/plan/compare` | Compares Connectivity-First vs Heat-Priority-First scenarios side-by-side under identical budgets with consensus overlap and divergence analysis. |

---

## 5. Mathematical Formulations & Optimization Engine

### 5.1 Optimization Problem
$$\max_{S \subseteq C} \quad f(S) \quad \text{subject to} \quad \sum_{c \in S} \text{cost}(c) \le B$$

### 5.2 Distance-Weighted Integral Index of Connectivity ($IIC_{dist}$)
$$IIC_{dist} = \frac{\sum_{comp} \sum_{i,j \in comp} \frac{a_i \cdot a_j}{1 + d_G(i,j)/d_0}}{A_{tot}^2} \times 100$$
Where $a_i, a_j$ are green anchor areas in hectares, $A_{tot} = 1,752.72\text{ ha}$, $d_G(i,j)$ is the Dijkstra shortest path in meters along selected corridors, and $d_0 = 1,000\text{ m}$ (1 km characteristic scale).

### 5.3 Heat-Priority Proxy Coverage ($H$)
$$H(S) = \sum_{k=1}^{143} w_k \cdot \text{Area}\left(\left[\bigcup_{c \in S} \text{Buffer}_{25\text{m}}(c)\right] \cap \text{Cell}_k\right)$$
Where $w_k \in [0.15, 0.95]$ is the heat vulnerability proxy score of grid cell $k$.

---

## 6. Data Provenance & Empirical Limitations

- **OpenStreetMap Anchors & Roads:** OpenStreetMap (ODbL, © OpenStreetMap contributors).
- **Candidate Corridors:** Algorithmic shortest paths routed along walkable/urban road centerlines in UTM Zone 43N (`EPSG:32643`).
- **Urban Heat Priority Grid:** **Empirical spatial proxy model**, NOT satellite thermal infrared observations. Grid cell weights are derived from an inverse-distance weighted proxy based on proximity to high-albedo concrete hubs vs vegetative cool sinks. This limitation is clearly marked in the UI and documentation.
- **Provisional Cost Model:** Typology benchmarks (Primary: ₹6,000/m, Secondary: ₹4,500/m, Tertiary: ₹3,500/m, Residential: ₹2,500/m, Pedestrian: ₹2,000/m + ₹1.5L base mobilization) represent provisional planning estimates, not official government tender prices.

---

## 7. Automated Testing Suite

### Run Backend Tests
```bash
cd backend
.venv\Scripts\pytest -v
```
**Results: 29 passed in ~12s**

### Run Frontend Typecheck & Build
```bash
cd frontend
npm run build
```
Executes `tsc -b && vite build` ensuring production bundle integrity with zero TypeScript errors.

