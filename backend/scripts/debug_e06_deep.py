"""
Deep analysis of E06 after removing the duplicate loop.
Check the direction and shape of remaining coordinates.
"""
import json, math, os

def haversine(a, b):
    R = 6371000
    la1, lo1 = math.radians(a[0]), math.radians(a[1])
    la2, lo2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = la2-la1, lo2-lo1
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return R*2*math.asin(math.sqrt(h))

d = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')))
edges = {e['id']: e for e in d['edges']}
e = edges['E06']
coords = e['coordinates']

# After removing loop: coords[0] + coords[55:]
fixed = [coords[0]] + coords[55:]

print("=== E06 after loop removal ===")
print(f"  {len(fixed)} points")

# Print every ~20 points to see the shape
print(f"\nKey points along route:")
for i in [0, 10, 20, 30, 50, 70, 100, 130, 160, 200, 230, 260, 280, 290, 291]:
    if i < len(fixed):
        gap = haversine(fixed[i-1], fixed[i]) if i > 0 else 0
        print(f"  [{i}] {fixed[i]}  gap={gap:.0f}m")

# Check ratio breakdown: how does the route meander?
lats = [c[0] for c in fixed]
lons = [c[1] for c in fixed]
print(f"\nLat range: {min(lats):.4f} to {max(lats):.4f}")
print(f"Lon range: {min(lons):.4f} to {max(lons):.4f}")

# The Phata-Sonprayag road: Phata is at 30.608, 79.027, Sonprayag at 30.631, 79.078
# Expected: goes mostly north-east
# Is the route doing something weird west of 79.027?
west_pts = [(i,c) for i,c in enumerate(fixed) if c[1] < 79.020]
if west_pts:
    print(f"\nPoints west of 79.020 (suspicious):")
    for i,c in west_pts[:10]:
        print(f"  [{i}] {c}")

# Large gaps
print(f"\nGaps > 200m:")
for i in range(1, len(fixed)):
    g = haversine(fixed[i-1], fixed[i])
    if g > 200:
        print(f"  [{i-1}]->[{i}]: {g:.0f}m  {fixed[i-1]} -> {fixed[i]}")

# Cumulative distance at each tenth
print(f"\nCumulative dist at checkpoints:")
cum = 0
for i in range(1, len(fixed)):
    cum += haversine(fixed[i-1], fixed[i])
    if i in [0, 50, 100, 150, 200, 250, 291]:
        print(f"  [{i}] cum={cum/1000:.2f}km  coord={fixed[i]}")
