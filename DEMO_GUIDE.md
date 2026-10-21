# GreenLink Delhi — Judge Demo Guide & Presentation Package

> **Hackathon Track:** Urban Resilience & Geospatial AI  
> **Status:** Production Verified • Demo Freeze • 29/29 Automated Tests Passing • Deterministic Engine  
> **Live Local URL:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)  
> **Backend API:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  

---

## 1. Executive Summary & Problem Statement

### The Problem
Rapid urbanization across Delhi has fragmented its historic green spaces into isolated ecological islands. Disjoint parks—such as Hauz Khas Deer Park, Sanjay Van, and the Jahanpanah Forest—cannot support viable ecological gene flow or continuous microclimate cooling corridors because they are severed by high-traffic arterial roads and high-density concrete developments.

### Why Green-Corridor Planning is Hard
1. **Combinatorial Explosion:** In a network of $N$ disjoint green anchors and dozens of potential street connectors, choosing which streets to convert under a finite budget is a combinatorial 0-1 knapsack / Steiner network problem ($2^N$ possible configurations).
2. **Conflicting Objectives:** An urban forestry department aiming to reconnect fragmented habitats will choose fundamentally different streets than a public health department targeting dense urban heat islands.
3. **Budget Realities:** Municipalities cannot afford to green every street. They require mathematically defensible, explainable ROI metrics (e.g., gain per crore rupees spent) to defend public capital allocation.

### What GreenLink Delhi Demonstrates
GreenLink Delhi is a **budget-constrained geospatial decision-support prototype** that translates static GIS maps into an algorithmic planning tool:
- Connects **12 verified OpenStreetMap green anchors** (1,752.7 hectares) in South-Central Delhi.
- Routes **14 street-aligned candidate corridors** (46.95 km) snapped directly to the real OSM street centerline network.
- Solves a **marginal-benefit greedy knapsack optimization** with strict budget invariant enforcement ($\sum \text{cost} \le B$).
- Implements two contrasting planning strategies: **Connectivity-First** ($IIC_{dist}$) vs. **Heat-Priority-First** (thermal proxy coverage).
- Evaluates **side-by-side scenario trade-offs** with consensus route detection and transparent cost-benefit rationales.

---

## 2. Study Area & Technical Specifications

| Parameter | Specification | Notes / Limitations |
| :--- | :--- | :--- |
| **Study Area** | South-Central Delhi, India | $131.8\text{ km}^2$ bounding box |
| **Green Space Anchors** | 12 Mapped OpenStreetMap Polygons | Total area: $1,752.72\text{ ha}$ (OSM-mapped boundaries; not field-verified canopy densities) |
| **Street Network** | 77,474 OSM nodes, 86,661 edges | Filtered for pedestrian/walkable urban rights-of-way |
| **Candidate Corridors** | 14 Shortest-Path Street Alignments | Total network: $46.95\text{ km}$, Total cost: ₹17.16 Cr (planning estimates, not tender bids) |
| **Spatial Projection** | `EPSG:32643` (UTM Zone 43N) | Metric calculations for corridor lengths, 25m radius buffers (50m corridor swath), and grid intersections |
| **Web Map CRS** | `EPSG:4326` (WGS 84) | GeoJSON standard for Leaflet / MapLibre GL JS vector display |
| **Basemap** | Positron Light (OpenFreeMap) | Clean, high-contrast, zero-cost, no private API key required |

---

## 3. Algorithmic Architecture

### 3.1 Candidate Corridor Generation
Corridors are computed as **metric shortest paths between anchor centroids** along real OpenStreetMap walkable street centerlines using Dijkstra's algorithm in UTM Zone 43N (`EPSG:32643`). Each candidate route inherits the real street typology breakdown (Primary, Secondary, Tertiary, Residential, Pedestrian) and associated provisional development costs:
$$\text{Cost}(c) = \text{Base Mobilization} (₹1.5\text{ Lakh}) + \sum_{seg \in c} \text{Length}(seg) \times \text{Rate}(\text{Typology})$$

### 3.2 Knapsack Optimizer & Budget Invariant
The engine implements a **deterministic greedy marginal-benefit algorithm with dynamic recalculation**:
1. Filter candidates where $\text{Cost}(c) \le \text{Remaining Budget}$.
2. In each iteration, evaluate the marginal gain $\Delta f(c \mid S) = f(S \cup \{c\}) - f(S)$.
3. Select the candidate with highest marginal benefit-to-cost ratio:
   $$c^* = \arg\max_{c \notin S} \frac{\Delta f(c \mid S)}{\text{Cost}(c)}$$
