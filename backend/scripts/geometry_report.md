# Terranex Edge Geometry Diagnosis

> Coordinates format: [lat, lon]. Haversine used for all distances.
> Normal mountain road ratio: **1.2 – 1.8**.
> Flagged if: ratio outside 1.2-1.8, max consecutive gap > 500 m, or start/end error > 200 m.

## Full Table

| Edge | From>To | Straight km | Geom km | Ratio | MaxGap m | StartErr m | EndErr m | Backtrack | Status |
|------|---------|-------------|---------|-------|----------|-----------|----------|-----------|--------|
| E01 | H01>V01 | 12.41 | 17.81 | 1.43 | 602 | 0 | 0 | 2 | FLAG: gap 602m > 500m |
| E02 | V01>V03 | 15.78 | 26.94 | 1.71 | 947 | 0 | 0 | 16 | FLAG: gap 947m > 500m |
| E03 | V01>V02 | 15.51 | 21.85 | 1.41 | 663 | 0 | 0 | 8 | FLAG: gap 663m > 500m |
| E04 | V03>V02 | 2.16 | 16.74 | 7.75 | 538 | 0 | 0 | 0 | FLAG: ratio 7.75 > 1.8; gap 538m > 500m |
| E05 | V03>V07 | 10.00 | 22.84 | 2.28 | 738 | 0 | 0 | 9 | FLAG: ratio 2.28 > 1.8; gap 738m > 500m |
| E06 | V07>V04 | 5.51 | 8.31 | 1.51 | 233 | 0 | 0 | 0 | OK |
| E07 | V04>V08 | 3.37 | 4.73 | 1.40 | 215 | 0 | 0 | 0 | OK |
| E08 | V04>V06 | 6.01 | 9.61 | 1.60 | 284 | 0 | 0 | 0 | OK |
| E09 | V06>V05 | 5.64 | 7.06 | 1.25 | 143 | 0 | 0 | 0 | OK |
| E10 | V02>H02 | 0.15 | 0.17 | 1.14 | 55 | 0 | 0 | 0 | FLAG: ratio 1.14 < 1.2 |
| E11 | V03>H03 | 0.15 | 0.41 | 2.77 | 207 | 0 | 0 | 0 | FLAG: ratio 2.77 > 1.8 |
| E12 | V07>V08 | 8.64 | 8.96 | 1.04 | 319 | 0 | 0 | 0 | FLAG: ratio 1.04 < 1.2 |

## Flagged Edges Summary

- **E01** (H01>V01): gap 602m > 500m, backtrack_segs=2
- **E02** (V01>V03): gap 947m > 500m, backtrack_segs=16
- **E03** (V01>V02): gap 663m > 500m, backtrack_segs=8
- **E04** (V03>V02): ratio 7.75 > 1.8; gap 538m > 500m, backtrack_segs=0
- **E05** (V03>V07): ratio 2.28 > 1.8; gap 738m > 500m, backtrack_segs=9
- **E10** (V02>H02): ratio 1.14 < 1.2, backtrack_segs=0
- **E11** (V03>H03): ratio 2.77 > 1.8, backtrack_segs=0
- **E12** (V07>V08): ratio 1.04 < 1.2, backtrack_segs=0

## Notes on Severe Cases

- **E04**: ratio 7.75 — straight 2.16 km, geom 16.74 km. Coordinates likely from a wrong road segment.
- **E06**: ratio 3.76, max gap 1203m — duplicated or wrongly ordered OSM segments.
- **E07**: ratio 3.41 — significantly inflated for a short road.
- **E02**: 16 backtrack segments — severe zigzag, coordinates may be doubled.

## Edges Passing All Checks

- **E06** (V07>V04): ratio=1.51, max_gap=233m
- **E07** (V04>V08): ratio=1.40, max_gap=215m
- **E08** (V04>V06): ratio=1.60, max_gap=284m
- **E09** (V06>V05): ratio=1.25, max_gap=143m