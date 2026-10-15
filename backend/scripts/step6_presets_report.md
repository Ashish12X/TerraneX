# Step 6: Presets Verification Report (20, 55, 85, 130 mm)

> Date: 2026-10-15
> Cascade Model: Threshold-based progressive isolation simulation
> Terrain Susceptibility Status: DEM Ranking with E09 Manual Override (0.88)

## Cascade Simulation Results Table

| Rainfall (mm) | Blocked Roads Count | Blocked Road IDs | Isolated Villages Count | Isolated Villages List | Population Isolated | Frontend Status |
|---|---|---|---|---|---|---|
| **20 mm** | **0** | None | **0** | None (All connected) | **0** | In Sync |
| **55 mm** | **0** | None | **0** | None (All connected) | **0** | In Sync |
| **85 mm** | **5** | E04, E07, E08, E09, E12 | **3** | Kedarnath, Rambara, Triyuginarayan | **2740** | In Sync |
| **130 mm** | **8** | E02, E04, E05, E06, E07, E08, E09, E12 | **5** | Sonprayag, Kedarnath, Rambara, Phata, Triyuginarayan | **4820** | In Sync |

## Detailed Breakdown by Preset Level

### 1. Normal (20 mm) — Safe
- **Blocked Roads (0)**: None
- **Isolated Villages (0)**: All 8 villages connected to hospitals
- **Isolated Population**: 0

### 2. Pre-alert (55 mm) — Alert
- **Blocked Roads (0)**: None (High-slope roads are near threshold but under cutoff)
- **Isolated Villages (0)**: All 8 villages remain accessible
- **Isolated Population**: 0

### 3. Upper Valley Cutoff (85 mm) — Critical
- **Blocked Roads (5)**: E04 (V02->V03, risk=0.56), E07 (V04->V08, risk=0.77), E08 (V04->V06, risk=0.70), E09 (V05->V06, risk=0.75), E12 (V07->V08, risk=0.63)
- **Isolated Villages (3)**: Kedarnath (Pop: 1200), Rambara (Pop: 650), Triyuginarayan (Pop: 890)
- **Isolated Population**: 2740

### 4. Cloudburst Crisis (130 mm) — Disaster
- **Blocked Roads (8)**: E02 (V01->V03, risk=0.64), E04 (V02->V03, risk=0.86), E05 (V03->V07, risk=0.53), E06 (V04->V07, risk=0.74), E07 (V04->V08, risk=1.00), E08 (V04->V06, risk=1.00), E09 (V05->V06, risk=1.00), E12 (V07->V08, risk=0.96)
- **Isolated Villages (5)**: Sonprayag (Pop: 980), Kedarnath (Pop: 1200), Rambara (Pop: 650), Phata (Pop: 1100), Triyuginarayan (Pop: 890)
- **Isolated Population**: 4820

## Frontend Alignment Verification

- `frontend/src/App.jsx` `DEMO_PRESETS` array matches the simulation numbers exactly:
  - 20 mm: `0 blocked • All 8 villages connected` (Matches)
  - 55 mm: `0 blocked • High-slope roads near threshold` (Matches)
  - 85 mm: `5 roads blocked • Kedarnath, Rambara, Triyuginarayan cut off (2,740 pop)` (Matches)
  - 130 mm: `8 roads blocked • 5 villages cut off (4,820 pop)` (Matches)
- No updates needed in frontend descriptions as preset numbers are in exact harmony.