4. Deduct $\text{Cost}(c^*)$ from remaining budget and dynamically update network state.
5. **Invariant:** The total cost $\sum_{c \in S} \text{Cost}(c)$ is strictly bounded by $B$ under all conditions.

### 3.3 Two Distinct Objective Functions
- **Connectivity-First Profile ($IIC_{dist}$):**  
  Measures topological graph connectivity weighted by anchor habitat area and corridor travel distance:
  $$IIC_{dist} = \frac{\sum_{comp} \sum_{i,j \in comp} \frac{a_i \cdot a_j}{1 + d_G(i,j)/d_0}}{A_{tot}^2} \times 100$$
  *Where $d_0 = 1,000\text{ m}$ (1 km characteristic scale) and $A_{tot} = 1,752.72\text{ ha}$.*  
  *Baseline value: **15.17 points** (reflecting intra-patch self-connectivity $\sum a_i^2 / A_{tot}^2 \times 100$ across the 12 isolated anchors).*
- **Heat-Priority-First Profile ($H$):**  
  Measures weighted intersection area between candidate 25m radius buffers (50m corridor swath) and 143 empirical heat-vulnerability grid cells ($w_k \in [0.15, 0.95]$):
  $$H(S) = \sum_{k=1}^{143} w_k \cdot \text{Area}\left(\left[\bigcup_{c \in S} \text{Buffer}_{25\text{m}}(c)\right] \cap \text{Cell}_k\right)$$
  *Corridor buffers are merged via `shapely.ops.unary_union` in EPSG:32643 to mathematically eliminate double-counting of shared road junctions.*

---

## 4. 90-Second Spoken Pitch (Judge Script)

> *"Good afternoon, judges. This is **GreenLink Delhi**, an urban green-corridor decision-support tool.*
>
> *Urban planners in Delhi face a critical dilemma: our major urban parks—like Sanjay Van, Central Ridge, and Hauz Khas—are severed into isolated ecological islands by dense road corridors. But municipal authorities face tight fiscal limits. They cannot afford to green every street, nor do they know which street rights-of-way deliver the highest ecological or cooling return per rupee spent.*
>
> *GreenLink Delhi solves this with algorithmic optimization. We ingested 12 primary green spaces covering 1,752 hectares in South-Central Delhi and mapped 14 candidate street corridors along real OpenStreetMap road centerlines, totaling ₹17.16 Crore.*
>
> *Instead of guesswork, planners set a realistic municipal budget cap—say, ₹5 Crore—and choose an objective. Under a **Connectivity-First** strategy, our greedy knapsack optimizer selects 5 strategic corridors costing ₹4.98 Crore (99.6% budget utilization), boosting the connectivity index by +2.17 points and reducing isolated park clusters from 12 down to 7.*
>
> *Switch to **Thermal Heat Priority**, and the algorithm shifts focus: it still selects high-impact consensus corridors like corridor 10 and corridor 7, but redirects funds into dense, high-vulnerability urban heat pockets covering 40.5 weighted proxy hectares.*
>
> *Our scenario comparison modal exposes the exact trade-offs: which corridors are consensus choices regardless of policy emphasis, and where priorities diverge.*
>
> *Every calculation is backed by metric UTM projections, geometric union buffering to eliminate double-counting, and a 29-test automated validation suite. GreenLink Delhi provides the quantitative evidence needed to turn urban greening plans into defensible public investments. Thank you!"*

---

## 5. Five-Minute Live Demonstration Script

