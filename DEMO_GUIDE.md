# GreenLink Delhi — Judge Demo Guide & Presentation Package

> **Hackathon Track:** Urban Resilience & Geospatial AI  
> **Status:** Production Verified • 29/29 Automated Tests Passing • Phase 4 Polish Complete  
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
| **Green Space Anchors** | 12 Mapped OpenStreetMap Polygons | Total area: $1,752.7\text{ ha}$ (OSM-mapped boundaries; not field-verified canopy densities) |
| **Street Network** | 77,474 OSM nodes, 86,661 edges | Filtered for pedestrian/walkable urban rights-of-way |
| **Candidate Corridors** | 14 Shortest-Path Street Alignments | Total network: $46.95\text{ km}$, Total cost: ₹17.16 Cr (planning estimates, not tender bids) |
| **Spatial Projection** | `EPSG:32643` (UTM Zone 43N) | Metric calculations for corridor lengths, 50m buffers, and grid intersections |
| **Web Map CRS** | `EPSG:4326` (WGS 84) | GeoJSON standard for Leaflet / MapLibre GL JS vector display |
| **Basemap** | Positron Light (OpenFreeMap) | Clean, high-contrast, zero-cost, no private API key required |

---

## 3. Algorithmic Architecture

### 3.1 Candidate Corridor Generation
Corridors are not arbitrary straight lines. Using the filtered OSM street network, candidate routes are computed as **metric shortest paths between anchor centroids** using Dijkstra's algorithm. Each candidate route inherits the real street typology (Primary, Secondary, Tertiary, Residential, Pedestrian) and associated provisional development costs:
$$\text{Cost}(c) = \text{Base Mobilization} (₹1.5\text{ Lakh}) + \sum_{seg \in c} \text{Length}(seg) \times \text{Rate}(\text{Typology})$$

### 3.2 Knapsack Optimizer & Budget Invariant
The engine implements a **deterministic greedy marginal-benefit algorithm with dynamic recalculation**:
1. Filter candidates where $\text{Cost}(c) \le \text{Remaining Budget}$.
2. In each iteration, evaluate the marginal gain $\Delta f(c \mid S) = f(S \cup \{c\}) - f(S)$.
3. Select the candidate with highest marginal benefit-to-cost ratio:
   $$c^* = \arg\max_{c \notin S} \frac{\Delta f(c \mid S)}{\text{Cost}(c)}$$
4. Deduct $\text{Cost}(c^*)$ from remaining budget and repeat until no candidate fits.
5. **Invariant:** The total cost $\sum_{c \in S} \text{Cost}(c)$ is strictly bounded by $B$ under all conditions.

### 3.3 Two Distinct Objective Functions
- **Connectivity-First Profile ($IIC_{dist}$):**  
  Measures topological graph connectivity weighted by anchor habitat area and corridor travel distance:
  $$IIC_{dist} = \frac{\sum_{comp} \sum_{i,j \in comp} \frac{a_i \cdot a_j}{1 + d_G(i,j)/d_0}}{A_{tot}^2} \times 100$$
  *Where $d_0 = 1,000\text{ m}$ (1 km characteristic dispersal distance) and $A_{tot} = 1,752.7\text{ ha}$.*
- **Heat-Priority-First Profile ($H$):**  
  Measures weighted intersection area between candidate 50m buffers and 143 empirical heat-vulnerability grid cells ($w_k \in [0.15, 0.95]$):
  $$H(S) = \sum_{k=1}^{143} w_k \cdot \text{Area}\left(\left[\bigcup_{c \in S} \text{Buffer}_{25\text{m}}(c)\right] \cap \text{Cell}_k\right)$$
  *Corridor buffers are merged via `shapely.ops.unary_union` to mathematically prevent double-counting shared roadway space.*

---

## 4. 90-Second Spoken Pitch (Judge Script)

> *"Good afternoon, judges. This is **GreenLink Delhi**, an urban green-corridor decision-support tool.*
>
> *Urban planners in Delhi face a critical dilemma: our major urban parks—like Sanjay Van and Hauz Khas—are severed into isolated ecological islands by dense roads. But municipal authorities have finite budgets. They cannot afford to green every street, nor do they know which street rights-of-way deliver the highest ecological or cooling return per rupee spent.*
>
> *GreenLink Delhi solves this with algorithmic optimization. We ingested 12 primary green spaces covering 1,750 hectares in South-Central Delhi and mapped 14 candidate street corridors along real OpenStreetMap road centerlines.*
>
> *Instead of guesswork, planners set a realistic municipal budget—say, ₹5 Crore—and choose an objective. Under a **Connectivity-First** strategy, our greedy knapsack optimizer selects 5 strategic corridors costing ₹4.80 Crore, boosting the network connectivity index by +2.17 points and bridging 5 previously isolated park clusters.*
>
> *Switch to **Thermal Heat Priority**, and the algorithm shifts focus: it still selects high-impact consensus corridors like corridor 10, but redirects funds to dense, high-vulnerability urban heat pockets.*
>
> *Our scenario comparison modal exposes the exact trade-offs: which corridors are consensus choices regardless of politics, and where priorities diverge.*
>
> *Every calculation is backed by metric UTM projections, geometric union buffering to eliminate double-counting, and a 29-test automated validation suite. GreenLink Delhi provides the quantitative evidence needed to turn urban greening plans into defensible public investments. Thank you!"*

---

## 5. Five-Minute Live Demonstration Script

