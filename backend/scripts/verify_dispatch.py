"""
Verification Script for Dynamic Resource Allocation & Evacuation (/dispatch/plan)
"""

import sys
import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=" * 75)
print("TESTING DYNAMIC RESOURCE ALLOCATION: GET /dispatch/plan?rainfall_mm=85.0")
print("=" * 75)

resp = client.get("/dispatch/plan?rainfall_mm=85.0&prior1=0.0&prior2=0.0&hours=2.0")
assert resp.status_code == 200, f"Error {resp.status_code}: {resp.text}"

plan = resp.json()

print(f"Status: {plan['status']}")
print(f"Scenario Rainfall: {plan['scenario']['rainfall_mm']} mm | Blocked Roads: {plan['scenario']['blocked_roads_count']}")
print(f"Blocked Road IDs: {plan['scenario']['blocked_edge_ids']}")
print(f"Summary: {plan['summary']['total_cut_off_settlements']} settlements cut off | {plan['summary']['total_isolated_population']} total population isolated")

print("\n--- ACTIVE DEPOTS STATUS (Configurable Inventory) ---")
for d in plan["depots_status"]:
    avail = d["available"]
    disp = d["dispatched"]
    print(f"  {d['name']} ({d['id']}):")
    print(f"    Available:  Amb: {avail.get('ambulance',0)}, Rescue: {avail.get('rescue_team',0)}, Excv: {avail.get('excavator',0)}, Med: {avail.get('medical_team',0)}")
    print(f"    Dispatched: Amb: {disp.get('ambulance',0)}, Rescue: {disp.get('rescue_team',0)}, Excv: {disp.get('excavator',0)}, Med: {disp.get('medical_team',0)}")

print("\n--- CUT-OFF SETTLEMENTS TRIAGE, NEEDS & 3-WAY MITIGATION ---")
for s in plan["dispatches"]:
    print(f"\n[PRIORITY {s['triage_priority']}] {s['settlement_name']} (Pop: {s['population']}):")
    
    # Needs
    needs = s["calculated_needs"]
    print(f"  * Calculated Needs: {needs['critical_patients']} critical patients, {needs['ambulances_needed']} ambulances, {needs['rescue_teams_needed']} rescue teams, {needs['excavator_needed']} excavator, {needs['relief_kits_needed']} relief kits")
    
    # Patient Evacuation
    pe = s["patient_evacuation"]
    print(f"  * Patient Evacuation: Status: {pe['status']} | Mode: {pe['transport_mode']}")
    if pe['status'] == 'surface_evacuation_viable':
        print(f"    Hospital: {pe['primary_hospital']} | Route: {' -> '.join(pe['evacuation_route'])} | ETA: {pe['eta_minutes']} mins")
    else:
        print(f"    Reason: {pe['reason']}")
        print(f"    Target Hospital: {pe['primary_hospital']} | Staging: {pe.get('staging_helipad')}")
        
    # Mitigation Options
    mit = s["mitigation_evaluation"]
    opt_a = mit["option_a_alternate_route"]
    opt_b = mit["option_b_excavator_clearance"]
    opt_c = mit["option_c_foot_or_aerial"]
    
    print(f"  * Option (a) Alternate Route: {'Available' if opt_a.get('available') else 'BLOCKED'} ({opt_a.get('description', opt_a.get('reason'))})")
    print(f"  * Option (b) Excavator Clearance: {opt_b.get('description')} [Total Clearance ETA: {opt_b.get('total_clearance_eta_hours')} hours]")
    print(f"  * Option (c) Aerial/Foot Transit: Mode: {opt_c.get('mode')} | ETA: {opt_c.get('total_eta_mins')} mins | Urgency: {opt_c.get('aerial_urgency')}")
    print(f"    Details: {opt_c.get('description')}")
    
    # Assigned Resources
    print(f"  * Assigned Units ({len(s['assigned_resources'])}):")
    for u in s["assigned_resources"]:
        print(f"    - {u['quantity']}x {u['resource_type'].upper()} from {u['depot_name']} (ETA: {u['eta_minutes']}m | Mode: {u['dispatch_mode']})")

print("\n" + "=" * 75)
print("LEGACY ENDPOINT RETENTION CHECK: /prioritize/resources?rainfall_mm=85")
print("=" * 75)
legacy_resp = client.get("/prioritize/resources?rainfall_mm=85.0")
assert legacy_resp.status_code == 200, f"Legacy endpoint failed: {legacy_resp.text}"
legacy_data = legacy_resp.json()
print(f"Legacy allocations count: {len(legacy_data.get('assignments', []))}")
print(f"Legacy message: {legacy_data.get('message')}")
print("=> SUCCESS: Both dynamic /dispatch/plan and legacy /prioritize/resources work seamlessly!")
