# Terranex — Adaptive Landslide Intelligence & Emergency Decision Support

**Terranex** (*Terra* [Terrain] + *Nex* [Next Connection]) is an emergency decision-support platform designed for **Rudraprayag district, Uttarakhand (Garhwal Himalayas)**. During heavy monsoon events and cloudbursts, cascading landslides sever critical road arteries, isolating vulnerable pilgrim corridors and valley settlements.

Terranex provides real-time situational awareness, 24-hour early warning timeline projections, explainable geotechnical risk scoring (Caine 1980 threshold), dynamic multi-resource dispatch matching, and multimodal evacuation routing.

---

## Core Capabilities

### 1. Dual Operational Modes
- **Real-time Live Mode**: Ingests real-time precipitation and 24-hour hour-by-hour forecast series from Open-Meteo across the district.
- **Simulation Mode**: Interactive crisis simulator allowing disaster commanders to vary rainfall intensity ($0 - 150\text{ mm}$), antecedent 24–48h rain, and 48–72h saturation to test crisis thresholds (*Kedarnath Cut-off at 85 mm*, *Cloudburst at 130 mm*).

### 2. 24-Hour Early Warning Timeline
- Interactive **T+0 to T+23 hour slider** with Play/Pause auto-stepper.
- Hour-by-hour projection of road hazard probabilities, severed corridors, cut-off settlements, and isolated population totals.

### 3. Explainable Risk Model (Caine 1980 Threshold)
- Rather than a black-box, every road segment evaluates a continuous failure probability $P \in [0.0, 1.0]$ built from 3 transparent, additive drivers:
  - **Terrain Slope Gradient (40% Weight)**: Derived from Digital Elevation Model slope profiling.
  - **Rainfall Intensity vs. Caine 1980 Threshold (40% Weight)**: Compares hourly precipitation against the published global empirical threshold:
    $$I_c = 14.82 \times D^{-0.39} \quad [\text{mm/hr}]$$
    *(For 1-hour cloudburst events: $I_c = 14.82\text{ mm/hr}$).*
  - **72h Antecedent Soil Saturation (20% Weight)**: Decayed antecedent moisture ($0.5 R_1 + 0.25 R_2$).
- Outputs clear narrative explanations (e.g., *"Rainfall rate (16.0 mm/hr) surpassed Caine critical threshold (14.8 mm/hr)"*) with dominant cause identification.

### 4. Dynamic Resource Allocation & Depots Inventory
- Powered by configurable staging depots ([`backend/data/depots.json`](backend/data/depots.json)):
  - **Hospital Ambulance Bases**: District Hospital Rudraprayag, CHC Ukhimath, PHC Guptkashi.
  - **SDRF / NDRF Bases**: Augustmuni Rescue Post, DEOC Central Disaster Depot.
  - **PWD / BRO Machinery Depots**: Guptkashi Heavy Equipment Yard.
- **Population-Based Triage Needs**:
  - Critical medical patients ($1.5\%$ of isolated population).
  - High-clearance ambulances (4 casualties per turnaround).
  - Multi-person SDRF search & rescue crews (1 team per 800 residents).
  - Heavy excavators for road clearance.
  - Relief food/water survival packs.

### 5. Multimodal Access & Patient Evacuation
- When direct vehicular roads are severed, the engine evaluates **3 mitigation options**:
  - **Option (a) Alternate Detour Route**: Contiguous unblocked surface paths with km and transit ETA.
  - **Option (b) Excavator Clearance ETA**: Machinery transit time ($15\text{ km/h}$) + debris removal time ($3\text{ hours/site}$ assumption).
  - **Option (c) Aerial / Foot Transit**: Drive to the closest unblocked roadhead + foot trek hike at $4\text{ km/h}$, or flag helicopter airlift if hike exceeds $12\text{ km}$ or $4\text{ hours}$.
- **Patient Evacuation Pathways**: Recommends either surface ambulance transport to the fastest reachable hospital, or flags `AERIAL HELI EVACUATION REQUIRED` with designated staging helipads.

---

## Crisis Command Map & UI

- **Central Basemap**: High-performance, clean dark canvas powered by **Esri World Dark Gray Base** (100% free, zero API key required, zero watermarks).
- **Probability Gradient Polylines**:
  - Green (`#10b981`): Operational ($P < 0.25$)
  - Amber (`#eab308`): Elevated Risk ($0.25 \le P < 0.45$)
  - Orange (`#f97316`): Hazard Warning ($0.45 \le P < 0.60$)
  - Crimson Red (`#ef4444`): Critical Blockage ($P \ge 0.60$)
