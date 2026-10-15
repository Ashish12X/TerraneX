# Terranex — 3-Minute Live Demo Pitch Script

**Target Audience:** Hackathon Judges / Disaster Management Stakeholders  
**Time Limit:** 2.5 to 3 minutes  
**Goal:** Showcase graph-based cascade failure, intelligent rerouting, resource triage, and honest engineering transparency.

---

## 0:00 - 0:30 | Hook & Problem Definition
**What to show:**
- Open `http://localhost:5173` on full screen.
- Point to the interactive map of Rudraprayag showing 8 villages and 3 referral hospitals.

**What to say:**
> *"Judges, in Uttarakhand’s high-altitude valleys, a single cloudburst doesn't just damage one road—it triggers a cascade. When road links snap, remote Himalayan villages get cut off from surgical care, and emergency control rooms have no real-time graph intelligence to know which community gets severed first.  
> This is **Terranex**—a valley cascade simulation and triage platform specifically modeled for Rudraprayag district."*

---

## 0:30 - 1:15 | Preset Scenarios (The Cascade Effect)

### 1. Normal State (20 mm)
**Action:** Click the **"Normal (20 mm)"** preset tab.  
**What the UI shows:**
- Blocked Roads: `0`
- Isolated Villages: `0` (0 population isolated)
- All roads green; full hospital connectivity across the district.  
**What to say:**
> *"At 20 mm normal rainfall, all 12 road corridors are operational. Every village has direct connectivity to District Hospital Rudraprayag, CHC Ukhimath, or PHC Guptkashi."*

### 2. Pre-alert State (55 mm)
**Action:** Click the **"Pre-alert (55 mm)"** preset tab.  
**What the UI shows:**
- Blocked Roads: `0`
- Isolated Villages: `0`
- Edge colors turn amber as high-slope road segments experience elevated risk score ($\approx 0.40 - 0.48$), approaching the $0.50$ failure threshold.  
**What to say:**
> *"At 55 mm, roads aren't blocked yet, but steep corridors are nearing their structural threshold. Terranex issues an early alert before connectivity snaps."*

### 3. Upper Valley Cutoff (85 mm) — The Tipping Point
**Action:** Click the **"Upper Valley Cutoff (85 mm)"** preset tab.  
**What the UI shows:**
- Blocked Roads: `5` (`E06, E07, E08, E09, E12` red dashed lines)
- Isolated Villages: `4` (`Sonprayag, Kedarnath, Rambara, Triyuginarayan`)
- Isolated Population: `3,720` citizens at critical risk.  
**What to say:**
> *"At 85 mm, the upper valley experiences a catastrophic severance. 5 steep mountain corridors fail simultaneously. Notice how 4 villages—Sonprayag, Kedarnath, Rambara, and Triyuginarayan—are completely cut off from all 3 hospitals, isolating 3,720 people."*

### 3b. Antecedent Soil Saturation ("Prior Wet Days")
**Action:**
Set today's slider to **40 mm**, and drag **Rain 24-48h ago** to **60 mm** (Rain 48-72h ago = 0 mm).  
**What the UI shows:**
- Display: `Effective rainfall: 70 mm (today + weighted prior days)`
- Formula: $40 + 0.5 \times 60 + 0.25 \times 0 = 70.0\text{ mm}$
- Blocked Roads: `4` (`E06, E07, E09, E12`)
- Isolated Villages: `4` (`Sonprayag, Kedarnath, Rambara, Triyuginarayan`)
- Isolated Population: `3,720`
- Note shown: `Weights prototype hain, calibrated nahi.`  
**What to say:**
> *"Now notice this realistic crisis capability: Prior Wet Days. If we look at today's rainfall in isolation at 40 mm, roads appear safe. But if yesterday had 60 mm of rain, antecedent soil saturation elevates the effective load to 70 mm. Look at the map: even at 40 mm today, 4 roads snap and 3,720 people in the upper valley are cut off. (Note: the 0.5 and 0.25 decay weights are prototype heuristics, not yet calibrated to hydrological field literature.)"*

### 4. Cloudburst Crisis (130 mm)
**Action:** Click the **"Cloudburst Crisis (130 mm)"** preset tab.  
**What the UI shows:**
- Blocked Roads: `8`
- Isolated Villages: `5` (+ `Phata`)
- Isolated Population: `4,820`  
**What to say:**
> *"At 130 mm cloudburst levels, 8 roads collapse. The crisis extends down-valley to Phata, trapping 4,820 civilians."*

---

## 1:15 - 1:55 | Dynamic Safe Routing & Foot-Trek Section

**Action:**
1. Switch back to **20 mm** (or slider at 20 mm).
2. Click on the **Kedarnath** node (`V05`) on the map or village list.
3. Observe the Route Card in the left sidebar.

**What the UI shows:**
- Safe Route: `Kedarnath ➔ Rambara ➔ Sonprayag ➔ Phata ➔ Guptkashi ➔ PHC Guptkashi` (65.5 km)
- Badge displayed:
  `Foot trek section: ambulance cannot pass`

**What to say:**
> *"Look at what happens when an evacuation is dispatched to Kedarnath. Terranex doesn't treat all links as standard highways.  
> It recognizes edge E09 as a non-motorable pedestrian trail. The router outputs a dedicated warning badge: **'Foot trek section: ambulance cannot pass'**, informing central dispatch that the final 7 km must be handled on foot or by air evacuation, preventing ambulances from driving into a mountain dead-end."*

---

## 1:55 - 2:30 | Triage Dispatch & Live Telemetry

**Action:**
1. Switch back to **85 mm** preset.
2. In the sidebar, scroll down to the **"Dynamic Resource Dispatch (Triage)"** card.
3. Click on the **Live Radar (Open-Meteo)** tab. Show the **"72h wet"** option.

**What the UI shows:**
- In Triage: Limited available assets (`AMB-1`, `AMB-2`, `TEAM-1`, `TEAM-2`, `EXC-1`) are automatically assigned to the most vulnerable isolated villages (`Sonprayag`, `Triyuginarayan`, etc.).
- In Live Radar: 3 options (`Last 24h`, `72h wet`, `Forecast`) with live telemetry from Open-Meteo ($8.4\text{ mm}$ past, $8.5\text{ mm}$ effective antecedent wet-soil index).

**What to say:**
> *"When disaster strikes, resources are strictly limited. Terranex automatically triages the isolated communities—dispatching heavy excavators to clear critical bottlenecks and assigning medical teams where isolation scores are highest.  
> Furthermore, in Live Mode, we calculate 72-hour antecedent rainfall because wet, pre-saturated soil triggers landslides much earlier than dry terrain."*

---

## 2:30 - 3:00 | Honest Limitations & Wrap Up

**What to say:**
> *"To be completely transparent about our current engineering status:  
> - Our DEM slope rankings provide relative risk rather than geotechnical failure probabilities.  
> - 5 road geometries use approximated splines rather than full GPS road surveys.  
> - And our 72-hour decay weights are prototype heuristics, not yet calibrated to hydrological field studies.  
> 
> But the core architecture is proven: real-time graph intelligence that shifts disaster response from chaotic guesswork to automated, lives-saving clarity. Thank you."*
