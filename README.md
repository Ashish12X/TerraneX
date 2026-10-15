# Terranex — Valley Cascade & Triage Intelligence

**Terranex** (*Terra* [Terrain] + *Nex* [Next Connection]) is an emergency intelligence system for **Rudraprayag district, Uttarakhand**. In mountainous Himalayan valleys, monsoon rainfall and cloudbursts trigger cascading landslides that sever road corridors. Terranex analyzes which roads block first, which remote villages become cut off from critical healthcare, and how to optimally dispatch limited emergency response assets (ambulances, rescue teams, excavators).

---

## Key Features

1. **Graph-Based Cascade Simulation (NetworkX)**: Models the road connectivity network as a graph of villages and hospitals, dynamically computing network severance as rainfall intensifies.
2. **Terrain-Based Susceptibility (DEM)**: Relative terrain ranking derived from Digital Elevation Model mean slope gradients across valley corridors.
3. **Dynamic Safe Routing (Dijkstra)**: Routes emergency response around high-risk or blocked corridors rather than relying on shortest physical distance.
4. **Foot-Trek Section Flagging**: Automatically flags non-motorable pedestrian tracks (e.g., Rambara ↔ Kedarnath trail) with warning badges indicating vehicular ambulances cannot pass.
5. **Dynamic Resource Prioritization**: Prioritizes isolated populations to assign emergency assets (Ambulances, Foot Rescue Teams, Excavators) according to vulnerability and access.
6. **Live Telemetry & 72h Antecedent Rainfall**: Ingests live weather from Open-Meteo with 24h past, 24h forecast, and a 72-hour antecedent wet-soil index.
7. **Interactive Demo Presets**: One-click scenario simulations (20 mm, 55 mm, 85 mm, 130 mm) for rapid crisis evaluation.

---

## How It Works

### 1. Road Risk Calculation
For each road segment $e$:
$$\text{risk}_e = \text{susceptibility}_e \times \min\left(\frac{\text{rainfall\_mm}}{100}, 1.5\right)$$
A road segment is deemed **Blocked** when:
$$\text{risk}_e \ge 0.50$$

### 2. Village Isolation Criteria
A village is classified as **Isolated** if and only if there is **no unblocked path** connecting it to any reachable hospital in the graph.

### 3. Antecedent Rainfall (Live Mode 72h Wet-Soil Index)
Saturated soil from preceding days lowers landslide thresholds. The effective 72-hour antecedent rainfall is calculated as:
$$\text{effective\_72h} = p_0 + 0.5 \cdot p_1 + 0.25 \cdot p_2$$
- $p_0$: Rainfall in the most recent 0–24h window
- $p_1$: Rainfall in the 24–48h window
- $p_2$: Rainfall in the 48–72h window

---

## Demo Presets (Verified Real API Outputs)

The following values reflect verified real outputs from `/simulate/cascade`:

| Preset Level | Rainfall | Blocked Roads Count | Blocked Road IDs | Isolated Villages Count | Isolated Village Names | Isolated Population |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal** | 20 mm | 0 | None | 0 | None | 0 |
| **Pre-alert** | 55 mm | 0 | None | 0 | None | 0 |
| **Upper Valley Cutoff** | 85 mm | **5** | `E06, E07, E08, E09, E12` | **4** | `Sonprayag, Kedarnath, Rambara, Triyuginarayan` | **3,720** |
| **Cloudburst Crisis** | 130 mm | **8** | `E02, E04, E05, E06, E07, E08, E09, E12` | **5** | `Sonprayag, Kedarnath, Rambara, Phata, Triyuginarayan` | **4,820** |

---

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, NetworkX
- **Frontend**: React 18, Vite, Leaflet / React-Leaflet, Tailwind CSS, Lucide icons
- **Data & Telemetry**: Open-Meteo REST API (free tier, no token required), GeoJSON / JSON network topology

---

## Local Setup & Run

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies (fastapi, uvicorn, networkx)
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8000
```
Backend will be available at: [http://127.0.0.1:8000](http://127.0.0.1:8000) (Swagger Docs at `/docs`).

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be available at: [http://localhost:5173](http://localhost:5173).

---

## API Endpoints

- `GET /network?rainfall_mm={mm}`: Returns graph nodes (coordinates, isolation status) and edges (risk, blocked flags).
- `GET /simulate/cascade?rainfall_mm={mm}`: Evaluates valley cascade impact, returning blocked road counts, isolated village lists, and isolated population totals.
- `GET /prioritize/resources?rainfall_mm={mm}`: Dispatches available ambulances, rescue teams, and excavators to isolated villages based on triage rules.
- `GET /route/safe?source={village_id}&rainfall_mm={mm}&target={optional_hospital_id}`: Computes the safest viable route avoiding blocked roads, with distance, GPS coordinates, and `has_foot_trek` boolean flag.
- `GET /live/rainfall`: Fetches live weather from Open-Meteo for Rudraprayag (`past_24h_mm`, `past_24_48h_mm`, `past_48_72h_mm`, `effective_72h_mm`, `next_24h_mm`).
- `GET /live/cascade?basis={past_24h|next_24h|effective_72h}`: Connects live rainfall telemetry directly into cascade simulation and triage dispatch.

---

## Honest Limitations

Transparency regarding the current hackathon prototype:

1. **Synthetic & Placeholder Metrics**: Node coordinates, village populations (~450 to ~2,400), and road lengths (`length_km`) represent simplified prototype approximations.
2. **Approximated Road Geometries**: While edges `E01-E05`, `E10-E11` utilize OpenStreetMap alignments, segments `E06`, `E07`, `E08`, `E09`, and `E12` use synthetic interpolated splines rather than surveyed road vectors.
3. **E09 Manual Expert Override**: Susceptibility for `E09` (0.88) is a hardcoded expert override based on historical valley vulnerability, rather than purely DEM-calculated gradient.
4. **Relative Susceptibility vs. Real Probability**: Susceptibility figures represent relative rankings based on DEM terrain slope, not empirical geotechnical failure probabilities.
5. **Antecedent Weights**: The 72h antecedent weights ($0.5$ and $0.25$) are prototype empirical heuristic multipliers and have not been calibrated against hydrological literature or local rain-gauge backtests.
6. **Single Point Weather Telemetry**: Live telemetry uses a single central coordinate for Rudraprayag district (`30.2844, 78.9811`) via Open-Meteo; it does not model micro-climate or elevation-dependent rainfall variation.
7. **No Machine Learning Model**: Current risk assessment is deterministic formula-based graph analytics, not an ML-trained predictive model.
8. **Unverified Narrative Annotations**: Descriptive notes in data files (e.g., "Mandakini gorge corridor") are illustrative references and have not been field-verified.
