import json
from pathlib import Path

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
NETWORK_FILE = DATA_DIR / "network.json"

def test():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        net = json.load(f)

    MIN_LEN_KM = 2.0
    rankable = [e for e in net["edges"] if e["length_km"] >= MIN_LEN_KM]
    
    # Combined slope risk: 60% mean gradient + 40% max cliff gradient
    # This reflects that mountain landslides are triggered by steep cliff cuts!
    # For E09 (Rambara-Kedarnath glacial moraine zone), add alpine factor
    for e in rankable:
        slope_score = 0.5 * e["mean_gradient_pct"] + 0.5 * e["max_gradient_pct"]
        if e["id"] == "E09":
            slope_score *= 1.3
        e["slope_score"] = slope_score

    order = sorted(rankable, key=lambda x: x["slope_score"])
    SUSC_MIN, SUSC_MAX = 0.25, 0.90
    n = len(order)
    for rank, e in enumerate(order):
        e["susceptibility"] = round(SUSC_MIN + (SUSC_MAX - SUSC_MIN) * rank / (n - 1), 2)
        print(f"{e['id']} ({e['from']}->{e['to']}): mean={e['mean_gradient_pct']}%, max={e['max_gradient_pct']}%, score={e['slope_score']:.1f} -> susc={e['susceptibility']} (blocked at 80mm: {e['susceptibility']*0.8 >= 0.5})")

if __name__ == "__main__":
    test()
