# GreenLink Delhi 2.0

**AI-Assisted Geospatial Decision-Support Platform for Urban Green Corridors**

> **Status: Production-Ready · 56 Automated Tests Passing · Clean Vite Build**  
> **Demo Package:** See [`DEMO_GUIDE.md`](DEMO_GUIDE.md) for 90s pitch, 5-min demo script, and computed metrics.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Feature List & How Each Was Built](#2-feature-list--how-each-was-built)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Quick Start](#5-quick-start)
6. [REST API Reference](#6-rest-api-reference)
7. [Optimization Engine & Mathematics](#7-optimization-engine--mathematics)
8. [Data Pipeline](#8-data-pipeline)
9. [Data Provenance & Limitations](#9-data-provenance--limitations)
10. [Testing](#10-testing)

---

## 1. Overview

**GreenLink Delhi** transforms static urban GIS maps into an algorithmic spatial decision-support engine. Built for municipal planners and climate resilience engineers, the platform identifies optimal street-aligned rights-of-way connecting disjoint urban green anchors under strict municipal public works budgets.

The platform covers **South-Central Delhi** — 12 verified ecological anchor green spaces totalling **1,752.7 hectares**, connected via **14 algorithmic street-aligned corridor candidates** spanning **46.95 km** of real OSM road network.

---

## 2. Feature List & How Each Was Built

### 🗺️ Interactive Map Dashboard (MapLibre GL JS)

**What it does:** A full-screen vector tile map showing green patches, candidate corridors, heat-priority grid, and study boundary. Clicking any feature opens a rich contextual popup with verified reference data, GIS measurements, and connected corridor links.

**How we built it:**
- Used **MapLibre GL JS** with **OpenFreeMap Positron** vector basemap (free, no API key needed).
- Green space polygons and corridor linestrings are rendered from GeoJSON served both statically (from `public/data/`) and dynamically (from the FastAPI backend).
- Map layers are added programmatically in `MapContainer.tsx` using `addSource` / `addLayer` with custom paint expressions (emerald glows for selected corridors, heat-score-interpolated fill for the grid).
- Click handlers capture `feature.properties.id` / `feature.properties.candidate_id`, call the precomputed detail API endpoint, and render popup HTML via `popupFormatter.ts`.
- Popups are built from `buildGreenSpacePopupHtml` and `buildCorridorPopupHtml` — source-aware formatters that display both **reference values** (from `reference_data.py`) and **GIS measurements** (from GeoJSON geometry) side by side, with clear labelling of each source.
- Popup container width is capped at `340px` with `padding-right: 24px` on the title row to prevent text collision with the MapLibre close `×` button.

---

### 🌿 12 Green Space Anchors with Verified Reference Data

**What it does:** Each of the 12 green spaces (PATCH_001–PATCH_012) shows its official reference name, gazetted area, perimeter range, district, vegetation type, and ecological role alongside GIS-computed polygon measurements.

**How we built it:**
- GIS polygons were sourced from **OpenStreetMap** (`landuse=forest`, `leisure=park`, `natural=wood` tags) and manually validated against official Delhi forest/park records.
- All 12 polygons were projected to **UTM Zone 43N (EPSG:32643)** using **PyProj** to compute metric area (hectares) and perimeter (metres) accurately.
- A curated `reference_data.py` dictionary (`GREEN_SPACE_REFERENCE`) maps each reference ID (e.g. `PATCH_009`) to authoritative values — official name, gazette area in ha and acres, area in km², perimeter range, district, OSM type, and ecological notes.
- A second dictionary (`GREEN_SPACE_BACKEND_TO_REF`) maps GeoJSON backend IDs (e.g. `patch_009`) to reference IDs, keeping the GIS layer decoupled from the reference catalogue.
- The `build_precomputed_data.py` script joins both sources into `green_space_details.json` at build time — the API serves this precomputed record on click, delivering sub-millisecond popup response.

---

### 🛤️ 14 Street-Aligned Candidate Green Corridors

**What it does:** 14 potential green corridor routes, each following real walkable/urban roads between pairs of green anchor patches, with length, cost estimate, heat coverage, and connected-anchor topology.

**How we built it:**
- The **full OSM road network** of South-Central Delhi (77,474 nodes, 86,661 edges) was downloaded via the **Overpass API** and processed with `build_osm_network.py`.
- Network edges were weighted by **Haversine distance** and stored as a **NetworkX graph** (JSON-serialised to `street_network.json`).
- **Dijkstra shortest paths** (via `networkx.shortest_path`) were run between every relevant pair of green-space anchor centroids.
- Routes were projected to UTM 43N, their lengths computed, and each assigned a **road-typology cost model** (`generate_candidates.py`): Primary ₹6,000/m · Secondary ₹4,500/m · Tertiary ₹3,500/m · Residential ₹2,500/m · Pedestrian ₹2,000/m + ₹1.5L base mobilisation.
- Corridor geometries and properties were exported as `candidate_corridors.geojson`.
- Precomputed records (`corridor_details.json`) store length in metres and km, cost, road type, connected anchor IDs, and heat-priority coverage fraction.

---

### 🔗 Corridor–Green Space Topology Links

**What it does:** Each corridor popup shows which green spaces it connects as endpoints, which it intersects along its path, and which are nearby (within 500m buffer).

**How we built it:**
- `build_precomputed_data.py` performs spatial joins: for each corridor linestring, it buffers it in UTM 43N and checks `shapely` `intersects()` / `within distance()` against all 12 patch polygons.
- Results are stored in `corridor_green_links.json` — a dictionary keyed by corridor ID, with four categorised lists: `endpoint_anchors`, `intersecting_patches`, `traversed_intermediate`, `nearby_green_spaces`.
- The API exposes this via `GET /corridors/{id}/connected-green-spaces`.

---

### ⚡ Sub-Millisecond Precomputed Data Architecture

**What it does:** Clicking any green space or corridor on the map returns full detail data instantly — no on-demand geometry computation.

**How we built it:**
- Three JSON files (`green_space_details.json`, `corridor_details.json`, `corridor_green_links.json`) are generated offline by `scripts/build_precomputed_data.py`.
- At FastAPI startup (via the `lifespan` hook in `main.py`), all three files are loaded into memory using `functools.lru_cache`-backed loader functions in `loaders.py`.
- API detail endpoints (`/green-spaces/{id}`, `/corridors/{id}`) do a single dict-key lookup — no file I/O, no geometry recalculation per request.
- This pattern means the API scales to thousands of concurrent map users without per-request compute overhead.

---

### 🧠 Deterministic Greedy Knapsack Optimizer

**What it does:** Given a budget (in INR) and a planning profile, the optimizer selects the best subset of candidate corridors that maximises the chosen objective without exceeding the budget.

**How we built it:**
- Implemented as a **greedy marginal-benefit knapsack heuristic** in `optimizer.py`.
- Each iteration evaluates every remaining affordable candidate, computes its **marginal gain per Crore INR** (efficiency ratio), and selects the best.
- For `connectivity_first`: marginal gain = IIC_dist gain from adding the corridor edge to the current graph.
- For `heat_priority_first`: marginal gain = incremental weighted heat-priority area covered, using `shapely.ops.unary_union` to eliminate double-counting.
- **Budget invariant** is strictly enforced — the sum of selected corridor costs never exceeds the input budget.
- Deterministic tie-breaking uses (ratio → marginal → lower cost → lexicographic ID) to guarantee reproducible results.
- Each selected corridor is annotated with its `selection_step`, `marginal_benefit`, `efficiency_ratio`, and a human-readable `selection_rationale` string generated by `explainer.py`.

---

### 📊 Dual Planning Profiles

**What it does:** Users choose between two strategic optimization objectives.

| Profile | Objective | Metric |
|---|---|---|
| **Connectivity-First** | Maximize ecological network connectivity | Distance-Weighted IIC_dist index points |
| **Heat-Priority-First** | Maximize urban heat island mitigation reach | Weighted proxy hectares covered |

**How we built it:**
- Both profiles use the same greedy loop — only the `marginal benefit` computation differs.
- `connectivity_first` uses **NetworkX graph operations** (`build_base_graph`, `compute_connectivity_index`) — each candidate is temporarily added as a graph edge and the IIC delta computed.
- `heat_priority_first` uses the **`HeatCoverageEngine`** in `heat_coverage.py` — 50m UTM buffers around corridor centrelines are intersected with the 143-cell heat vulnerability grid, weighted by each cell's proxy score.
- Secondary metrics (IIC + heat coverage) are always computed for both, so users can see the trade-off numerically.

---

### 🔄 Side-by-Side Scenario Comparison

**What it does:** Run both profiles simultaneously under the same budget and see a narrative explaining which corridors are shared ("consensus") and which diverge, with KPI numbers for both.

**How we built it:**
- `POST /plan/compare` runs `run_corridor_optimization` twice (once per profile) and computes set-intersection and set-difference of selected corridor IDs.
- The `summary_narrative` string is dynamically constructed in `routes.py` with budget figure, IIC score, heat coverage, corridor counts, and plain-English divergence summary.
- The frontend `ScenarioModal.tsx` renders both plans in a two-column layout with shared/divergent corridor badges.

---

### 🧭 User-Directed Planning Mode

**What it does:** Planners select any custom subset of green patches (not just the 14 pre-generated pairs) and the system generates new street-aligned corridor candidates between them on-demand, then optionally optimizes the custom set.

**How we built it:**
- `POST /plan/user-corridors` accepts a list of `selected_patch_ids` and optional `custom_points` (lat/lng).
- `routing.py → generate_user_directed_corridors()` loads the pre-built street graph and runs Dijkstra between all selected patch centroid pairs using the same graph and cost model as the precomputed corridors.
- If `budget_inr` is also supplied, `run_corridor_optimization` is called on the generated corridors, returning a full optimization plan.

---

### 🌡️ Urban Heat Priority Grid Overlay

**What it does:** A 143-cell spatial proxy grid overlaid on the map, colour-coded by heat vulnerability score (0.15–0.95), showing which areas most need green cooling infrastructure.

**How we built it:**
- Grid cells were defined over South-Central Delhi at ~500m resolution.
- Each cell weight is an **empirical spatial proxy** — an inverse-distance-weighted score based on proximity to high-albedo concrete transit hubs (ISBT, Ring Road junctions) vs vegetative cool sinks (Ridge forests, park clusters).
- **This is not satellite LST data** — the UI and docs clearly label this as a proxy model, not calibrated thermal observations.
- Served as `heat_priority_grid.geojson` from both static public folder and API endpoint.
- MapLibre renders cells with a data-driven `fill-color` interpolating between light-yellow (low risk) and deep-red (high risk) based on the `heat_score` property.

---

### 🏙️ Landing Page with Animated Delhi Illustration

**What it does:** An animated SVG cityscape / green-map illustration of Delhi greets users on first load, with smooth scroll-reveal sections introducing the project.

**How we built it:**
- `DelhiIllustration.tsx` is a hand-crafted React SVG component with CSS keyframe animations (floating particles, pulsing green nodes, animated corridor lines).
- `FieldNotesSection.tsx` implements a "field notes" narrative layout with typewriter-style text reveals.
- `ScrollReveal.tsx` uses the **Intersection Observer API** to trigger entrance animations as the user scrolls down.
- `LandingPage.tsx` composes these into the hero page; clicking "Open Map" transitions to `MapContainer`.

---

### 🗂️ Workstation Mode (Advanced Analysis View)

**What it does:** A power-user interface with a full sidebar for layer toggling, corridor filtering, statistics panels, and planning controls — separate from the main public-facing map view.

**How we built it:**
- `WorkstationApp.tsx` mounts an alternate layout with `WorkstationSidebar.tsx` and `WorkstationHeader.tsx`.
- Sidebar implements accordion-style layer controls, live corridor stats, and filter chips.
- Shares the same `MapContainer` core component — workstation-specific props control which panels and controls are mounted.

---

### 🔍 Street View Inspector

**What it does:** Lets planners view ground-level imagery along a corridor route to assess real-world feasibility.

**How we built it:**
- `StreetViewInspector.tsx` and `StreetViewModeViewer.tsx` integrate an iframe-based street-level imagery viewer.
- Corridor click in workstation mode activates a split-screen: map above, street view below.

---

### 📋 Scenario Save / Export

**What it does:** Planners can save named planning scenarios and export results as GeoJSON or a brief summary.

**How we built it:**
- `ScenarioModal.tsx` manages in-browser scenario state with `localStorage` persistence.
- Export triggers a client-side JSON download of the `selected_corridors_geojson` feature collection.

---

## 3. Technology Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| React | 19 | UI component framework |
| Vite | 8 | Dev server & production bundler |
| TypeScript | 6 | Type-safe components & API interfaces |
| MapLibre GL JS | latest | WebGL vector tile map rendering |
| Lucide React | latest | Icon library |
| Vanilla CSS | — | All styling (design tokens, animations, glassmorphism) |

### Backend

| Technology | Version | Role |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | latest | REST API framework |
| Uvicorn | latest | ASGI server |
| Shapely | 2.x | Computational geometry (buffers, unions, intersections) |
| PyProj | latest | CRS transformations (WGS84 ↔ UTM 43N) |
| NetworkX | latest | Street graph construction and Dijkstra routing |
| Pydantic | v2 | Request/response schema validation |

### Geospatial Coordinate Reference Systems

| CRS | EPSG | Used For |
|---|---|---|
| WGS 84 | 4326 | GeoJSON storage, web map rendering |
| UTM Zone 43N | 32643 | Metric area, distance, 50m buffering, perimeter calculation |

---

## 4. Project Structure

```
GreenLink/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + startup lifespan data warming
│   │   ├── reference_data.py          # Curated reference metadata for all 12 patches + 14 corridors
│   │   ├── api/routes.py              # All REST endpoints
│   │   ├── core/config.py             # Settings (CORS, paths, version)
│   │   ├── geospatial/
│   │   │   ├── loaders.py             # In-memory cached data loaders (lru_cache)
│   │   │   └── routing.py             # On-demand Dijkstra user-directed routing
│   │   ├── optimization/
│   │   │   ├── optimizer.py           # Greedy knapsack optimizer (both profiles)
│   │   │   ├── graph.py               # NetworkX graph builder + IIC computation
│   │   │   ├── heat_coverage.py       # Heat grid intersection engine
│   │   │   ├── plan.py                # Plan scoring & result formatting
│   │   │   └── explainer.py           # Human-readable selection rationale generator
│   │   └── schemas/                   # Pydantic request/response models
│   └── tests/                         # 56 pytest tests
├── data/
│   ├── precomputed/                   # Pre-built JSON lookup tables (warmed into memory at startup)
│   │   ├── green_space_details.json   # GIS metrics + reference data for 12 patches
│   │   ├── corridor_details.json      # GIS metrics + reference data for 14 corridors
│   │   └── corridor_green_links.json  # Topological corridor-to-patch links
│   ├── processed/                     # Source-of-truth GeoJSON files
│   │   ├── green_patches.geojson      # 12 anchor polygons
│   │   ├── candidate_corridors.geojson
│   │   ├── heat_priority_grid.geojson
│   │   ├── street_network.json        # Full 77k-node OSM graph
│   │   └── study_boundary.geojson
│   └── data_provenance.json           # Data sources, versions, collection dates
├── frontend/
│   ├── public/data/                   # Static GeoJSON copies (map tile fallback, no API needed)
│   └── src/
│       ├── components/Map/MapContainer.tsx    # Core map + all layer + popup + click logic
│       ├── utils/popupFormatter.ts            # Source-aware popup HTML builders
│       ├── services/api.ts                    # All typed backend API calls
│       └── types/index.ts                     # Shared TypeScript interfaces
└── scripts/                           # Offline data pipeline (run once to regenerate data)
    ├── build_precomputed_data.py      # Generates all 3 precomputed JSONs
    ├── generate_candidates.py         # Generates candidate_corridors.geojson
    ├── build_osm_network.py           # Downloads + processes OSM road graph
    ├── generate_street_corridors.py   # Builds street-following corridor geometries
    ├── build_complete_street_network.py
    ├── extract_osm_streets.py
    ├── preprocess_osm.py
    └── audit_benchmark.py             # Benchmarks API response times + data quality
```

---

## 5. Quick Start

### Prerequisites
- Node.js v18+ and npm
- Python 3.11

### Option 1: One-Click PowerShell Launch (Windows — Recommended)
```powershell
.\run_dev.ps1
```
*Validates prerequisites, starts FastAPI on `:8000`, starts Vite on `:5173`, opens browser automatically.*

### Option 2: Manual Startup

**Step A — Backend (FastAPI)**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

**Step B — Frontend (Vite + React)**
```bash
cd frontend
npm install
npm run dev
```
- Dashboard: `http://127.0.0.1:5173`

---

## 6. REST API Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/health` | Health status, app name, version |
| `GET` | `/api/v1/study-area` | Study area bounding box + boundary GeoJSON |
| `GET` | `/api/v1/green-spaces` | 12 green space anchor polygons (GeoJSON FeatureCollection) |
| `GET` | `/api/v1/green-spaces/{id}` | Precomputed detail: GIS metrics + reference data for one patch |
| `GET` | `/api/v1/candidate-corridors` | 14 street-aligned candidate corridors (GeoJSON FeatureCollection) |
| `GET` | `/api/v1/candidate-corridors/summary` | Aggregate stats: total length, cost totals, distribution |
| `GET` | `/api/v1/corridors/{id}` | Precomputed detail: length, cost, heat coverage, road type |
| `GET` | `/api/v1/corridors/{id}/connected-green-spaces` | Topological links: endpoint anchors, intersecting & nearby patches |
| `GET` | `/api/v1/heat-priority-grid` | 143-cell heat vulnerability proxy grid (GeoJSON FeatureCollection) |
| `POST` | `/api/v1/plan/optimize` | Budget-constrained greedy optimization → selected corridors, KPIs, rationales |
| `POST` | `/api/v1/plan/compare` | Both profiles side-by-side → consensus + divergent analysis narrative |
| `POST` | `/api/v1/plan/user-corridors` | On-demand corridors for user-selected patch pairs + optional optimization |

---

## 7. Optimization Engine & Mathematics

### Problem Formulation

Maximize objective $f(S)$ subject to budget constraint:

$$\max_{S \subseteq C} \quad f(S) \quad \text{subject to} \quad \sum_{c \in S} \text{cost}(c) \le B$$

**Algorithm:** Deterministic Greedy Marginal-Benefit Knapsack Heuristic. At each step, compute the **efficiency ratio** = marginal benefit gained / (cost in Crore INR) for every affordable unselected candidate. Select the candidate with the highest ratio. Repeat until the budget is exhausted or no candidate delivers positive marginal gain.

---

### Profile A: Distance-Weighted Integral Index of Connectivity (IIC_dist)

$$IIC_{dist} = \frac{\displaystyle\sum_{\text{comp}} \sum_{i,j \in \text{comp}} \frac{a_i \cdot a_j}{1 + d_G(i,j)/d_0}}{A_{tot}^2} \times 100$$

| Symbol | Meaning |
|---|---|
| $a_i, a_j$ | Green anchor areas (hectares) |
| $A_{tot}$ | Total anchor area = 1,752.72 ha |
| $d_G(i,j)$ | Dijkstra shortest path (metres) along selected corridors |
| $d_0$ | Characteristic distance scale = 1,000 m |

**Baseline** (0 corridors selected): **15.17 index points** (intra-patch self-connectivity only).

---

### Profile B: Heat-Priority Proxy Coverage

$$H(S) = \sum_{k=1}^{143} w_k \cdot \text{Area}\!\left(\!\left[\bigcup_{c \in S} \text{Buffer}_{25m}(c)\right] \cap \text{Cell}_k\right)$$

| Symbol | Meaning |
|---|---|
| $w_k \in [0.15, 0.95]$ | Empirical heat vulnerability proxy score for cell $k$ |
| $\text{Buffer}_{25m}(c)$ | 25m buffer around corridor centreline (50m total ROW) in EPSG:32643 |
| $\text{Cell}_k$ | One of 143 heat vulnerability grid cells |

`shapely.ops.unary_union` is applied before intersection to prevent double-counting of overlapping buffers.

---

### Cost Model

| Road Type | Rate | Basis |
|---|---|---|
| Primary | ₹6,000/m | + ₹1.5L mobilisation |
| Secondary | ₹4,500/m | + ₹1.5L mobilisation |
| Tertiary | ₹3,500/m | + ₹1.5L mobilisation |
| Residential | ₹2,500/m | + ₹1.5L mobilisation |
| Pedestrian | ₹2,000/m | + ₹1.5L mobilisation |

*Planning estimates only — not official government tender prices.*

---

## 8. Data Pipeline

Pipeline scripts in `scripts/` are run **once offline** to generate all GeoJSON and precomputed JSON files. They do **not** run at server startup.

```
OSM Overpass API
      │
      ▼
build_osm_network.py           ──► street_network.json  (77,474 nodes, 86,661 edges)
      │
      ▼
generate_candidates.py         ──► candidate_corridors.geojson  (14 corridors, 46.95 km)
      │
      ▼
build_precomputed_data.py      ──► green_space_details.json
   (joins GeoJSON +                corridor_details.json
    reference_data.py)             corridor_green_links.json
```

To regenerate precomputed data after editing `reference_data.py`:
```bash
cd scripts
python build_precomputed_data.py
```

---

## 9. Data Provenance & Limitations

| Data | Source | Limitation |
|---|---|---|
| Green space polygons | OpenStreetMap (ODbL, © OSM contributors) | OSM boundaries may differ from official gazette extents |
| Street network | OpenStreetMap via Overpass API | Reflects OSM completeness; private roads excluded |
| Candidate corridors | Algorithmic Dijkstra paths on OSM graph | Shortest path ≠ physically optimal alignment; no barrier modelling |
| Heat priority grid | Empirical inverse-distance proxy model | **NOT** satellite LST data — reflects spatial structure, not calibrated temperatures |
| Corridor cost model | Typology benchmarks (₹2,000–₹6,000/m) | Planning estimates only — not official government tender prices |
| Reference values | Delhi gazetted forest records + GNCTD reports | May not reflect post-2022 boundary changes |

---

## 10. Testing

### Backend — 56 Pytest Tests

```powershell
cd backend
.\.venv\Scripts\pytest -v
```

| Test File | What It Covers |
|---|---|
| `test_api.py` | All REST endpoint responses, status codes, GeoJSON shape |
| `test_precomputed.py` | Precomputed JSON integrity — all IDs, required fields, value ranges |
| `test_audit_correctness.py` | Cross-validates GIS measurements vs reference data for all 12 patches + 14 corridors |
| `test_optimizer.py` | Budget invariant, both profiles, zero-budget, edge cases |
| `test_user_planning.py` | User-directed corridor generation and optimization flow |

### Frontend — TypeScript Build Check

```bash
cd frontend
npm run build
```

Runs `tsc -b && vite build` — zero TypeScript errors required for a passing build.

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

### Option 1: 1-Click PowerShell Launch (Windows Recommended)
From the project root:
```powershell
.\run_dev.ps1
```
*Validates prerequisites, starts FastAPI on `:8000`, starts Vite on `:5173`, and opens the browser automatically.*

### Option 2: Manual Startup

#### Step A: Start the Backend (FastAPI)
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
*Baseline connectivity (0 selected corridors): **15.17 index points**, reflecting intra-patch self-connectivity ($\sum a_i^2 / A_{tot}^2 \times 100$) across the 12 isolated green anchors.*

### 5.3 Heat-Priority Proxy Coverage ($H$)
$$H(S) = \sum_{k=1}^{143} w_k \cdot \text{Area}\left(\left[\bigcup_{c \in S} \text{Buffer}_{25\text{m}}(c)\right] \cap \text{Cell}_k\right)$$
Where $w_k \in [0.15, 0.95]$ is the empirical heat vulnerability proxy score of grid cell $k$.  
*A 25m buffer radius on either side of candidate road centerlines generates a 50m total right-of-way corridor swath in UTM Zone 43N (`EPSG:32643`). Geometric unary union prevents double-counting of overlapping corridor footprints.*

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