| Time | Stage | Actions & Visual Cue | Script / Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:45** | **The Problem & Baseline** | • Display [http://127.0.0.1:5173/](http://127.0.0.1:5173/)<br>• Point to Positron map and emerald green patches<br>• Open "Judge Demo Guide" modal | *"Welcome to GreenLink Delhi. The map shows South-Central Delhi—131 square kilometers containing 12 major green anchors like Sanjay Van and Hauz Khas. Notice the problem immediately: these green spaces are isolated fragments. Our header indicates a verified baseline connectivity index of just 0.16 points."* |
| **0:45 - 1:30** | **Candidate Street Network** | • Dismiss Guide modal<br>• Toggle amber candidate corridor lines<br>• Click corridor `cand_010` in sidebar | *"We mapped 14 candidate street corridors along real OSM road centerlines, spanning 46.9 km. Each corridor has a street-typology cost model. For instance, corridor 10 is a 1.7 km secondary street costing ₹85 Lakh connecting Hauz Khas to Rose Garden. Greening all 14 candidates would cost ₹17.16 Crore—far more than a municipal ward's immediate budget."* |
| **1:30 - 2:30** | **Optimization: ₹1 Cr Budget** | • Set budget slider to ₹1.00 Cr<br>• Select 'Connectivity First'<br>• Click 'Run Optimizer' | *"Let's test fiscal austerity. We set a ₹1 Crore budget. The optimizer evaluates marginal gains and immediately identifies `cand_010` as the highest ROI investment: ₹0.85 Cr utilized, yielding a +0.57 point connectivity gain. Notice the sidebar auto-switches to the Plan tab, providing a transparent breakdown and step-by-step selection rationales."* |
| **2:30 - 3:30** | **Scale Up: ₹5 Cr Municipal Budget** | • Slide budget to ₹5.00 Cr<br>• Click 'Run Optimizer'<br>• Point to selected emerald routes | *"Now let's expand to a realistic municipal phase budget of ₹5 Crore. The optimizer selects 5 corridors—routes 10, 7, 9, 1, and 3—utilizing ₹4.75 Cr (95% budget utilization). Notice the network effect: network connectivity jumps by +2.17 points, and isolated green clusters drop from 12 to 7. The map renders these selections as crisp, glowing emerald corridors over the road basemap."* |
| **3:30 - 4:15** | **Scenario Trade-Off Analysis** | • Click 'Compare Scenarios' button in header<br>• Review side-by-side comparison modal | *"Planners often disagree on priorities: biodiversity vs. heat relief. With one click, our 'Compare Scenarios' engine runs both Connectivity-First and Heat-Priority profiles under the same ₹5 Cr budget. The modal highlights consensus corridors—routes selected by both strategies—versus divergent routes. Connectivity links large habitat patches, while Heat-Priority routes corridors into dense built-up residential neighborhoods."* |
| **4:15 - 4:45** | **Dynamic Invariant & Stale State** | • Close modal<br>• Nudge slider to ₹6.0 Cr without clicking optimize | *"Observe our UI integrity: if a planner adjusts the budget without recalculating, the system immediately displays an amber warning: 'Parameters changed — Run optimizer to refresh'. No stale or misleading data is ever presented as current."* |
| **4:45 - 5:00** | **Scientific Honesty & Q&A** | • Point to disclaimer footer<br>• Conclude presentation | *"We want to be scientifically honest: our costs are provisional planning benchmarks, our heat layer is an empirical spatial proxy rather than satellite radiometry, and our green spaces are OSM-mapped boundaries. GreenLink Delhi is a robust, transparent decision-support prototype. Thank you, and we welcome your questions!"* |

---

## 6. Real Application Numerical Reference Sheet

Use these **exact computed values** during judge interactions:

- **Total Green Anchors:** 12 features | $1,752.72\text{ ha}$
- **Total Candidate Corridors:** 14 corridors | $46.95\text{ km}$ | ₹17.16 Cr total cost
- **Baseline Connectivity ($IIC_{dist}$):** 0.16 points | 12 isolated components
- **Under ₹1.00 Cr Budget (Connectivity-First):**
  - Corridors Selected: 1 (`cand_010`)
  - Budget Utilized: ₹0.85 Cr (85.0%)
  - Connectivity Gain: +0.57 IIC points
  - Remaining Budget: ₹0.15 Cr
- **Under ₹5.00 Cr Budget (Connectivity-First):**
  - Corridors Selected: 5 (`cand_010`, `cand_007`, `cand_009`, `cand_001`, `cand_003`)
  - Budget Utilized: ₹4.75 Cr (95.0%)
  - Connectivity Gain: +2.17 IIC points
  - Remaining Budget: ₹0.25 Cr
  - Connected Anchors: 7 anchors linked
- **Under ₹5.00 Cr Budget (Heat-Priority-First):**
  - Corridors Selected: 5 (`cand_010`, `cand_007`, `cand_008`, `cand_005`, `cand_002`)
  - Budget Utilized: ₹4.68 Cr (93.6%)
  - Heat Proxy Area: 40.48 ha covered
  - Consensus Corridors: `cand_010`, `cand_007` (selected by both profiles)
  - Divergent Corridors: `cand_009`, `cand_001`, `cand_003` (Connectivity) vs. `cand_008`, `cand_005`, `cand_002` (Heat)

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

### Verification Commands
```bash
# Run complete test suite (29 tests)
backend\.venv\Scripts\pytest backend/tests -v

# Run production frontend build
cd frontend && npm run build
```
