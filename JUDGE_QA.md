# Terranex — Judge Q&A & Technical Defense

Honest, transparent, and direct responses to common technical questions from hackathon evaluators.

---

### 1. Ye numbers kahan se aaye? (Populations, Road lengths, Susceptibilities)
- Village populations (~450 to ~2,400) aur road lengths (`length_km`) hackathon prototype ke liye indicative placeholders hain.
- Road susceptibilities SRTM/DEM (Digital Elevation Model) mean slope gradients ke basis par percentile-ranked relative index ($0.10$ se $0.90$) hain, geotechnical laboratory failure probabilities nahi.

---

### 2. ML model kyun nahi hai?
- Abhi landslide inventory training data nahi hai, isliye rule-based + terrain ranking. Data milne par risk_model.py mein ML plug hoga.

---

### 3. Paths approximate kyun hain?
- `E01–E05` aur `E10–E11` OpenStreetMap ke highway alignments se extracted hain.
- `E06, E07, E08, E09, E12` ke liye OSM geometry missing ya fragmented thi, isliye unhe actual mountain coordinates ke beech natural switchback splines se approximate kiya gaya hai (start/end nodes 0.0 m accurate hain).

---

### 4. E09 ki susceptibility manual kyun hai?
- E09 ko landslide-prone trek corridor maan ke manually 0.88 rakha. Ye expert judgment hai, DEM se nahi nikla.

---

### 5. Live rainfall ek hi point se kyun?
- Free Open-Meteo API Rudraprayag district ke central coordinate (`30.2844, 78.9811`) se query ki ja rahi hai.
- Production mein district ke alag-alag local stations se multi-point elevation-dependent rainfall lena hoga.

---

### 6. 72h weights kahan se aaye?
- Antecedent formula ($\text{effective} = p_0 + 0.5 \cdot p_1 + 0.25 \cdot p_2$) ek prototype exponential decay heuristic hai jo saturated soil mass ko simulate karta hai.
- Ye weights prototype hain, kisi geotechnical/hydrological research paper se field-calibrated nahi hain.

---

### 7. Real data (ISRO/GSI) ke saath ye kaise improve hoga?
- GSI/ISRO ke official landslide inventory aur geological layers milne par heuristic ranking ki jagah calibrated susceptibility aayegi.
- Multi-point weather data aur satellite soil moisture integration se 72h antecedent rainfall accurate physically calibrated data ban jayega.
