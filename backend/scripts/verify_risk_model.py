"""
Verification script for Explainable Time-Based Risk Model (v2)
Tests:
1. /risk/timeline endpoint response
2. /risk/segment/E06 explainability breakdown
3. Monotonicity proof: As rainfall increases, does blocked set grow monotonically?
4. Reason tracking for each newly blocked segment.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 70)
print("1. TEST /risk/timeline?hours=6")
print("=" * 70)
r = client.get("/risk/timeline?hours=6")
assert r.status_code == 200, f"Timeline failed with status {r.status_code}: {r.text}"
t_data = r.json()
print(f"Status: {t_data['status']}")
print(f"Network source evaluated: {t_data['network_source']}")
print(f"Total segments evaluated: {t_data['total_segments_evaluated']}")
print(f"Caine critical threshold (1h): {t_data['caine_threshold_mm_hr']} mm/hr")
print(f"Timeline steps returned: {len(t_data['timeline'])}")
for step in t_data['timeline'][:3]:
    print(f"  Hour {step['hour']} ({step['time']}): Rain={step['rainfall_mm']} mm | Blocked={step['blocked_count']} | Isolated Pop={step['isolated_population']}")
    if step['top_risky_segments']:
        top1 = step['top_risky_segments'][0]
        print(f"    Top risk: {top1['segment_id']} ({top1['name']}) -> Prob: {top1['probability']:.3f} | Cause: {top1['dominant_cause']}")

print("\n" + "=" * 70)
print("2. TEST /risk/segment/E06 EXPLAINABILITY BREAKDOWN")
print("=" * 70)
r_seg = client.get("/risk/segment/E06?rainfall_mm=16.0&prior1=20.0&prior2=10.0")
assert r_seg.status_code == 200, f"Segment check failed: {r_seg.text}"
s_data = r_seg.json()
print(f"Segment: {s_data['segment_id']} ({s_data['name']})")
print(f"Length: {s_data['length_km']} km | Class: {s_data['road_class']}")
print(f"Total Probability: {s_data['probability']} (Blocked: {s_data['blocked']})")
print("Explainable Component Reasons:")
for k, v in s_data['reasons'].items():
    print(f"  - {k}: {v}")

print("\n" + "=" * 70)
print("3. MONOTONICITY & INCREMENTAL REASON VERIFICATION")
print("=" * 70)
rainfall_steps = [0, 5, 10, 15, 20, 25, 30]
previous_blocked = set()

print(f"{'Rainfall (mm/hr)':<18} | {'Blocked Count':<14} | {'New Segments Added':<20} | {'Primary Reason / Trigger'}")
print("-" * 80)

for rf in rainfall_steps:
    r_sim = client.get(f"/risk/simulation?rainfall_mm={rf}&prior1=10.0&prior2=5.0&threshold=0.50")
    assert r_sim.status_code == 200
    res = r_sim.json()
    current_blocked = set(res["blocked_segments"])
    
    # Monotonicity test: Previous blocked MUST be a subset of current blocked
    is_subset = previous_blocked.issubset(current_blocked)
    assert is_subset, f"MONOTONICITY VIOLATION at {rf}mm! {previous_blocked} not in {current_blocked}"
    
    newly_added = current_blocked - previous_blocked
    new_reasons = []
    if newly_added:
        for seg in res["segments"]:
            if seg["segment_id"] in newly_added:
                new_reasons.append(f"{seg['segment_id']}: {seg['reasons']['explanation']}")
        reasons_str = "; ".join(new_reasons)
    else:
        reasons_str = "None (Threshold unchanged)"
        
    print(f"{rf:<18} | {len(current_blocked):<14} | {str(list(newly_added)):<20} | {reasons_str}")
    previous_blocked = current_blocked

print("\n=> STRICT MONOTONICITY CHECK PASSED: B(r1) is always subset of B(r2) for r1 <= r2.")