- **Custom Distinct Node Markers**:
  - Villages: Emerald circle markers with population tooltips.
  - Hospitals: Medical cross (+) pins with casualty staging indicators.
  - Depots: Interactive SVG markers (SDRF Shields, PWD Gears, Ambulance Crosses) with live inventory popups.

---

## System Architecture

```
                  ┌─────────────────────────────────────┐
                  │          Open-Meteo API             │
                  │  (Hourly Forecast + 72h Antecedent) │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │           FastAPI Backend           │
                  │                                     │
                  │  • models/risk_model.py (Caine 1980)│
                  │  • services/dispatch.py (Depot Triage)
                  │  • services/routing.py (Dijkstra)   │
                  │  • services/cascade.py (NetworkX)   │
                  └──────────────────┬──────────────────┘
                                     │ JSON REST APIs
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          React 19 + Vite UI         │
                  │                                     │
                  │  • Leaflet + Esri Dark Canvas       │
                  │  • 24h Early Warning Slider         │
                  │  • Explainability Inspector Drawer  │
                  │  • Dynamic Dispatch & Evacuation    │
                  └─────────────────────────────────────┘
```

---

## API Reference

### Risk & Early Warning Endpoints
- `GET /risk/timeline?hours=24&threshold=0.5`: Hour-by-hour early warning timeline with rainfall forecast, per-edge probability mapping, blocked road counts, and cut-off settlements.
- `GET /risk/segment/{edge_id}?rainfall_mm=...&prior1=...&prior2=...`: Detailed explainability diagnostics (slope %, Caine critical intensity, antecedent contribution, dominant cause).
- `GET /risk/simulation?rainfall_mm=...&prior1=...&prior2=...`: Evaluates explainable risk across all network segments under custom simulation parameters.

### Dispatch & Resource Endpoints
- `GET /depots`: Returns active emergency depots (locations, equipment inventories for ambulances, rescue teams, excavators, medical units).
- `GET /dispatch/plan?mode={live|simulation}&hour={T}&rainfall_mm={mm}`: Full dynamic dispatch plan matching depots to cut-off settlements, population-based triage needs, 3-way access mitigation, and patient evacuation status.

### Telemetry & Network Endpoints
- `GET /network`: Returns topological graph nodes (villages, hospitals) and road segments with geometries and gradient profiles.
- `GET /live/rainfall`: Real-time weather telemetry for Rudraprayag (`past_24h_mm`, `effective_72h_mm`, `next_24h_mm`).
- `GET /live/villages`: Multi-location batch telemetry across 8 valley stations.
- `GET /route/safe?source={id}&target={id}`: Safest viable evacuation route avoiding high-hazard roads with `has_foot_trek` detection.
- `GET /simulate/cascade?rainfall_mm={mm}`: Deterministic cascade connectivity analysis.

---

## Local Setup & Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --port 8000 --host 127.0.0.1
```
Backend API will be live at: [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs at `/docs`).

### 2. Frontend Setup
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev -- --port 5173 --host 127.0.0.1
```
Open your browser at: [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## Documented Assumptions & Limitations

1. **Threshold Empirical Calibration**: Caine (1980) ($I_c = 14.82 D^{-0.39}$) is a worldwide empirical baseline for shallow landslides. Regional debris flows in the Garhwal Himalayas vary based on regolith thickness and monsoon saturation; localized recalibration will be performed once official GSI/ISRO landslide inventories are ingested.
2. **Depots Sample Data**: Staging bases and available equipment counts in `depots.json` represent realistic baseline figures and carry the explicit note: `SAMPLE - replace with DDMA data`.
3. **Upper Valley Geometries**: Edges `E01–E05`, `E10–E11` use OpenStreetMap alignments, while upper pilgrim trail corridors (`E06, E07, E08, E09, E12`) use natural switchback splines marked `unverified`.
4. **Road Clearance Rate**: Heavy excavator debris removal is modeled at an assumed operational standard of 3 hours per landslide blockage site.
5. **No Synthetic Filler Data**: All metrics, routes, and triage allocations displayed in the application are computed directly by backend endpoints from real network graph topology and live Open-Meteo telemetry.
