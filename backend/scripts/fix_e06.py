"""
Fix E06 geometry:
- Remove the duplicated first segment (idx 1-54, which repeats)
- Keep idx=0 (from-node) + idx=55 onwards (the true path from Phata to Sonprayag)
- Verify the resulting ratio makes sense
"""
import json, math, os

def haversine(a, b):
    R = 6371000
    la1, lo1 = math.radians(a[0]), math.radians(a[1])
    la2, lo2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = la2-la1, lo2-lo1
    h = math.sin(dlat/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return R*2*math.asin(math.sqrt(h))

net_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'network.json')
d = json.load(open(net_path))
edges = {e['id']: e for e in d['edges']}

e = edges['E06']
coords = e['coordinates']

print("Before fix:")
print(f"  Points: {len(coords)}")
total_before = sum(haversine(coords[i], coords[i+1]) for i in range(len(coords)-1))
print(f"  Geom length: {total_before/1000:.2f} km")
print(f"  Straight (Phata->Sonprayag): ~5.51 km")

# The fix: coords[0] is the Phata node correctly
# coords[1] jumps 973m to [30.6051, 79.0173] — that is idx=55 too
# The segment idx=1..54 is a loop going south of Phata (wrong way)
# idx=55 onwards is the real road going north toward Sonprayag
# So: keep coords[0], then skip to idx=55 onwards

# Let's verify the gap location
gap_at = None
for i in range(len(coords)-1):
    g = haversine(coords[i], coords[i+1])
    if g > 1000:
        gap_at = i
        print(f"  Large gap at idx {i}->{i+1}: {g:.0f}m")
        print(f"    coords[{i}]   = {coords[i]}")
        print(f"    coords[{i+1}] = {coords[i+1]}")

# Check if coords[1] == coords[gap_at+1] (confirming the loop)
if gap_at:
    print(f"\n  coords[1] = {coords[1]}")
    print(f"  coords[{gap_at+1}] = {coords[gap_at+1]}")
    dist_check = haversine(coords[1], coords[gap_at+1])
    print(f"  Distance between coords[1] and coords[{gap_at+1}]: {dist_check:.0f}m")

# Build fixed coords: node[0] + coords[gap_at+1:]
fixed = [coords[0]] + coords[gap_at+1:]
total_after = sum(haversine(fixed[i], fixed[i+1]) for i in range(len(fixed)-1))
print(f"\nAfter fix:")
print(f"  Points: {len(fixed)}")
print(f"  Geom length: {total_after/1000:.2f} km")
straight = 5.51
print(f"  Ratio: {(total_after/1000)/straight:.2f}")

# Check for remaining large gaps
max_gap = max(haversine(fixed[i], fixed[i+1]) for i in range(len(fixed)-1))
print(f"  Max gap: {max_gap:.0f}m")

# Verify start/end
from_lat, from_lon = 30.608, 79.027
to_lat, to_lon = 30.631, 79.078
print(f"  Start: {fixed[0]} (should be ~[30.608, 79.027])")
print(f"  End:   {fixed[-1]} (should be ~[30.631, 79.078])")