| Time | Stage | Actions & Visual Cue | Script / Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:45** | **The Problem & Baseline** | • Display [http://127.0.0.1:5173/](http://127.0.0.1:5173/)<br>• Point to Positron map and emerald green patches<br>• Open "Judge Demo Guide" modal | *"Welcome to GreenLink Delhi. The map displays South-Central Delhi—131.8 square kilometers containing 12 major green anchors like Sanjay Van and Hauz Khas. Notice the problem immediately: these green spaces are completely isolated fragments. Our baseline analysis indicates an initial intra-patch connectivity index of 15.17 points across 12 completely isolated green components."* |
| **0:45 - 1:30** | **Candidate Street Network** | • Dismiss Guide modal<br>• Toggle amber candidate corridor lines<br>• Click corridor `cand_010` in sidebar | *"We mapped 14 candidate street corridors along real OSM road centerlines, spanning 46.95 km. Each corridor has a typology-based cost model. For instance, corridor `cand_010` is a 1.94 km street corridor costing ₹51.58 Lakh connecting Delhi Golf Club to the National Zoological Park. Greening all 14 candidates would cost ₹17.16 Crore—far more than a municipal ward's immediate budget."* |
| **1:30 - 2:30** | **Optimization: ₹1 Cr Budget** | • Set budget slider to ₹1.00 Cr<br>• Select 'Connectivity First'<br>• Click 'Run Optimizer' | *"Let's test fiscal austerity. We set a ₹1 Crore budget. The optimizer evaluates marginal gains and immediately identifies `cand_010` as the highest ROI investment: ₹0.52 Cr utilized (51.6%), yielding a +0.24 point connectivity gain and +4.85 ha heat proxy gain. Notice the sidebar auto-switches to the Plan tab, providing a transparent breakdown and step-by-step selection rationales."* |
| **2:30 - 3:30** | **Scale Up: ₹5 Cr Municipal Budget** | • Slide budget to ₹5.00 Cr<br>• Click 'Run Optimizer'<br>• Point to selected emerald routes | *"Now let's expand to a realistic municipal phase budget of ₹5 Crore. The optimizer selects 5 corridors—routes `cand_001`, `cand_010`, `cand_011`, `cand_008`, and `cand_007`—utilizing ₹4.98 Cr (99.6% budget utilization). Notice the network effect: network connectivity jumps by +2.17 points (from 15.17 to 17.35), and isolated green clusters drop from 12 to 7. The map renders these selections as crisp, glowing emerald corridors over the road basemap."* |
| **3:30 - 4:15** | **Scenario Trade-Off Analysis** | • Click 'Compare Scenarios' button in header<br>• Review side-by-side comparison modal | *"Planners often debate priorities: biodiversity connectivity vs. urban heat relief. With one click, our 'Compare Scenarios' engine runs both Connectivity-First and Heat-Priority profiles under the same ₹5 Cr budget. The modal highlights consensus corridors—`cand_007` and `cand_010`—selected by both strategies, versus divergent routes. Connectivity prioritizes large habitat links (`cand_001`, `cand_008`, `cand_011`), while Heat-Priority routes corridors into dense built-up arterial neighborhoods (`cand_012`, `cand_013`, `cand_014`)."* |
| **4:15 - 4:45** | **Dynamic Invariant & Stale State** | • Close modal<br>• Nudge slider to ₹6.0 Cr without clicking optimize | *"Observe our UI integrity: if a planner adjusts the budget without recalculating, the system immediately displays an amber warning: 'Parameters changed — Run optimization to refresh plan'. No stale or misleading data is ever presented as current."* |
| **4:45 - 5:00** | **Scientific Honesty & Q&A** | • Point to disclaimer footer<br>• Conclude presentation | *"We want to be scientifically honest: our costs are provisional planning benchmarks, our heat layer is an empirical spatial proxy rather than satellite radiometry, and our green spaces are OSM-mapped boundaries. GreenLink Delhi is a robust, transparent decision-support prototype. Thank you, and we welcome your questions!"* |

---

## 6. Real Application Numerical Reference Sheet (Verified Source of Truth)

All values below are verified against the live FastAPI `/api/v1` backend endpoints:

### 6.1 Baseline Landscape Metrics
- **Total Green Space Anchors:** 12 mapped features | $1,752.72\text{ ha}$
- **Total Candidate Corridors:** 14 street-aligned routes | $46.95\text{ km}$ ($46,947.4\text{ m}$)
- **Total Provisional Network Cost:** ₹17,15,78,000 (₹17.16 Cr)
- **Baseline Connectivity ($IIC_{dist}$):** 15.17 index points | 12 isolated components
- **Baseline Heat-Priority Proxy Coverage:** 0.0 ha

### 6.2 Optimization Outputs Across Budget Tiers

| Budget Tier | Profile | Selected Corridors | Spent (INR) | Spent (Cr) | Util % | Objective Score | Fragmentation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **₹0.50 Cr** | Both | None (Insufficient budget) | ₹0.00 | ₹0.00 Cr | 0.0% | Baseline | 12 $\rightarrow$ 12 |
| **₹1.00 Cr** | **Connectivity** | `cand_010` | ₹51,58,000 | ₹0.52 Cr | 51.6% | 15.17 $\rightarrow$ 15.42 (+0.24 pts) | 12 $\rightarrow$ 11 |
| **₹1.00 Cr** | **Heat Proxy** | `cand_010` | ₹51,58,000 | ₹0.52 Cr | 51.6% | 0.0 $\rightarrow$ 4.85 ha (+4.85 ha) | 12 $\rightarrow$ 11 |
| **₹3.00 Cr** | **Connectivity** | `cand_001`, `cand_010`, `cand_011` | ₹2,85,34,000 | ₹2.85 Cr | 95.1% | 15.17 $\rightarrow$ 16.53 (+1.36 pts) | 12 $\rightarrow$ 9 |
| **₹3.00 Cr** | **Heat Proxy** | `cand_013`, `cand_010`, `cand_012` | ₹2,78,36,000 | ₹2.78 Cr | 92.8% | 0.0 $\rightarrow$ 25.60 ha (+25.60 ha) | 12 $\rightarrow$ 9 |
| **₹5.00 Cr** | **Connectivity** | `cand_001`, `cand_010`, `cand_011`, `cand_008`, `cand_007` | ₹4,98,22,000 | ₹4.98 Cr | 99.6% | 15.17 $\rightarrow$ 17.35 (+2.17 pts) | 12 $\rightarrow$ 7 |
| **₹5.00 Cr** | **Heat Proxy** | `cand_013`, `cand_010`, `cand_014`, `cand_012`, `cand_007` | ₹4,79,75,000 | ₹4.80 Cr | 96.0% | 0.0 $\rightarrow$ 40.48 ha (+40.48 ha) | 12 $\rightarrow$ 7 |
| **₹10.00 Cr** | **Connectivity** | `cand_001`, `cand_010`, `cand_011`, `cand_008`, `cand_007`, `cand_002`, `cand_003`, `cand_013` | ₹9,63,91,000 | ₹9.64 Cr | 96.4% | 15.17 $\rightarrow$ 20.36 (+5.19 pts) | 12 $\rightarrow$ 4 |
| **₹10.00 Cr** | **Heat Proxy** | `cand_013`, `cand_010`, `cand_014`, `cand_012`, `cand_003`, `cand_007`, `cand_005`, `cand_002`, `cand_011` | ₹9,98,82,000 | ₹9.99 Cr | 99.9% | 0.0 $\rightarrow$ 66.40 ha (+66.40 ha) | 12 $\rightarrow$ 5 |

### 6.3 ₹5.00 Cr Scenario Comparison Breakdown
- **Consensus Corridors (2):** `cand_007` (Hauz Khas to Siri Fort), `cand_010` (Delhi Golf Club to National Zoo)
- **Divergent Connectivity Corridors (3):** `cand_001`, `cand_008`, `cand_011`
- **Divergent Heat-Priority Corridors (3):** `cand_012`, `cand_013`, `cand_014`

---

## 7. Explicit Caveats & Scientific Disclaimers

Judges appreciate transparency and rigor over unsupported marketing claims. The prototype adheres to the following principles:

1. **Mapped vs. Verified Green Spaces:** Green anchor polygons are sourced from OpenStreetMap (ODbL). They reflect designated public parks, golf courses, and ridge reserves, not field-surveyed ecological canopy quality or species composition.
2. **Planning Candidates vs. Approved Routes:** Candidate corridors are street-network shortest paths along existing roadways. They represent exploratory planning corridors, not legally approved public works engineering projects or underground utility clearance routes.
3. **Provisional Cost Model vs. Official Tenders:** Cost estimates are based on standardized linear road-typology benchmarks (₹2,000–₹6,000 per meter + mobilization). They do not substitute for detailed engineering project reports (DPR) or contractor tender bids.
4. **Heat-Priority Proxy vs. Satellite Thermography:** The 143-cell heat priority grid is an empirical spatial proxy model derived from distance to concrete commercial centers versus cool vegetative buffers. It does not measure satellite land surface temperature (LST) or guarantee specific Celsius temperature reductions.
5. **Greedy Heuristic vs. Global Optimum:** The greedy marginal-benefit knapsack optimizer is a fast, explainable polynomial-time heuristic. While highly effective for interactive planning, it does not mathematically guarantee a globally optimal integer-programming solution.

---

## 8. Reliable Local Startup Commands

### Fast Launch via PowerShell Script (Windows)
From the project root:
```powershell
.\run_dev.ps1
```
*Checks prerequisites, starts FastAPI backend on `:8000`, starts Vite frontend on `:5173`, and automatically opens the browser.*

### Manual Startup (Separate Terminals)

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Health Check: `curl http://127.0.0.1:8000/api/v1/health`*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
*Open Browser: `http://127.0.0.1:5173`*

### Technical Verification Commands
```bash
# Run complete test suite (29 tests)
backend\.venv\Scripts\pytest backend/tests -v

# Run live API determinism & numerical verification
backend\.venv\Scripts\python backend/verify_live_api.py

# Run frontend production build
cd frontend && npm run build
```
