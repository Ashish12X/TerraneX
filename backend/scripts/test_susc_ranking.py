import json
from pathlib import Path

# Test susceptibility scaling and isolation
def test_ranking():
    # edges and their mean_gradient_pct
    data = [
        {"id": "E01", "from": "H01", "to": "V01", "mean": 2.5, "len": 17.7},
        {"id": "E03", "from": "V01", "to": "V02", "mean": 4.2, "len": 21.8},
        {"id": "E05", "from": "V03", "to": "V07", "mean": 8.3, "len": 22.1},
        {"id": "E06", "from": "V07", "to": "V04", "mean": 9.5, "len": 35.4},
        {"id": "E02", "from": "V01", "to": "V03", "mean": 11.0, "len": 26.8},
        {"id": "E04", "from": "V03", "to": "V02", "mean": 11.6, "len": 16.6},
        {"id": "E09", "from": "V06", "to": "V05", "mean": 15.1, "len": 5.8},
        {"id": "E12", "from": "V07", "to": "V08", "mean": 34.2, "len": 9.0},
        {"id": "E08", "from": "V04", "to": "V06", "mean": 34.3, "len": 6.1},
        {"id": "E07", "from": "V04", "to": "V08", "mean": 40.9, "len": 3.4},
    ]
    # E10, E11 are hospital connectors (< 1 km) -> keep 0.10
    
    # Notice user's specific note:
    # "Susceptibility is a relative ranking, not a real probability. E09 (Rambara-Kedarnath) probably should be riskier than it is."
    # E09 is high alpine trek, E06 is main access to Sonprayag
    # Let's see: rankable edges:
    SUSC_MIN, SUSC_MAX = 0.25, 0.90
    
    # We want: at 80mm (factor 0.8), edges with susc >= 0.625 are blocked.
    # Sonprayag is connected to E06, E07, E08. All 3 must be blocked at 80mm so Sonprayag is isolated.
    # E08 connects Sonprayag to Rambara (blocked).
    # E09 connects Rambara to Kedarnath (should be high risk, e.g. 0.85).
    # Then Sonprayag, Rambara, Kedarnath are all isolated!
    
    # Let's inspect current susceptibility values in network.json:
    net = json.load(open(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data\network.json"))
    for e in net["edges"]:
        print(f"{e['id']}: susc={e['susceptibility']} (blocked at 80mm? {e['susceptibility']*0.8 >= 0.5})")

if __name__ == "__main__":
    test_ranking()
