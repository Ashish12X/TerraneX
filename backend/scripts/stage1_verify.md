# Terranex Stage 1 API Verification Report

Generated: 2026-10-15  
Environment: Local FastAPI test client (`backend/main.py`)  
Network Topology: 11 nodes (8 villages, 3 hospitals), 12 edges

---

## 1. Cascade Simulation (`/simulate/cascade`) across Rainfall Levels

| Preset Level | Rainfall (mm) | Blocked Roads Count | Blocked Road IDs | Isolated Villages Count | Isolated Village Names | Isolated Population | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal** | 20 mm | 0 | None (`[]`) | 0 | None (`[]`) | 0 | Verified |
| **Pre-alert** | 55 mm | 0 | None (`[]`) | 0 | None (`[]`) | 0 | Verified |
| **Upper Valley Cutoff** | 85 mm | **5** | **E06, E07, E08, E09, E12** | **4** | **Sonprayag, Kedarnath, Rambara, Triyuginarayan** | **3,720** | **Exact Match** |
| **Cloudburst Crisis** | 130 mm | 8 | E02, E04, E05, E06, E07, E08, E09, E12 | 5 | Sonprayag, Kedarnath, Rambara, Phata, Triyuginarayan | 4,820 | Verified |

### Details for 85 mm Verification
- **Road Risk Breakdown at 85 mm ($risk \ge 0.50$ implies blocked):**
  - `E06` (Sonprayag ↔ Phata): risk = 0.63 $\rightarrow$ **Blocked**
  - `E07` (Sonprayag ↔ Triyuginarayan): risk = 0.77 $\rightarrow$ **Blocked**
  - `E08` (Sonprayag ↔ Rambara): risk = 0.70 $\rightarrow$ **Blocked**
  - `E09` (Rambara ↔ Kedarnath): risk = 0.75 $\rightarrow$ **Blocked**
  - `E12` (Phata ↔ Triyuginarayan): risk = 0.63 $\rightarrow$ **Blocked**
  - Other roads (`E01`, `E02`, `E03`, `E04`, `E05`, `E10`, `E11`): risk < 0.50 $\rightarrow$ Open
- **Isolated Villages Population Sum:**
  - Sonprayag (`V04`): 620
  - Kedarnath (`V05`): 1,200
  - Rambara (`V06`): 450
  - Triyuginarayan (`V08`): 1,450
  - **Total Population Isolated:** $620 + 1200 + 450 + 1450 = \mathbf{3,720}$

---

## 2. Safe Routing & Foot Trek Detection (`/route/safe`)

### Test Case A: Kedarnath (`source=V05`, `rainfall_mm=20`)
```json
{
  "rainfall_mm": 20.0,
  "source": "V05",
  "target": "H03",
  "route_found": true,
  "safe_route": {
    "nodes": ["V05", "V06", "V04", "V07", "V03", "H03"],
    "names": ["Kedarnath", "Rambara", "Sonprayag", "Phata", "Guptkashi", "PHC Guptkashi"],
    "distance_km": 65.5,
    "max_edge_risk": 0.176,
    "has_foot_trek": true
  }
}
```
- **Confirmation:** `has_foot_trek` is **`true`** because edge `E09` (`road_type="trek"`) is traversed between Rambara and Kedarnath.

---

### Test Case B: Phata (`source=V07`, `rainfall_mm=20`)
```json
{
  "rainfall_mm": 20.0,
  "source": "V07",
  "target": "H03",
  "route_found": true,
  "safe_route": {
    "nodes": ["V07", "V03", "H03"],
    "names": ["Phata", "Guptkashi", "PHC Guptkashi"],
    "distance_km": 20.5,
    "max_edge_risk": 0.08,
    "has_foot_trek": false
  }
}
```
- **Confirmation:** `has_foot_trek` is **`false`** because motorable road network only is traversed.

---

## 3. Live 72h Antecedent Telemetry (`/live/rainfall`)
```json
{
  "source": "Open-Meteo",
  "location": "Rudraprayag",
  "observed_at": "2026-10-15T17:30",
  "current_mm_per_hr": 0.0,
  "past_24h_mm": 8.4,
  "past_24_48h_mm": 0.0,
  "past_48_72h_mm": 0.2,
  "effective_72h_mm": 8.5,
  "next_24h_mm": 0.2,
  "cached": false
}
```
- **Formula:** $\text{effective} = p_0 + 0.5 \cdot p_1 + 0.25 \cdot p_2 = 8.4 + 0.5(0.0) + 0.25(0.2) = 8.45 \approx 8.5\text{ mm}$
