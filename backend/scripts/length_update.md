# Network Edge Length Update Report

## Overview
- **Backup File**: `backend/data/network_before_lengths.json`
- **Policy**:
  1. **Approximated Edges (`E06, E07, E08, E09, E12`)**: Inki geometry natural switchback splines se approximated hai, isliye geometry length par bharosa kam hai. Un par `length_km` change **nahi** kiya gaya hai, sirf report mein `unverified` mark kiya gaya hai.
  2. **OSM-based Edges (`E01–E05, E10, E11`)**: OpenStreetMap highway alignments par calibrated hain. Jahan farak > 10% hai, sirf unki `length_km` geometry length se update ki gayi hai.

## Edge Length Comparison Table

| Edge | Nodes | Route Name | Purani length_km | Geometry Length (km) | Ratio (Geom/Old) | Farak (%) | Geometry Source | Status / Action | Nayi length_km |
|---|---|---|---|---|---|---|---|---|---|
| E01 | `H01` → `V01` | District Hospital Rudraprayag — Augustmuni | 18.00 | 17.81 | 0.99 | 1.1% | `osm` | **Keep (<=10% diff)** | **18.00** |
| E02 | `V01` → `V03` | Augustmuni — Guptkashi | 27.00 | 26.94 | 1.00 | 0.2% | `osm` | **Keep (<=10% diff)** | **27.00** |
| E03 | `V01` → `V02` | Augustmuni — Ukhimath | 30.00 | 21.85 | 0.73 | 27.2% | `osm` | **Updated (>10% diff)** | **21.85** |
| E04 | `V03` → `V02` | Guptkashi — Ukhimath | 14.00 | 16.74 | 1.20 | 19.6% | `osm` | **Updated (>10% diff)** | **16.74** |
| E05 | `V03` → `V07` | Guptkashi — Phata | 20.00 | 22.84 | 1.14 | 14.2% | `osm` | **Updated (>10% diff)** | **22.84** |
| E06 | `V07` → `V04` | Phata — Sonprayag | 22.00 | 8.31 | 0.38 | 62.2% | `approximated_corridor` | **unverified** | **22.00** |
| E07 | `V04` → `V08` | Sonprayag — Triyuginarayan | 12.00 | 4.73 | 0.39 | 60.5% | `approximated` | **unverified** | **12.00** |
| E08 | `V04` → `V06` | Sonprayag — Rambara | 16.00 | 9.61 | 0.60 | 39.9% | `approximated` | **unverified** | **16.00** |
| E09 | `V06` → `V05` | Rambara — Kedarnath | 7.00 | 7.06 | 1.01 | 0.8% | `approximated` | **unverified** | **7.00** |
| E10 | `V02` → `H02` | Ukhimath — CHC Ukhimath | 0.50 | 0.17 | 0.33 | 66.5% | `osm` | **Updated (>10% diff)** | **0.17** |
| E11 | `V03` → `H03` | Guptkashi — PHC Guptkashi | 0.50 | 0.41 | 0.81 | 18.7% | `osm` | **Updated (>10% diff)** | **0.41** |
| E12 | `V07` → `V08` | Phata — Triyuginarayan | 25.00 | 11.54 | 0.46 | 53.8% | `approximated` | **unverified** | **25.00** |

## Summary of Updates
- **Updated Edges**: `E03` (30.00 → 21.85 km), `E04` (14.00 → 16.74 km), `E05` (20.00 → 22.84 km), `E10` (0.50 → 0.17 km), `E11` (0.50 → 0.41 km)
- **Retained OSM Edges (Diff <= 10%)**: `E01` (18.00 km, 1.1% diff), `E02` (27.00 km, 0.2% diff)
- **Approximated Edges Marked `unverified` (Retained unchanged)**: `E06` (22.00 km), `E07` (12.00 km), `E08` (16.00 km), `E09` (7.00 km), `E12` (25.00 km)

