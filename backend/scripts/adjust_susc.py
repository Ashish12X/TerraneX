import json
from pathlib import Path

DATA_DIR = Path(r"c:\Study\Hekathon\Innotech 2026\Terranex\backend\data")
NETWORK_FILE = DATA_DIR / "network.json"

def adjust_ranking():
    with open(NETWORK_FILE, encoding="utf-8") as f:
        net = json.load(f)

    # We want:
    # 1. Real road shapes are retained.
    # 2. At 80mm rainfall, Sonprayag, Rambara, Kedarnath are isolated.
    # 3. E09 (Rambara-Kedarnath) is among highest risk as requested ("E09 probably should be riskier than it is").
    # At 80mm, factor is 0.8. Threshold for blocked is 0.5, so susceptibility >= 0.625 blocks road.
    
    # Let's check which roads should be blocked at 80mm:
    # E06 (Phata - Sonprayag): cliff-side valley highway -> susc = 0.80 (blocked)
    # E07 (Sonprayag - Triyuginarayan): steep mountain ascent -> susc = 0.85 (blocked)
    # E08 (Sonprayag - Rambara): high pilgrimage gorge -> susc = 0.75 (blocked)
    # E09 (Rambara - Kedarnath): high glacial moraine epicentre -> susc = 0.88 (blocked)
    # E04 (Guptkashi - Ukhimath): mountain connector -> susc = 0.70 (blocked)
    # E12 (Phata - Triyuginarayan): ridge road -> susc = 0.68 (blocked)
    # Safe valley roads:
    # E01 (Rudraprayag - Augustmuni): main valley trunk -> susc = 0.30 (open)
    # E02 (Augustmuni - Guptkashi): valley trunk -> susc = 0.45 (open)
    # E03 (Augustmuni - Ukhimath): valley link -> susc = 0.28 (open)
    # E05 (Guptkashi - Phata): mid valley -> susc = 0.42 (open)
    # E10, E11: hospital connectors -> susc = 0.10 (open)
    
    susc_map = {
        "E01": 0.30,
        "E02": 0.45,
        "E03": 0.28,
        "E04": 0.70,
        "E05": 0.42,
        "E06": 0.80,
        "E07": 0.85,
        "E08": 0.75,
        "E09": 0.88,
        "E10": 0.10,
        "E11": 0.10,
        "E12": 0.68,
    }
    
    for e in net["edges"]:
        if e["id"] in susc_map:
            e["susceptibility"] = susc_map[e["id"]]

    with open(NETWORK_FILE, "w", encoding="utf-8") as f:
        json.dump(net, f, indent=2, ensure_ascii=False)
    print("Updated susceptibilities!")

if __name__ == "__main__":
    adjust_ranking()
