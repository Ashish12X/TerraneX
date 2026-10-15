# Terrain Rerun Analysis Report (Post-Geometry Recomputation)

> Date: 2026-10-15
> Terrain Script: backend/scripts/terrain.py rerun on updated geometries
> Invariants Verified: length_km, geometry_source, coordinates strictly preserved = **True**

## 1. Edge Susceptibility & Gradient Comparison (Before vs After Rerun)

| Edge | Route | length_km | Geom Source | Old Mean Grad | New Mean Grad | Old Susc | New Susc | Change | Source / Rule |
|---|---|---|---|---|---|---|---|---|---|
| **E01** | District Hospital Rudraprayag → Augustmuni | 18 km | osm | 3.6% | **3.6%** | 0.33 | **0.33** | 0.00 (Same) | dem_terrain_ranking |
| **E02** | Augustmuni → Guptkashi | 27 km | osm | 9.9% | **9.9%** | 0.49 | **0.49** | 0.00 (Same) | dem_terrain_ranking |
| **E03** | Augustmuni → Ukhimath | 30 km | osm | 3.2% | **3.2%** | 0.25 | **0.25** | 0.00 (Same) | dem_terrain_ranking |
| **E04** | Guptkashi → Ukhimath | 14 km | osm | 17.3% | **17.3%** | 0.66 | **0.57** | -0.09 | dem_terrain_ranking |
| **E05** | Guptkashi → Phata | 20 km | osm | 4.8% | **4.8%** | 0.41 | **0.41** | 0.00 (Same) | dem_terrain_ranking |
| **E06** | Phata → Sonprayag | 22 km | approximated_corridor | 10.5% | **29.4%** | 0.57 | **0.74** | +0.17 | dem_terrain_ranking |
| **E07** | Sonprayag → Triyuginarayan | 12 km | approximated | 38.2% | **33.4%** | 0.90 | **0.90** | 0.00 (Same) | dem_terrain_ranking |
| **E08** | Sonprayag → Rambara | 16 km | approximated | 31.3% | **25.2%** | 0.82 | **0.66** | -0.16 | dem_terrain_ranking |
| **E09** | Rambara → Kedarnath | 7 km | approximated | 17.9% | **24.8%** | 0.88 | **0.88** | 0.00 (Same) | manual_expert_override |
| **E10** | Ukhimath → CHC Ukhimath | 0.5 km | osm | 19.8% | **19.8%** | 0.10 | **0.10** | 0.00 (Same) | short_edge_default |
| **E11** | Guptkashi → PHC Guptkashi | 0.5 km | osm | 4.8% | **4.8%** | 0.10 | **0.10** | 0.00 (Same) | short_edge_default |
| **E12** | Phata → Triyuginarayan | 25 km | approximated | 30.2% | **30.2%** | 0.74 | **0.82** | +0.08 | dem_terrain_ranking |

### Key Edge Observations:
- **E06 (Phata → Sonprayag)**: Mean gradient changed from 10.5% → **29.4%** on the new Mandakini gorge geometry. Susceptibility increased from 0.57 → **0.74**.
- **E07 (Sonprayag → Triyuginarayan)**: Mean gradient 38.2% → **33.4%** on calibrated switchbacks. Highest mean slope rank, susceptibility preserved at top tier **0.90**.
- **E08 (Sonprayag → Rambara)**: Mean gradient 31.3% → **25.2%** on switchback path. Susceptibility shifted from 0.82 → **0.66**.
- **E09 (Rambara → Kedarnath)**: Manual expert override strictly preserved at **0.88** (`manual_expert_override`).
- **E10 & E11 (Short hospital connectors)**: Maintained at **0.10** (`short_edge_default`).
- **E07, E08, E09, E12**: Marked as `approximated` geometry source with approximate gradients.

## 2. Cascade Simulation Outputs (20, 55, 85, 130 mm)

| Rainfall (mm) | Blocked Roads Count | Blocked Road IDs | Isolated Villages Count | Isolated Villages List | Population Isolated |
|---|---|---|---|---|---|
| **20 mm** | **0** | None | **0** | None (All connected) | **0** |
| **55 mm** | **0** | None | **0** | None (All connected) | **0** |
| **85 mm** | **5** | E06, E07, E08, E09, E12 | **4** | Sonprayag, Kedarnath, Rambara, Triyuginarayan | **3720** |
| **130 mm** | **8** | E02, E04, E05, E06, E07, E08, E09, E12 | **5** | Sonprayag, Kedarnath, Rambara, Phata, Triyuginarayan | **4820** |

## 3. Comparison with Previous Presets & Frontend Impact

| Level | Previous Blocked Roads | Current Blocked Roads | Previous Isolated Pop | Current Isolated Pop | Frontend Status |
|---|---|---|---|---|---|
| 20 mm | 0 | 0 | 0 | 0 | Exact Match |
| 55 mm | 0 | 0 | 0 | 0 | Exact Match |
| 85 mm | 5 (E04, E07, E08, E09, E12) | 5 (E06, E07, E08, E09, E12) | 2,740 | 3,720 | **Updated & In Sync** |
| 130 mm | 8 (E02, E04, E05, E06, E07, E08, E09, E12) | 8 (E02, E04, E05, E06, E07, E08, E09, E12) | 4,820 | 4,820 | Exact Match |
